-- Rollback DePatreon schema
DROP INDEX IF EXISTS idx_events_checkpoint;
DROP INDEX IF EXISTS idx_events_type;
DROP INDEX IF EXISTS idx_subscriptions_expires;
DROP INDEX IF EXISTS idx_subscriptions_subscriber;
DROP INDEX IF EXISTS idx_posts_deleted;
DROP INDEX IF EXISTS idx_posts_service;
DROP INDEX IF EXISTS idx_creators_deleted;
DROP INDEX IF EXISTS idx_creators_name;

DROP TABLE IF EXISTS events_log;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS tiers;
DROP TABLE IF EXISTS creators;
