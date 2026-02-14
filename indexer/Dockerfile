# DePatreon Indexer + API — Rust multi-stage build
# Builds both binaries: depatreon-indexer (worker) and api (REST server)

# -----------------------------------------------------------------------------
# Build stage
# -----------------------------------------------------------------------------
FROM rust:1-bookworm AS builder

# Build deps: PostgreSQL, zstd (C), libclang (bindgen)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    pkg-config \
    build-essential \
    libclang-dev \
    clang \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifest and lock (if exists) for caching
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
COPY migrations ./migrations

# Build both binaries (release for smaller image)
RUN cargo build --release --bin depatreon-indexer --bin api

# -----------------------------------------------------------------------------
# Runtime stage
# -----------------------------------------------------------------------------
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/depatreon-indexer /app/depatreon-indexer
COPY --from=builder /app/target/release/api /app/api

# Default: run indexer (override in compose for api)
CMD ["/app/depatreon-indexer", "--remote-store-url", "https://checkpoints.testnet.sui.io"]
