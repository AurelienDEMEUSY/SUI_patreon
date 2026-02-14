/// Module: types
/// Shared data structs for the Patreon contract.
module contract::types;

use std::string::String;
use sui::vec_map::{Self, VecMap};

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

/// A comment on a post.
public struct Comment has store, copy, drop {
    author: address,
    content: String,
    created_at_ms: u64,
}

/// An encrypted content post stored on Walrus.
public struct Post has store, copy, drop {
    post_id: u64,
    title: String,
    metadata_blob_id: String,
    data_blob_id: String,
    required_tier: u64,
    created_at_ms: u64,
    /// Number of likes
    likes: u64,
    /// Number of dislikes
    dislikes: u64,
    /// Tracks each user's reaction: 1 = like, 2 = dislike
    reactions: VecMap<address, u8>,
    /// Comments on this post
    comments: vector<Comment>,
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
    Post {
        post_id, title, metadata_blob_id, data_blob_id, required_tier, created_at_ms,
        likes: 0,
        dislikes: 0,
        reactions: vec_map::empty(),
        comments: vector::empty(),
    }
}

public fun new_comment(
    author: address,
    content: String,
    created_at_ms: u64,
): Comment {
    Comment { author, content, created_at_ms }
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
public fun post_likes(post: &Post): u64 { post.likes }
public fun post_dislikes(post: &Post): u64 { post.dislikes }
public fun post_reactions(post: &Post): &VecMap<address, u8> { &post.reactions }
public fun post_comments(post: &Post): &vector<Comment> { &post.comments }
public fun post_comment_count(post: &Post): u64 { post.comments.length() }

// ============================================================
// Comment accessors
// ============================================================

public fun comment_author(comment: &Comment): address { comment.author }
public fun comment_content(comment: &Comment): String { comment.content }
public fun comment_created_at_ms(comment: &Comment): u64 { comment.created_at_ms }

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
// Reaction mutators (package-internal)
// ============================================================

/// Add or update a reaction (1 = like, 2 = dislike). Returns previous reaction (0 if none).
public(package) fun set_reaction(post: &mut Post, user: address, reaction: u8): u8 {
    let previous = if (vec_map::contains(&post.reactions, &user)) {
        let (_, old_val) = vec_map::remove(&mut post.reactions, &user);
        // Decrement old counter
        if (old_val == 1) { post.likes = post.likes - 1; }
        else if (old_val == 2) { post.dislikes = post.dislikes - 1; };
        old_val
    } else {
        0
    };

    // If same reaction as before, it's a toggle — don't re-add
    if (previous == reaction) {
        return previous
    };

    // Add new reaction
    vec_map::insert(&mut post.reactions, user, reaction);
    if (reaction == 1) { post.likes = post.likes + 1; }
    else if (reaction == 2) { post.dislikes = post.dislikes + 1; };

    previous
}

/// Remove a user's reaction. Returns previous reaction (0 if none).
public(package) fun remove_reaction(post: &mut Post, user: address): u8 {
    if (!vec_map::contains(&post.reactions, &user)) {
        return 0
    };
    let (_, old_val) = vec_map::remove(&mut post.reactions, &user);
    if (old_val == 1) { post.likes = post.likes - 1; }
    else if (old_val == 2) { post.dislikes = post.dislikes - 1; };
    old_val
}

// ============================================================
// Comment mutators (package-internal)
// ============================================================

public(package) fun add_comment(post: &mut Post, comment: Comment) {
    post.comments.push_back(comment);
}

public(package) fun remove_comment(post: &mut Post, index: u64): Comment {
    post.comments.remove(index)
}

public(package) fun get_comment_author(post: &Post, index: u64): address {
    post.comments[index].author
}

// ============================================================
// Subscription accessors
// ============================================================

public fun subscription_tier(sub: &Subscription): u64 { sub.tier }
public fun subscription_expires_at_ms(sub: &Subscription): u64 { sub.expires_at_ms }
