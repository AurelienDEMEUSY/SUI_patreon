/// Module: types
/// Shared data structs for the Patreon contract.
module contract::types;

use std::string::String;

// ============================================================
// Data structs
// ============================================================

/// A subscription tier offered by a creator.
public struct SubscriptionTier has store, copy, drop {
    tier_level: u64,
    name: String,
    price: u64,
    duration_ms: u64,
}

/// An encrypted content post stored on Walrus.
public struct Post has store, copy, drop {
    post_id: u64,
    title: String,
    metadata_blob_id: String,
    data_blob_id: String,
    required_tier: u64,
    created_at_ms: u64,
}

/// A subscriber's active subscription to a specific creator.
public struct Subscription has store, copy, drop {
    tier: u64,
    expires_at_ms: u64,
}

// ============================================================
// Constructors
// ============================================================

public fun new_subscription_tier(
    tier_level: u64,
    name: String,
    price: u64,
    duration_ms: u64,
): SubscriptionTier {
    SubscriptionTier { tier_level, name, price, duration_ms }
}

public fun new_post(
    post_id: u64,
    title: String,
    metadata_blob_id: String,
    data_blob_id: String,
    required_tier: u64,
    created_at_ms: u64,
): Post {
    Post { post_id, title, metadata_blob_id, data_blob_id, required_tier, created_at_ms }
}

public fun new_subscription(tier: u64, expires_at_ms: u64): Subscription {
    Subscription { tier, expires_at_ms }
}

// ============================================================
// SubscriptionTier accessors
// ============================================================

public fun tier_level(tier: &SubscriptionTier): u64 { tier.tier_level }
public fun tier_name(tier: &SubscriptionTier): String { tier.name }
public fun tier_price(tier: &SubscriptionTier): u64 { tier.price }
public fun tier_duration_ms(tier: &SubscriptionTier): u64 { tier.duration_ms }

// ============================================================
// Post accessors & mutators
// ============================================================

public fun post_id(post: &Post): u64 { post.post_id }
public fun post_title(post: &Post): String { post.title }
public fun post_metadata_blob_id(post: &Post): String { post.metadata_blob_id }
public fun post_data_blob_id(post: &Post): String { post.data_blob_id }
public fun post_required_tier(post: &Post): u64 { post.required_tier }
public fun post_created_at_ms(post: &Post): u64 { post.created_at_ms }

public(package) fun set_post_content(
    post: &mut Post,
    title: String,
    metadata_blob_id: String,
    data_blob_id: String,
) {
    post.title = title;
    post.metadata_blob_id = metadata_blob_id;
    post.data_blob_id = data_blob_id;
}

public(package) fun set_post_required_tier(post: &mut Post, required_tier: u64) {
    post.required_tier = required_tier;
}

// ============================================================
// Subscription accessors
// ============================================================

public fun subscription_tier(sub: &Subscription): u64 { sub.tier }
public fun subscription_expires_at_ms(sub: &Subscription): u64 { sub.expires_at_ms }
