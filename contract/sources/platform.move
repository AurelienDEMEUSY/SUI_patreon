/// Module: platform
/// Platform registry, admin capability, and admin functions.
module contract::platform;

use sui::table::{Self, Table};
use sui::coin;
use sui::sui::SUI;
use sui::balance::{Self, Balance};

// ============================================================
// Error codes
// ============================================================
const ENoFundsToWithdraw: u64 = 7;
const EInvalidFee: u64 = 13;

// ============================================================
// Structs
// ============================================================

/// Platform registry — the central directory of all creators.
public struct Platform has key {
    id: UID,
    /// Creator address -> Service object ID (for discovery)
    creators: Table<address, ID>,
    /// Platform fee in basis points (e.g., 500 = 5%)
    platform_fee_bps: u64,
    /// Accumulated platform fees
    platform_fees: Balance<SUI>,
}

/// Admin capability for the platform.
public struct AdminCap has key, store {
    id: UID,
}

// ============================================================
// Initialization
// ============================================================

/// Called once at module publication — creates the Platform and AdminCap.
fun init(ctx: &mut TxContext) {
    let platform = Platform {
        id: object::new(ctx),
        creators: table::new(ctx),
        platform_fee_bps: 500, // 5% platform fee
        platform_fees: balance::zero(),
    };
    transfer::share_object(platform);

    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
}

// ============================================================
// Admin functions
// ============================================================

/// Admin withdraws platform fees.
entry fun withdraw_platform_fees(
    platform: &mut Platform,
    _admin: &AdminCap,
    ctx: &mut TxContext,
) {
    let total = balance::value(&platform.platform_fees);
    assert!(total > 0, ENoFundsToWithdraw);

    let withdrawn = coin::take(&mut platform.platform_fees, total, ctx);
    transfer::public_transfer(withdrawn, ctx.sender());
}

/// Admin: update platform fee (max 10%).
entry fun update_platform_fee(
    platform: &mut Platform,
    _admin: &AdminCap,
    new_fee_bps: u64,
    _ctx: &TxContext,
) {
    assert!(new_fee_bps <= 1000, EInvalidFee); // Max 10%
    platform.platform_fee_bps = new_fee_bps;
}

// ============================================================
// View functions
// ============================================================

/// Get platform fees balance.
public fun get_platform_fees(platform: &Platform): u64 {
    balance::value(&platform.platform_fees)
}

// ============================================================
// Package-internal helpers
// ============================================================

public(package) fun has_creator(platform: &Platform, creator: address): bool {
    platform.creators.contains(creator)
}

public(package) fun register_creator(platform: &mut Platform, creator: address, service_id: ID) {
    platform.creators.add(creator, service_id);
}

public(package) fun get_fee_bps(platform: &Platform): u64 {
    platform.platform_fee_bps
}

public(package) fun add_platform_fee(platform: &mut Platform, fee: Balance<SUI>) {
    balance::join(&mut platform.platform_fees, fee);
}

// ============================================================
// Test helpers
// ============================================================

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
