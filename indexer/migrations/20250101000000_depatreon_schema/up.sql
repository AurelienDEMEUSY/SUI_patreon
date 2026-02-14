-- DePatreon Custom Indexer Schema
-- Matches docs/INDEXER.md Phase 6

CREATE TABLE creators (
    service_object_id TEXT PRIMARY KEY,
    creator_address TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    avatar_blob_id TEXT,
    suins_name TEXT UNIQUE,
    total_subscribers INTEGER NOT NULL DEFAULT 0,
    total_posts INTEGER NOT NULL DEFAULT 0,
    revenue_mist BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE tiers (
    id SERIAL PRIMARY KEY,
    service_object_id TEXT NOT NULL REFERENCES creators(service_object_id),
    tier_level INTEGER NOT NULL,
    name TEXT NOT NULL,
    price_mist BIGINT NOT NULL,
    duration_ms BIGINT NOT NULL,
    UNIQUE(service_object_id, tier_level)
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    service_object_id TEXT NOT NULL REFERENCES creators(service_object_id),
    post_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    metadata_blob_id TEXT,
    data_blob_id TEXT,
    required_tier INTEGER NOT NULL DEFAULT 0,
    created_at_ms BIGINT NOT NULL,
    deleted_at TIMESTAMPTZ,
    UNIQUE(service_object_id, post_id)
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    subscriber_address TEXT NOT NULL,
    service_object_id TEXT NOT NULL REFERENCES creators(service_object_id),
    tier_level INTEGER NOT NULL,
    expires_at_ms BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(subscriber_address, service_object_id)
);

CREATE TABLE events_log (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    checkpoint BIGINT NOT NULL,
    tx_digest TEXT NOT NULL,
    data JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_creators_name ON creators USING gin(to_tsvector('english', name));
CREATE INDEX idx_creators_deleted ON creators(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_service ON posts(service_object_id);
CREATE INDEX idx_posts_deleted ON posts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_address);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at_ms);
CREATE INDEX idx_events_type ON events_log(event_type);
CREATE INDEX idx_events_checkpoint ON events_log(checkpoint);
