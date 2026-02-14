/// Module: subscription
/// Subscriber functions — purchasing and renewing subscriptions.
module contract::subscription;

use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::balance;
use sui::clock::Clock;
use sui::event;
use contract::service::{Self, Service};
use contract::platform::{Self, Platform};

const EInvalidTier: u64 = 1;
const EInsufficientPayment: u64 = 2;


public struct SubscriptionPurchased has copy, drop {
    subscriber: address,
    creator: address,
    tier: u64,
    expires_at_ms: u64,
}

public struct SubscriptionRenewed has copy, drop {
    subscriber: address,
    creator: address,
    tier: u64,
    new_expires_at_ms: u64,
}

/// Subscribe to a creator by paying the tier price in SUI.
/// After subscribing, the user can decrypt content encrypted with
/// `id = bcs::to_bytes(&service_object_id)` via Seal.
#[allow(unused_mut_parameter)]
entry fun subscribe(
    service: &mut Service,
    platform: &mut Platform,
    tier_level: u64,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let subscriber = ctx.sender();

    let (found, tier_price, tier_duration) = service::find_tier_info(service, tier_level);
    assert!(found, EInvalidTier);

    assert!(coin::value(&payment) >= tier_price, EInsufficientPayment);

    let paid = coin::split(&mut payment, tier_price, ctx);
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, subscriber);
    } else {
        coin::destroy_zero(payment);
    };

    let fee_amount = (tier_price * platform::get_fee_bps(platform)) / 10000;

    let mut payment_balance = coin::into_balance(paid);
    let fee_balance = balance::split(&mut payment_balance, fee_amount);

    platform::add_platform_fee(platform, fee_balance);
    service::add_revenue(service, payment_balance);

    let now = clock.timestamp_ms();
    let expires_at_ms = now + tier_duration;
    let creator = service::get_creator(service);

    if (service::has_subscriber(service, subscriber)) {
        let (_, old_expires) = service::get_subscriber_details(service, subscriber);
        if (old_expires > now) {
            let new_expires = old_expires + tier_duration;
            service::set_subscriber(service, subscriber, tier_level, new_expires);

            event::emit(SubscriptionRenewed {
                subscriber, creator, tier: tier_level, new_expires_at_ms: new_expires,
            });
        } else {
            service::set_subscriber(service, subscriber, tier_level, expires_at_ms);

            event::emit(SubscriptionPurchased {
                subscriber, creator, tier: tier_level, expires_at_ms,
            });
        }
    } else {
        service::set_subscriber(service, subscriber, tier_level, expires_at_ms);

        event::emit(SubscriptionPurchased {
            subscriber, creator, tier: tier_level, expires_at_ms,
        });
    };
}
