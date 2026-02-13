module patreon::patreon;

use std::string::String;
use sui::coin::Coin;
use sui::sui::SUI;
use sui::event;
use sui::clock::Clock;

// ======== Error Codes ========

const EInvalidPrice: u64 = 0;
const EInsufficientPayment: u64 = 1;
const ESubscriptionExpired: u64 = 2;
const ENotCreator: u64 = 3;
const ENotSubscribed: u64 = 4;

// ======== Constants ========

/// Default subscription duration: 30 days in milliseconds
const SUBSCRIPTION_DURATION_MS: u64 = 30 * 24 * 60 * 60 * 1000;

// ======== Structs ========

/// Shared object: global platform registry
public struct Platform has key {
    id: UID,
    /// Total creators on the platform
    total_creators: u64,
}

/// Capability granting admin rights over the platform
public struct AdminCap has key, store {
    id: UID,
}

/// Owned object: creator profile
public struct CreatorAccount has key, store {
    id: UID,
    owner: address,
    name: String,
    description: String,
    /// Monthly subscription price in MIST
    subscription_price: u64,
    /// Total subscribers (all time)
    total_subscribers: u64,
    /// Balance accumulated from subscriptions
    balance: u64,
    /// Content IDs for iteration
    content_count: u64,
    created_at: u64,
}

/// Owned object: proof of active subscription
public struct Subscription has key, store {
    id: UID,
    subscriber: address,
    creator: address,
    creator_account_id: ID,
    /// Timestamp when subscription expires
    expires_at: u64,
    created_at: u64,
}

/// Object: content metadata
public struct Content has key, store {
    id: UID,
    creator: address,
    creator_account_id: ID,
    title: String,
    description: String,
    /// Walrus blob ID for content retrieval
    blob_id: String,
    /// true = visible by everyone, false = subscribers only
    is_public: bool,
    created_at: u64,
}

// ======== Events ========

public struct AccountCreated has copy, drop {
    creator: address,
    creator_account_id: ID,
    name: String,
    subscription_price: u64,
}

public struct SubscriptionCreated has copy, drop {
    subscriber: address,
    creator: address,
    creator_account_id: ID,
    subscription_id: ID,
    expires_at: u64,
    price_paid: u64,
}

public struct ContentCreated has copy, drop {
    creator: address,
    creator_account_id: ID,
    content_id: ID,
    title: String,
    is_public: bool,
}

// ======== Init ========

fun init(ctx: &mut TxContext) {
    let platform = Platform {
        id: object::new(ctx),
        total_creators: 0,
    };
    transfer::share_object(platform);

    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}

// ======== Creator Account Functions ========

/// Create a new creator account
public fun create_creator_account(
    platform: &mut Platform,
    name: String,
    description: String,
    subscription_price: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(subscription_price > 0, EInvalidPrice);

    let sender = ctx.sender();

    let creator_account = CreatorAccount {
        id: object::new(ctx),
        owner: sender,
        name,
        description,
        subscription_price,
        total_subscribers: 0,
        balance: 0,
        content_count: 0,
        created_at: clock.timestamp_ms(),
    };

    platform.total_creators = platform.total_creators + 1;

    event::emit(AccountCreated {
        creator: sender,
        creator_account_id: object::id(&creator_account),
        name: creator_account.name,
        subscription_price,
    });

    transfer::public_transfer(creator_account, sender);
}

/// Update creator profile (name, description, price)
public fun update_creator_profile(
    creator_account: &mut CreatorAccount,
    name: String,
    description: String,
    subscription_price: u64,
    ctx: &TxContext,
) {
    assert!(creator_account.owner == ctx.sender(), ENotCreator);
    assert!(subscription_price > 0, EInvalidPrice);

    creator_account.name = name;
    creator_account.description = description;
    creator_account.subscription_price = subscription_price;
}

// ======== Subscription Functions ========

/// Subscribe to a creator by paying the subscription price
public fun subscribe(
    creator_account: &mut CreatorAccount,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
): Subscription {
    let price = creator_account.subscription_price;
    assert!(payment.value() >= price, EInsufficientPayment);

    let subscriber = ctx.sender();
    let now = clock.timestamp_ms();

    // Split exact payment and send to creator
    let paid = payment.split(price, ctx);
    transfer::public_transfer(paid, creator_account.owner);

    // Return change to subscriber if any
    if (payment.value() > 0) {
        transfer::public_transfer(payment, subscriber);
    } else {
        payment.destroy_zero();
    };

    creator_account.total_subscribers = creator_account.total_subscribers + 1;
    creator_account.balance = creator_account.balance + price;

    let subscription = Subscription {
        id: object::new(ctx),
        subscriber,
        creator: creator_account.owner,
        creator_account_id: object::id(creator_account),
        expires_at: now + SUBSCRIPTION_DURATION_MS,
        created_at: now,
    };

    event::emit(SubscriptionCreated {
        subscriber,
        creator: creator_account.owner,
        creator_account_id: object::id(creator_account),
        subscription_id: object::id(&subscription),
        expires_at: subscription.expires_at,
        price_paid: price,
    });

    subscription
}

/// Renew an existing subscription
public fun renew_subscription(
    creator_account: &mut CreatorAccount,
    subscription: &mut Subscription,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let price = creator_account.subscription_price;
    assert!(payment.value() >= price, EInsufficientPayment);

    let subscriber = ctx.sender();
    let now = clock.timestamp_ms();

    // Split exact payment and send to creator
    let paid = payment.split(price, ctx);
    transfer::public_transfer(paid, creator_account.owner);

    // Return change
    if (payment.value() > 0) {
        transfer::public_transfer(payment, subscriber);
    } else {
        payment.destroy_zero();
    };

    creator_account.balance = creator_account.balance + price;

    // Extend from now or from current expiry (whichever is later)
    let base = if (subscription.expires_at > now) {
        subscription.expires_at
    } else {
        now
    };
    subscription.expires_at = base + SUBSCRIPTION_DURATION_MS;
}

/// Check if a subscription is still active
public fun is_subscription_active(
    subscription: &Subscription,
    clock: &Clock,
): bool {
    clock.timestamp_ms() < subscription.expires_at
}

// ======== Content Functions ========

/// Create new content (public or subscribers-only)
public fun create_content(
    creator_account: &mut CreatorAccount,
    title: String,
    description: String,
    blob_id: String,
    is_public: bool,
    clock: &Clock,
    ctx: &mut TxContext,
): Content {
    assert!(creator_account.owner == ctx.sender(), ENotCreator);

    creator_account.content_count = creator_account.content_count + 1;

    let content = Content {
        id: object::new(ctx),
        creator: creator_account.owner,
        creator_account_id: object::id(creator_account),
        title,
        description,
        blob_id,
        is_public,
        created_at: clock.timestamp_ms(),
    };

    event::emit(ContentCreated {
        creator: creator_account.owner,
        creator_account_id: object::id(creator_account),
        content_id: object::id(&content),
        title: content.title,
        is_public,
    });

    content
}

/// Update content metadata
public fun update_content(
    creator_account: &CreatorAccount,
    content: &mut Content,
    title: String,
    description: String,
    blob_id: String,
    ctx: &TxContext,
) {
    assert!(creator_account.owner == ctx.sender(), ENotCreator);

    content.title = title;
    content.description = description;
    content.blob_id = blob_id;
}

/// Toggle content visibility (public <-> private)
public fun set_content_visibility(
    creator_account: &CreatorAccount,
    content: &mut Content,
    is_public: bool,
    ctx: &TxContext,
) {
    assert!(creator_account.owner == ctx.sender(), ENotCreator);
    content.is_public = is_public;
}

/// Delete content
public fun delete_content(
    creator_account: &mut CreatorAccount,
    content: Content,
    ctx: &TxContext,
) {
    assert!(creator_account.owner == ctx.sender(), ENotCreator);
    creator_account.content_count = creator_account.content_count - 1;

    let Content {
        id,
        creator: _,
        creator_account_id: _,
        title: _,
        description: _,
        blob_id: _,
        is_public: _,
        created_at: _,
    } = content;
    object::delete(id);
}

// ======== Access Control ========

/// Assert that a user can access content (public or active subscription)
public fun assert_content_access(
    content: &Content,
    subscription: &Subscription,
    clock: &Clock,
) {
    if (content.is_public) {
        return
    };
    // For private content, verify subscription is valid
    assert!(subscription.creator_account_id == content.creator_account_id, ENotSubscribed);
    assert!(is_subscription_active(subscription, clock), ESubscriptionExpired);
}

// ======== View Functions ========

public fun creator_name(account: &CreatorAccount): String { account.name }
public fun creator_description(account: &CreatorAccount): String { account.description }
public fun creator_subscription_price(account: &CreatorAccount): u64 { account.subscription_price }
public fun creator_total_subscribers(account: &CreatorAccount): u64 { account.total_subscribers }
public fun creator_balance(account: &CreatorAccount): u64 { account.balance }
public fun creator_content_count(account: &CreatorAccount): u64 { account.content_count }

public fun subscription_expires_at(sub: &Subscription): u64 { sub.expires_at }
public fun subscription_creator(sub: &Subscription): address { sub.creator }

public fun content_title(content: &Content): String { content.title }
public fun content_description(content: &Content): String { content.description }
public fun content_blob_id(content: &Content): String { content.blob_id }
public fun content_is_public(content: &Content): bool { content.is_public }

public fun platform_total_creators(platform: &Platform): u64 { platform.total_creators }
