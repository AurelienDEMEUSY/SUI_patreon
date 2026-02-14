#!/usr/bin/env bash
# DePatreon — Lancer toute la stack à la main (sans Docker)
# Usage: ./scripts/run-local.sh
#
# Prérequis:
#   - PostgreSQL (local ou via docker compose up -d postgres)
#   - Rust + cargo
#   - pnpm
#
# Le script démarre Postgres (Docker) si besoin, puis indexer, API et frontend.

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# PIDs des processus lancés en arrière-plan
PIDS=()

cleanup() {
  echo ""
  echo "🛑 Arrêt des processus..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

# -----------------------------------------------------------------------------
# 1. PostgreSQL
# -----------------------------------------------------------------------------
echo "🐘 Vérification de PostgreSQL..."
POSTGRES_OK=false
# Port 5432 ouvert = postgres prêt
(echo >/dev/tcp/localhost/5432) 2>/dev/null && POSTGRES_OK=true

if [ "$POSTGRES_OK" = false ] && command -v docker &>/dev/null; then
  echo "   Démarrage PostgreSQL via Docker..."
  docker compose up -d postgres
  echo "   Attente du démarrage (15s)..."
  sleep 15
  for i in $(seq 1 30); do
    (echo >/dev/tcp/localhost/5432) 2>/dev/null && POSTGRES_OK=true && break
    sleep 1
  done
fi

if [ "$POSTGRES_OK" = false ]; then
  echo "   ❌ PostgreSQL non disponible sur localhost:5432"
  echo "   Lancez: docker compose up -d postgres"
  echo "   Ou configurez une base locale et exportez DATABASE_URL"
  exit 1
fi
echo "   ✓ PostgreSQL prêt."

# -----------------------------------------------------------------------------
# 2. Indexer (Rust)
# -----------------------------------------------------------------------------
echo ""
echo "📥 Démarrage de l'indexer (1ère exécution = compilation, ~2-5 min)..."
cd "$ROOT/indexer"
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi
export DATABASE_URL="${DATABASE_URL:-postgres://depatreon:depatreon@localhost:5432/depatreon_indexer}"
export PACKAGE_ID="${PACKAGE_ID:-0x778ecde37896bf33ce157208cbd90a3d7e42475de59875d66f9db34031258d12}"

cargo run -- --remote-store-url "https://checkpoints.testnet.sui.io" &
PIDS+=($!)
cd "$ROOT"
sleep 3

# -----------------------------------------------------------------------------
# 3. API REST (Rust)
# -----------------------------------------------------------------------------
echo ""
echo "🌐 Démarrage de l'API REST (port 3001)..."
cd "$ROOT/indexer"
export DATABASE_URL="${DATABASE_URL:-postgres://depatreon:depatreon@localhost:5432/depatreon_indexer}"
cargo run --bin api &
PIDS+=($!)
cd "$ROOT"
sleep 2

# -----------------------------------------------------------------------------
# 4. Frontend (Next.js)
# -----------------------------------------------------------------------------
echo ""
echo "⚛️  Démarrage du frontend (port 3000)..."
cd "$ROOT/app"
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi
export NEXT_PUBLIC_INDEXER_API_URL="${NEXT_PUBLIC_INDEXER_API_URL:-http://localhost:3001}"
pnpm dev &
PIDS+=($!)
cd "$ROOT"

echo ""
echo "✅ DePatreon est lancé !"
echo "   Frontend:  http://localhost:3000"
echo "   API:       http://localhost:3001"
echo ""
echo "Ctrl+C pour tout arrêter."
echo ""

wait
