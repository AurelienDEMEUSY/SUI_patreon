#!/usr/bin/env bash
# DePatreon — Lancer toute la stack avec Docker Compose
# Usage: ./scripts/run.sh [up|down|build|logs]

set -e
cd "$(dirname "$0")/.."

cmd="${1:-up}"

case "$cmd" in
  up)
    echo "🐘 Starting PostgreSQL, Indexer, API, Frontend..."
    docker compose up -d
    echo ""
    echo "✅ DePatreon stack is running:"
    echo "   Frontend:  http://localhost:3000"
    echo "   API:       http://localhost:3001"
    echo "   Postgres:  localhost:5432"
    echo ""
    echo "Run 'docker compose logs -f' to follow logs"
    ;;
  down)
    echo "🛑 Stopping DePatreon stack..."
    docker compose down
    ;;
  build)
    echo "🔨 Building all images..."
    docker compose build
    ;;
  logs)
    docker compose logs -f
    ;;
  *)
    echo "Usage: $0 {up|down|build|logs}"
    echo "  up    - Start all services (default)"
    echo "  down  - Stop all services"
    echo "  build - Rebuild images"
    echo "  logs  - Follow logs"
    exit 1
    ;;
esac
