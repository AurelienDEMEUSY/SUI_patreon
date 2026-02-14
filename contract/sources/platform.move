/// Module: platform
/// Platform registry, admin capability, and admin functions.
module contract::platform;

use sui::table::{Self, Table};
use sui::coin;
use sui::sui::SUI;
use sui::balance::{Self, Balance};
use std::string::String;

const ENoFundsToWithdraw: u64 = 7;
const EInvalidFee: u64 = 13;

public struct Platform has key {
    id: UID,
    creators: Table<address, ID>,
    platform_fee_bps: u64,
    platform_fees: Balance<SUI>,
    suins_names: Table<String, address>,
}

public struct AdminCap has key, store {
    id: UID,
}


fun init(ctx: &mut TxContext) {
    let platform = Platform {
        id: object::new(ctx),
        creators: table::new(ctx),
        platform_fee_bps: 500, // 5% platform fee
        platform_fees: balance::zero(),
        suins_names: table::new(ctx),
    };
    transfer::share_object(platform);

    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
}

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

entry fun update_platform_fee(
    platform: &mut Platform,
    _admin: &AdminCap,
    new_fee_bps: u64,
    _ctx: &TxContext,
) {
    assert!(new_fee_bps <= 1000, EInvalidFee);
    platform.platform_fee_bps = new_fee_bps;
}


public fun get_platform_fees(platform: &Platform): u64 {
    balance::value(&platform.platform_fees)
}

public(package) fun has_creator(platform: &Platform, creator: address): bool {
    platform.creators.contains(creator)
}

public(package) fun register_creator(platform: &mut Platform, creator: address, service_id: ID) {
    platform.creators.add(creator, service_id);
}

public(package) fun unregister_creator(platform: &mut Platform, creator: address) {
    platform.creators.remove(creator);
}

public(package) fun get_fee_bps(platform: &Platform): u64 {
    platform.platform_fee_bps
}

public(package) fun add_platform_fee(platform: &mut Platform, fee: Balance<SUI>) {
    balance::join(&mut platform.platform_fees, fee);
}

//SuiNS
public(package) fun has_suins_name(platform: &Platform, name: String): bool {
    platform.suins_names.contains(name)
}

public(package) fun register_suins_name(platform: &mut Platform, name: String, creator: address) {
    platform.suins_names.add(name, creator);
}

public(package) fun unregister_suins_name(platform: &mut Platform, name: String) {
    platform.suins_names.remove(name);
}

public fun resolve_suins_name(platform: &Platform, name: String): address {
    *platform.suins_names.borrow(name)
}


#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
