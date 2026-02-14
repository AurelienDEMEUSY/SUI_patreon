/// Module: service
/// Creator's service object — profile, tiers, posts, Seal access control, and views.
/// Each creator has their own Service, whose object ID is used as the Seal identity.
///
/// Seal ID format: `bcs::to_bytes(&service_object_id)`
module contract::service;

use sui::table::{Self, Table};
use sui::coin;
use sui::sui::SUI;
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::event;
use sui::bcs;
use std::string::String;
use contract::types::{Self, SubscriptionTier, Post, Subscription};
use contract::platform::{Self, Platform};

// ============================================================
// Error codes
// ============================================================
const ENotCreator: u64 = 0;
const EInvalidTier: u64 = 1;
const ENoSubscription: u64 = 3;
const ENoAccess: u64 = 4;
const ECreatorAlreadyExists: u64 = 5;
const ENoFundsToWithdraw: u64 = 7;
const ETierAlreadyExists: u64 = 8;
const EInvalidPrice: u64 = 9;
const EInvalidDuration: u64 = 10;
const EPostNotFound: u64 = 11;
const ETierInUse: u64 = 12;
const EHasSubscribers: u64 = 13;

// ============================================================
// Events
// ============================================================

public struct CreatorRegistered has copy, drop {
    creator: address,
    name: String,
}

public struct ProfileUpdated has copy, drop {
    creator: address,
    name: String,
}

public struct PostPublished has copy, drop {
    creator: address,
    post_id: u64,
    required_tier: u64,
}

public struct PostUpdated has copy, drop {
    creator: address,
    post_id: u64,
}

public struct PostDeleted has copy, drop {
    creator: address,
    post_id: u64,
}

public struct CreatorDeleted has copy, drop {
    creator: address,
}

// ============================================================
// Structs
// ============================================================

/// A creator's service — the shared object that Seal uses for access control.
public struct Service has key {
    id: UID,
    /// Creator's address (owner)
    creator: address,
    /// Display name
    name: String,
    /// Description / bio
    description: String,
    /// Available subscription tiers
    tiers: vector<SubscriptionTier>,
    /// Published posts
    posts: vector<Post>,
    /// Next post ID counter
    next_post_id: u64,
    /// Subscribers: subscriber_address -> Subscription
    subscribers: Table<address, Subscription>,
    /// Accumulated revenue in SUI
    revenue: Balance<SUI>,
}

// ============================================================
// Creator functions
// ============================================================

/// Register as a creator on the platform.
/// Creates a shared `Service` object whose ID becomes the Seal identity for this creator.
entry fun create_creator_profile(
    platform: &mut Platform,
    name: String,
    description: String,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    assert!(!platform::has_creator(platform, sender), ECreatorAlreadyExists);

    let service = Service {
        id: object::new(ctx),
        creator: sender,
        name,
        description,
        tiers: vector::empty(),
        posts: vector::empty(),
        next_post_id: 0,
        subscribers: table::new(ctx),
        revenue: balance::zero(),
    };

    platform::register_creator(platform, sender, object::id(&service));

    event::emit(CreatorRegistered { creator: sender, name });

    transfer::share_object(service);
}

/// Delete the creator's profile and remove from platform registry.
/// Requires no active subscribers (table must be empty).
/// Any remaining revenue is transferred back to the creator.
entry fun delete_creator_profile(
    service: Service,
    platform: &mut Platform,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    assert!(service.creator == sender, ENotCreator);

    let Service {
        id,
        creator,
        name: _,
        description: _,
        tiers: _,
        posts: _,
        next_post_id: _,
        subscribers,
        revenue,
    } = service;

    // Require no active subscribers (Table must be empty to destroy)
    assert!(table::is_empty(&subscribers), EHasSubscribers);
    table::destroy_empty(subscribers);

    // Transfer remaining revenue back to creator
    if (balance::value(&revenue) > 0) {
        let revenue_coin = coin::from_balance(revenue, ctx);
        transfer::public_transfer(revenue_coin, sender);
    } else {
        balance::destroy_zero(revenue);
    };

    // Unregister from platform
    platform::unregister_creator(platform, creator);

    // Destroy the object
    object::delete(id);

    event::emit(CreatorDeleted { creator });
}

/// Update creator profile details.
entry fun update_creator_profile(
    service: &mut Service,
    name: String,
    description: String,
    ctx: &TxContext,
) {
    let sender = ctx.sender();
    assert!(service.creator == sender, ENotCreator);

    service.name = name;
    service.description = description;

    event::emit(ProfileUpdated { creator: sender, name });
}

// ============================================================
// Tier management
// ============================================================

/// Add a subscription tier to the creator's service.
entry fun add_subscription_tier(
    service: &mut Service,
    tier_level: u64,
    name: String,
    price: u64,
    duration_ms: u64,
    ctx: &TxContext,
) {
    let sender = ctx.sender();
    assert!(service.creator == sender, ENotCreator);

    if (tier_level > 0) {
        assert!(price > 0, EInvalidPrice);
    };
    assert!(duration_ms > 0, EInvalidDuration);

    let len = service.tiers.length();
    let mut i = 0;
    while (i < len) {
        assert!(types::tier_level(&service.tiers[i]) != tier_level, ETierAlreadyExists);
        i = i + 1;
    };

    service.tiers.push_back(types::new_subscription_tier(tier_level, name, price, duration_ms));
}

/// Remove a subscription tier (only if not used by any post).
entry fun remove_subscription_tier(
    service: &mut Service,
    tier_level: u64,
    ctx: &TxContext,
) {
    let sender = ctx.sender();
    assert!(service.creator == sender, ENotCreator);

    let posts_len = service.posts.length();
    let mut i = 0;
    while (i < posts_len) {
        assert!(types::post_required_tier(&service.posts[i]) != tier_level, ETierInUse);
        i = i + 1;
    };

    let tiers_len = service.tiers.length();
    let mut j = 0;
    let mut found = false;
    while (j < tiers_len) {
        if (types::tier_level(&service.tiers[j]) == tier_level) {
            service.tiers.remove(j);
            found = true;
            break
        };
        j = j + 1;
    };
    assert!(found, EInvalidTier);
}

// ============================================================
// Post management
// ============================================================

/// Publish an encrypted post. The blob IDs refer to Walrus-stored encrypted content.
///
/// Seal ID = `bcs::to_bytes(service_addr) + bcs::to_bytes(post_id)`
entry fun publish_post(
    service: &mut Service,
    title: String,
    metadata_blob_id: String,
    data_blob_id: String,
    required_tier: u64,
    clock: &Clock,
    ctx: &TxContext,
) {
    let sender = ctx.sender();
    assert!(service.creator == sender, ENotCreator);

    if (required_tier > 0) {
        let len = service.tiers.length();
        let mut found = false;
        let mut i = 0;
        while (i < len) {
            if (types::tier_level(&service.tiers[i]) == required_tier) {
                found = true;
            };
            i = i + 1;
        };
        assert!(found, EInvalidTier);
    };

    let post_id = service.next_post_id;
    service.next_post_id = post_id + 1;

    service.posts.push_back(types::new_post(
        post_id, title, metadata_blob_id, data_blob_id, required_tier, clock.timestamp_ms(),
    ));

    event::emit(PostPublished { creator: sender, post_id, required_tier });
}

/// Update an existing post.
entry fun update_post(
    service: &mut Service,
    post_id: u64,
    title: String,
    metadata_blob_id: String,
    data_blob_id: String,
    ctx: &TxContext,
) {
    let sender = ctx.sender();
    assert!(service.creator == sender, ENotCreator);

    let len = service.posts.length();
    let mut i = 0;
    let mut found = false;
    while (i < len) {
        if (types::post_id(&service.posts[i]) == post_id) {
            types::set_post_content(&mut service.posts[i], title, metadata_blob_id, data_blob_id);
            found = true;
            break
        };
        i = i + 1;
    };
    assert!(found, EPostNotFound);

    event::emit(PostUpdated { creator: sender, post_id });
}

/// Set post visibility (required tier).
entry fun set_post_visibility(
    service: &mut Service,
    post_id: u64,
    required_tier: u64,
    ctx: &TxContext,
) {
    let sender = ctx.sender();
    assert!(service.creator == sender, ENotCreator);

    if (required_tier > 0) {
        let t_len = service.tiers.length();
        let mut t_found = false;
        let mut k = 0;
        while (k < t_len) {
            if (types::tier_level(&service.tiers[k]) == required_tier) {
                t_found = true;
            };
            k = k + 1;
        };
        assert!(t_found, EInvalidTier);
    };

    let len = service.posts.length();
    let mut i = 0;
    let mut found = false;
    while (i < len) {
        if (types::post_id(&service.posts[i]) == post_id) {
            types::set_post_required_tier(&mut service.posts[i], required_tier);
            found = true;
            break
        };
        i = i + 1;
    };
    assert!(found, EPostNotFound);

    event::emit(PostUpdated { creator: sender, post_id });
}

/// Delete a post.
entry fun delete_post(
    service: &mut Service,
    post_id: u64,
    ctx: &TxContext,
) {
    let sender = ctx.sender();
    assert!(service.creator == sender, ENotCreator);

    let len = service.posts.length();
    let mut i = 0;
    let mut found = false;
    while (i < len) {
        if (types::post_id(&service.posts[i]) == post_id) {
            service.posts.remove(i);
            found = true;
            break
        };
        i = i + 1;
    };
    assert!(found, EPostNotFound);

    event::emit(PostDeleted { creator: sender, post_id });
}

// ============================================================
// Creator revenue withdrawal
// ============================================================

/// Creator withdraws accumulated revenue.
entry fun withdraw_creator_funds(
    service: &mut Service,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    assert!(service.creator == sender, ENotCreator);

    let total = balance::value(&service.revenue);
    assert!(total > 0, ENoFundsToWithdraw);

    let withdrawn = coin::take(&mut service.revenue, total, ctx);
    transfer::public_transfer(withdrawn, sender);
}

// ============================================================
// Seal integration — access policy
// ============================================================
//
// Seal Identity = [PackageId] || [id]
//   - PackageId is added automatically by the Seal SDK
//   - id = bcs::to_bytes(&service_object_id) + bcs::to_bytes(&post_id)
//
// `seal_approve` is called by Seal key servers via dry_run.
// If it doesn't abort, the decryption key is released.

/// Seal entry point — verifies access for content decryption.
///
/// `id` must contain BCS encoded `(service_addr, post_id)`.
/// Checks: service match, post exists, caller has active subscription >= required_tier.
entry fun seal_approve(
    id: vector<u8>,
    service: &Service,
    clock: &Clock,
    ctx: &TxContext,
) {
    let mut prepared = bcs::new(id);
    let service_addr = prepared.peel_address();
    let post_id = prepared.peel_u64();

    assert!(object::id_address(service) == service_addr, ENoAccess);

    let len = service.posts.length();
    let mut i = 0;
    let mut post_found = false;
    let mut required_tier = 0;

    while (i < len) {
        if (types::post_id(&service.posts[i]) == post_id) {
            required_tier = types::post_required_tier(&service.posts[i]);
            post_found = true;
            break
        };
        i = i + 1;
    };

    assert!(post_found, EPostNotFound);

    if (required_tier == 0) {
        return
    };

    let caller = ctx.sender();

    assert!(service.subscribers.contains(caller), ENoAccess);

    let sub = &service.subscribers[caller];
    let now = clock.timestamp_ms();

    assert!(types::subscription_expires_at_ms(sub) > now, ENoAccess);
    assert!(types::subscription_tier(sub) >= required_tier, ENoAccess);
}

// ============================================================
// View functions
// ============================================================

/// Check if a user has an active subscription to a service.
public fun has_active_subscription(
    service: &Service,
    subscriber: address,
    clock: &Clock,
): bool {
    if (!service.subscribers.contains(subscriber)) {
        return false
    };

    let sub = &service.subscribers[subscriber];
    types::subscription_expires_at_ms(sub) > clock.timestamp_ms()
}

/// Get the subscription tier and expiry for a user.
public fun get_subscription_info(
    service: &Service,
    subscriber: address,
): (u64, u64) {
    assert!(service.subscribers.contains(subscriber), ENoSubscription);
    let sub = &service.subscribers[subscriber];
    (types::subscription_tier(sub), types::subscription_expires_at_ms(sub))
}

/// Get the number of posts a creator has published.
public fun get_post_count(service: &Service): u64 {
    service.posts.length()
}

/// Get the number of tiers a creator offers.
public fun get_tier_count(service: &Service): u64 {
    service.tiers.length()
}

/// Get creator revenue balance.
public fun get_creator_revenue(service: &Service): u64 {
    balance::value(&service.revenue)
}

public fun get_creator_name(service: &Service): String { service.name }
public fun get_creator_description(service: &Service): String { service.description }
public fun get_service_creator(service: &Service): address { service.creator }

// ============================================================
// Package-internal helpers (for subscription module)
// ============================================================

/// Find tier info by level. Returns (found, price, duration_ms).
public(package) fun find_tier_info(service: &Service, tier_level: u64): (bool, u64, u64) {
    let len = service.tiers.length();
    let mut i = 0;
    while (i < len) {
        if (types::tier_level(&service.tiers[i]) == tier_level) {
            return (true, types::tier_price(&service.tiers[i]), types::tier_duration_ms(&service.tiers[i]))
        };
        i = i + 1;
    };
    (false, 0, 0)
}

/// Add revenue balance to the service.
public(package) fun add_revenue(service: &mut Service, rev: Balance<SUI>) {
    balance::join(&mut service.revenue, rev);
}

/// Get the creator's address.
public(package) fun get_creator(service: &Service): address {
    service.creator
}

/// Check if an address has a subscription entry.
public(package) fun has_subscriber(service: &Service, addr: address): bool {
    service.subscribers.contains(addr)
}

/// Get subscriber details. Returns (tier, expires_at_ms).
public(package) fun get_subscriber_details(service: &Service, addr: address): (u64, u64) {
    let sub = &service.subscribers[addr];
    (types::subscription_tier(sub), types::subscription_expires_at_ms(sub))
}

/// Add or update a subscriber's subscription.
public(package) fun set_subscriber(
    service: &mut Service,
    addr: address,
    tier: u64,
    expires_at_ms: u64,
) {
    if (service.subscribers.contains(addr)) {
        let existing = &mut service.subscribers[addr];
        *existing = types::new_subscription(tier, expires_at_ms);
    } else {
        service.subscribers.add(addr, types::new_subscription(tier, expires_at_ms));
    };
}
