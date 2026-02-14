use diesel::prelude::*;
use sui_indexer_alt_framework::FieldCount;

use crate::schema::{creators, events_log, posts, subscriptions};

/// Patch for conditional creator updates (None = skip field)
#[derive(AsChangeset, Debug)]
#[diesel(table_name = creators)]
#[diesel(treat_none_as_null = false)]
pub struct CreatorUpdatePatch {
    pub name: Option<String>,
    pub description: Option<String>,
    pub avatar_blob_id: Option<String>,
    pub suins_name: Option<String>,
}

// ============================================================
// Creator
// ============================================================

#[derive(Insertable, Debug, Clone, FieldCount)]
#[diesel(table_name = creators)]
pub struct NewCreator {
    pub service_object_id: String,
    pub creator_address: String,
    pub name: String,
    pub description: String,
    pub avatar_blob_id: Option<String>,
    pub suins_name: Option<String>,
}

// ============================================================
// Post
// ============================================================

#[derive(Insertable, Debug, Clone, FieldCount)]
#[diesel(table_name = posts)]
pub struct NewPost {
    pub service_object_id: String,
    pub post_id: i32,
    pub title: String,
    pub metadata_blob_id: Option<String>,
    pub data_blob_id: Option<String>,
    pub required_tier: i32,
    pub created_at_ms: i64,
}

// ============================================================
// Subscription
// ============================================================

#[derive(Insertable, Debug, Clone, FieldCount)]
#[diesel(table_name = subscriptions)]
pub struct NewSubscription {
    pub subscriber_address: String,
    pub service_object_id: String,
    pub tier_level: i32,
    pub expires_at_ms: i64,
}

// ============================================================
// Event log (generic event storage)
// ============================================================

#[derive(Insertable, Debug, Clone, FieldCount)]
#[diesel(table_name = events_log)]
pub struct NewEventLog {
    pub event_type: String,
    pub checkpoint: i64,
    pub tx_digest: String,
    pub data: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}
