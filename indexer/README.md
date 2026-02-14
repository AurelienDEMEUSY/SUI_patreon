# DePatreon Custom Indexer

Rust-based custom indexer for DePatreon, using [sui-indexer-alt-framework](https://docs.sui.io/guides/developer/accessing-data/custom-indexer/build). Indexes creators, posts, subscriptions to PostgreSQL for full-text search, aggregations, and low-latency queries.

## Prerequisites

- Rust 1.75+
- PostgreSQL 16+
- **libpq** (client PostgreSQL) — Ubuntu/Debian: `sudo apt install libpq-dev`
- [Diesel CLI](https://diesel.rs/guides/getting-started#installing-diesel-cli): `cargo install diesel_cli --no-default-features --features postgres`

## Quick Start

### 1. Create database

```sh
createdb depatreon_indexer
```

### 2. Configure environment

```sh
cp .env.example .env
# Edit .env with your DATABASE_URL
```

### 3. Run indexer

```sh
cargo run -- --remote-store-url https://checkpoints.testnet.sui.io
```

Migrations run automatically on startup. The indexer streams checkpoints from SUI Testnet and stores transaction events in `events_log`.

### 4. Verify

```sh
psql depatreon_indexer -c "SELECT COUNT(*) FROM events_log;"
```

## Schema

- **creators** — Creator profiles (service_object_id, name, description, avatar, tiers)
- **tiers** — Subscription tiers per creator
- **posts** — Creator posts (title, blob IDs, required_tier)
- **subscriptions** — Active subscriptions (subscriber, creator, tier, expires_at_ms)
- **events_log** — Raw event log (event_type, checkpoint, tx_digest, data JSONB)

## Extending the indexer

The current `EventLogHandler` indexes all transactions as generic events. To index DePatreon-specific data:

1. **CreatorRegistered** — Parse `object_changes` for created `Service` objects; insert into `creators`.
2. **CreatorDeleted** — On `CreatorDeleted` event, set `deleted_at` on the creator.
3. **PostPublished** — On `PostPublished` event, extract post from mutated Service in object_changes.
4. **SubscriptionPurchased/Renewed** — Parse events and upsert into `subscriptions`.

Filter events by `PACKAGE_ID` (set in `.env`) to only process DePatreon contract events.

## REST API (optional)

```sh
cargo run --bin api
```

Serves `GET /creators`, `GET /creators/:id`, etc. (see `src/bin/api.rs`).

## Docker

```sh
docker compose up -d
```

Starts PostgreSQL + indexer. See `docker-compose.yml`.
