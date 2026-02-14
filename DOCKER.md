# DePatreon — Lancer la stack complète avec Docker

## Services

| Service | Port | Description |
|---------|------|-------------|
| **postgres** | 5432 | Base PostgreSQL pour l'indexeur |
| **indexer** | — | Worker Rust qui indexe la blockchain SUI |
| **api** | 3001 | API REST (creators, posts, subscriptions) |
| **app** | 3000 | Frontend Next.js |

## Quick Start

```bash
# 1. Copier l'exemple d'environnement (optionnel)
cp .env.docker.example .env

# 2. Lancer toute la stack
docker compose up -d

# Ou utiliser le script
./scripts/run.sh up
```

- **Frontend** : http://localhost:3000  
- **API** : http://localhost:3001  

## Commandes utiles

```bash
# Rebuild les images
docker compose build

# Voir les logs
docker compose logs -f

# Arrêter
docker compose down
./scripts/run.sh down
```

## Variables d'environnement

Voir `.env.docker.example`. Les variables importantes :

- `NEXT_PUBLIC_INDEXER_API_URL` — URL de l'API pour le frontend (défaut: `http://localhost:3001`)
- `NEXT_PUBLIC_PACKAGE_ID` / `NEXT_PUBLIC_PLATFORM_ID` — IDs du contrat déployé
- `PACKAGE_ID` — ID du package pour filtrer les événements (indexeur)

## Sans Docker (dev local)

Script tout-en-un :

```bash
./scripts/run-local.sh
```

Démarre Postgres (Docker si besoin), indexer, API et frontend. Ctrl+C arrête tout.

Ou manuellement (4 terminaux) :

```bash
# Terminal 1 : PostgreSQL
docker compose up -d postgres

# Terminal 2 : Indexer
cd indexer && cargo run -- --remote-store-url https://checkpoints.testnet.sui.io

# Terminal 3 : API
cd indexer && cargo run --bin api

# Terminal 4 : Frontend
cd app && pnpm dev
```
