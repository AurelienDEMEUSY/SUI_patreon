#[test_only]
module patreon::patreon_tests;

use sui::test_scenario as ts;
use sui::coin;
use sui::sui::SUI;
use sui::clock;
use patreon::patreon;

// ======== Test addresses ========

const ADMIN: address = @0xAD;
const CREATOR: address = @0xC1;
const CREATOR2: address = @0xC2;
const SUBSCRIBER: address = @0x51;
#[allow(unused_const)]
const SUBSCRIBER2: address = @0x52;

// ======== Error codes (mirrors contract) ========

const EInvalidPrice: u64 = 0;
const EInsufficientPayment: u64 = 1;
const ESubscriptionExpired: u64 = 2;
#[allow(unused_const)]
const ENotCreator: u64 = 3;
const ENotSubscribed: u64 = 4;

// ======== Constants ========

const ONE_SUI: u64 = 1_000_000_000;
const THIRTY_DAYS_MS: u64 = 30 * 24 * 60 * 60 * 1000;

// ======== Helpers ========

fun mint_sui(addr: address, amount: u64, ts: &mut ts::Scenario) {
    transfer::public_transfer(
        coin::mint_for_testing<SUI>(amount, ts.ctx()),
        addr,
    );
    ts.next_tx(addr);
}

fun setup(): ts::Scenario {
    let mut ts = ts::begin(ADMIN);
    patreon::init_for_testing(ts.ctx());
    ts.next_tx(ADMIN);
    ts
}

// ================================================================
// ==================== INIT & PLATFORM TESTS =====================
// ================================================================

#[test]
fun platform_created_on_init() {
    let mut ts = setup();

    // Platform shared object should exist
    let platform = ts.take_shared<patreon::Platform>();
    assert!(patreon::platform_total_creators(&platform) == 0);
    ts::return_shared(platform);

    // AdminCap should be owned by ADMIN
    let admin_cap = ts.take_from_address<patreon::AdminCap>(ADMIN);
    ts::return_to_address(ADMIN, admin_cap);

    ts.end();
}

// ================================================================
// ================= CREATOR ACCOUNT TESTS ========================
// ================================================================

#[test]
fun create_creator_account_works() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"I make great content".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        assert!(patreon::platform_total_creators(&platform) == 1);
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let account = ts.take_from_sender<patreon::CreatorAccount>();
        assert!(patreon::creator_name(&account) == b"Alice".to_string());
        assert!(patreon::creator_description(&account) == b"I make great content".to_string());
        assert!(patreon::creator_subscription_price(&account) == ONE_SUI);
        assert!(patreon::creator_total_subscribers(&account) == 0);
        assert!(patreon::creator_balance(&account) == 0);
        assert!(patreon::creator_content_count(&account) == 0);
        ts.return_to_sender(account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun multiple_creators_increment_counter() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    // Creator 1
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    // Creator 2
    ts.next_tx(CREATOR2);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Bob".to_string(),
            b"desc2".to_string(),
            2 * ONE_SUI,
            &clock,
            ts.ctx(),
        );
        assert!(patreon::platform_total_creators(&platform) == 2);
        ts::return_shared(platform);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test, expected_failure(abort_code = EInvalidPrice, location = patreon)]
fun create_creator_account_zero_price_fails() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    let mut platform = ts.take_shared<patreon::Platform>();
    patreon::create_creator_account(
        &mut platform,
        b"Alice".to_string(),
        b"desc".to_string(),
        0, // zero price
        &clock,
        ts.ctx(),
    );

    abort 0 // should not reach here
}

#[test]
fun update_creator_profile_works() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        patreon::update_creator_profile(
            &mut account,
            b"Alice Updated".to_string(),
            b"New description".to_string(),
            2 * ONE_SUI,
            ts.ctx(),
        );
        assert!(patreon::creator_name(&account) == b"Alice Updated".to_string());
        assert!(patreon::creator_description(&account) == b"New description".to_string());
        assert!(patreon::creator_subscription_price(&account) == 2 * ONE_SUI);
        ts.return_to_sender(account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test, expected_failure(abort_code = EInvalidPrice, location = patreon)]
fun update_creator_profile_zero_price_fails() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    let mut account = ts.take_from_sender<patreon::CreatorAccount>();
    patreon::update_creator_profile(
        &mut account,
        b"Alice".to_string(),
        b"desc".to_string(),
        0, // zero price
        ts.ctx(),
    );

    abort 0
}

// ================================================================
// =================== SUBSCRIPTION TESTS =========================
// ================================================================

#[test]
fun subscribe_works() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(1000);

    // Create creator
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    // Mint coins for subscriber
    mint_sui(SUBSCRIBER, 2 * ONE_SUI, &mut ts);

    // Subscribe
    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let subscription = patreon::subscribe(
            &mut account,
            payment,
            &clock,
            ts.ctx(),
        );

        // Verify creator stats
        assert!(patreon::creator_total_subscribers(&account) == 1);
        assert!(patreon::creator_balance(&account) == ONE_SUI);

        // Verify subscription
        assert!(patreon::subscription_creator(&subscription) == CREATOR);
        assert!(patreon::subscription_expires_at(&subscription) == 1000 + THIRTY_DAYS_MS);
        assert!(patreon::is_subscription_active(&subscription, &clock));

        transfer::public_transfer(subscription, SUBSCRIBER);
        ts::return_to_address(CREATOR, account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun subscribe_returns_change() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    // Create creator with price = 1 SUI
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    // Give subscriber 5 SUI
    mint_sui(SUBSCRIBER, 5 * ONE_SUI, &mut ts);

    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let subscription = patreon::subscribe(
            &mut account,
            payment,
            &clock,
            ts.ctx(),
        );
        transfer::public_transfer(subscription, SUBSCRIBER);
        ts::return_to_address(CREATOR, account);
    };

    // Subscriber should have received change (4 SUI)
    ts.next_tx(SUBSCRIBER);
    {
        let change = ts.take_from_sender<coin::Coin<SUI>>();
        assert!(change.value() == 4 * ONE_SUI);
        ts.return_to_sender(change);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test, expected_failure(abort_code = EInsufficientPayment, location = patreon)]
fun subscribe_insufficient_payment_fails() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    // Give subscriber only half
    mint_sui(SUBSCRIBER, ONE_SUI / 2, &mut ts);

    ts.next_tx(SUBSCRIBER);
    let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
    let payment = ts.take_from_sender<coin::Coin<SUI>>();
    let _subscription = patreon::subscribe(
        &mut account,
        payment,
        &clock,
        ts.ctx(),
    );

    abort 0
}

#[test]
fun renew_subscription_extends_from_expiry() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(1000);

    // Create creator
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    // Subscribe
    mint_sui(SUBSCRIBER, ONE_SUI, &mut ts);
    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let sub = patreon::subscribe(&mut account, payment, &clock, ts.ctx());
        transfer::public_transfer(sub, SUBSCRIBER);
        ts::return_to_address(CREATOR, account);
    };

    // Renew while still active (15 days later)
    clock.increment_for_testing(THIRTY_DAYS_MS / 2);
    mint_sui(SUBSCRIBER, ONE_SUI, &mut ts);

    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let mut sub = ts.take_from_sender<patreon::Subscription>();
        let payment = ts.take_from_sender<coin::Coin<SUI>>();

        let old_expiry = patreon::subscription_expires_at(&sub);
        patreon::renew_subscription(&mut account, &mut sub, payment, &clock, ts.ctx());
        // Should extend from old expiry, not from now
        assert!(patreon::subscription_expires_at(&sub) == old_expiry + THIRTY_DAYS_MS);
        assert!(patreon::creator_balance(&account) == 2 * ONE_SUI);

        ts.return_to_sender(sub);
        ts::return_to_address(CREATOR, account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun renew_expired_subscription_extends_from_now() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(1000);

    // Create creator
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    // Subscribe
    mint_sui(SUBSCRIBER, ONE_SUI, &mut ts);
    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let sub = patreon::subscribe(&mut account, payment, &clock, ts.ctx());
        transfer::public_transfer(sub, SUBSCRIBER);
        ts::return_to_address(CREATOR, account);
    };

    // Wait until expired (60 days)
    clock.increment_for_testing(THIRTY_DAYS_MS * 2);
    let now = clock.timestamp_ms();
    mint_sui(SUBSCRIBER, ONE_SUI, &mut ts);

    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let mut sub = ts.take_from_sender<patreon::Subscription>();
        let payment = ts.take_from_sender<coin::Coin<SUI>>();

        assert!(!patreon::is_subscription_active(&sub, &clock));
        patreon::renew_subscription(&mut account, &mut sub, payment, &clock, ts.ctx());
        // Should extend from now since expired
        assert!(patreon::subscription_expires_at(&sub) == now + THIRTY_DAYS_MS);
        assert!(patreon::is_subscription_active(&sub, &clock));

        ts.return_to_sender(sub);
        ts::return_to_address(CREATOR, account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun subscription_expires_after_30_days() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(1000);

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    mint_sui(SUBSCRIBER, ONE_SUI, &mut ts);
    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let sub = patreon::subscribe(&mut account, payment, &clock, ts.ctx());

        // Active right after subscribing
        assert!(patreon::is_subscription_active(&sub, &clock));

        // Still active at 29 days
        clock.increment_for_testing(THIRTY_DAYS_MS - 1001);
        assert!(patreon::is_subscription_active(&sub, &clock));

        // Expired at 30 days + 1ms
        clock.increment_for_testing(1002);
        assert!(!patreon::is_subscription_active(&sub, &clock));

        transfer::public_transfer(sub, SUBSCRIBER);
        ts::return_to_address(CREATOR, account);
    };

    clock.destroy_for_testing();
    ts.end();
}

// ================================================================
// ===================== CONTENT TESTS ============================
// ================================================================

#[test]
fun create_content_public_works() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(5000);

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = patreon::create_content(
            &mut account,
            b"My first post".to_string(),
            b"Hello world!".to_string(),
            b"walrus_blob_123".to_string(),
            true, // public
            &clock,
            ts.ctx(),
        );

        assert!(patreon::content_title(&content) == b"My first post".to_string());
        assert!(patreon::content_description(&content) == b"Hello world!".to_string());
        assert!(patreon::content_blob_id(&content) == b"walrus_blob_123".to_string());
        assert!(patreon::content_is_public(&content));
        assert!(patreon::creator_content_count(&account) == 1);

        transfer::public_transfer(content, CREATOR);
        ts.return_to_sender(account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun create_content_private_works() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = patreon::create_content(
            &mut account,
            b"Exclusive post".to_string(),
            b"Subscribers only".to_string(),
            b"walrus_blob_456".to_string(),
            false, // private
            &clock,
            ts.ctx(),
        );

        assert!(!patreon::content_is_public(&content));

        transfer::public_transfer(content, CREATOR);
        ts.return_to_sender(account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun create_multiple_contents_increments_count() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();

        let c1 = patreon::create_content(
            &mut account,
            b"Post 1".to_string(),
            b"desc1".to_string(),
            b"blob1".to_string(),
            true,
            &clock,
            ts.ctx(),
        );
        let c2 = patreon::create_content(
            &mut account,
            b"Post 2".to_string(),
            b"desc2".to_string(),
            b"blob2".to_string(),
            false,
            &clock,
            ts.ctx(),
        );

        assert!(patreon::creator_content_count(&account) == 2);

        transfer::public_transfer(c1, CREATOR);
        transfer::public_transfer(c2, CREATOR);
        ts.return_to_sender(account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun update_content_works() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = patreon::create_content(
            &mut account,
            b"Old title".to_string(),
            b"Old desc".to_string(),
            b"old_blob".to_string(),
            true,
            &clock,
            ts.ctx(),
        );
        transfer::public_transfer(content, CREATOR);
        ts.return_to_sender(account);
    };

    ts.next_tx(CREATOR);
    {
        let account = ts.take_from_sender<patreon::CreatorAccount>();
        let mut content = ts.take_from_sender<patreon::Content>();

        patreon::update_content(
            &account,
            &mut content,
            b"New title".to_string(),
            b"New desc".to_string(),
            b"new_blob".to_string(),
            ts.ctx(),
        );

        assert!(patreon::content_title(&content) == b"New title".to_string());
        assert!(patreon::content_description(&content) == b"New desc".to_string());
        assert!(patreon::content_blob_id(&content) == b"new_blob".to_string());

        ts.return_to_sender(content);
        ts.return_to_sender(account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun set_content_visibility_works() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = patreon::create_content(
            &mut account,
            b"Post".to_string(),
            b"desc".to_string(),
            b"blob".to_string(),
            true, // starts public
            &clock,
            ts.ctx(),
        );
        transfer::public_transfer(content, CREATOR);
        ts.return_to_sender(account);
    };

    ts.next_tx(CREATOR);
    {
        let account = ts.take_from_sender<patreon::CreatorAccount>();
        let mut content = ts.take_from_sender<patreon::Content>();

        assert!(patreon::content_is_public(&content));

        patreon::set_content_visibility(&account, &mut content, false, ts.ctx());
        assert!(!patreon::content_is_public(&content));

        patreon::set_content_visibility(&account, &mut content, true, ts.ctx());
        assert!(patreon::content_is_public(&content));

        ts.return_to_sender(content);
        ts.return_to_sender(account);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun delete_content_works() {
    let mut ts = setup();
    let clock = clock::create_for_testing(ts.ctx());

    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = patreon::create_content(
            &mut account,
            b"Post".to_string(),
            b"desc".to_string(),
            b"blob".to_string(),
            true,
            &clock,
            ts.ctx(),
        );
        assert!(patreon::creator_content_count(&account) == 1);
        transfer::public_transfer(content, CREATOR);
        ts.return_to_sender(account);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = ts.take_from_sender<patreon::Content>();
        patreon::delete_content(&mut account, content, ts.ctx());
        assert!(patreon::creator_content_count(&account) == 0);
        ts.return_to_sender(account);
    };

    clock.destroy_for_testing();
    ts.end();
}

// ================================================================
// ================== ACCESS CONTROL TESTS ========================
// ================================================================

#[test]
fun public_content_accessible_with_any_subscription() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(1000);

    // Create creator + content
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = patreon::create_content(
            &mut account,
            b"Public Post".to_string(),
            b"Free content".to_string(),
            b"blob".to_string(),
            true, // public
            &clock,
            ts.ctx(),
        );
        transfer::public_transfer(content, CREATOR);
        ts.return_to_sender(account);
    };

    // Subscribe
    mint_sui(SUBSCRIBER, ONE_SUI, &mut ts);
    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let sub = patreon::subscribe(&mut account, payment, &clock, ts.ctx());
        transfer::public_transfer(sub, SUBSCRIBER);
        ts::return_to_address(CREATOR, account);
    };

    // Check access — public content always accessible
    ts.next_tx(SUBSCRIBER);
    {
        let content = ts.take_from_address<patreon::Content>(CREATOR);
        let sub = ts.take_from_sender<patreon::Subscription>();
        patreon::assert_content_access(&content, &sub, &clock);
        ts.return_to_sender(sub);
        ts::return_to_address(CREATOR, content);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test]
fun private_content_accessible_with_active_subscription() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(1000);

    // Create creator + private content
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = patreon::create_content(
            &mut account,
            b"Private Post".to_string(),
            b"Exclusive".to_string(),
            b"blob".to_string(),
            false, // private
            &clock,
            ts.ctx(),
        );
        transfer::public_transfer(content, CREATOR);
        ts.return_to_sender(account);
    };

    // Subscribe
    mint_sui(SUBSCRIBER, ONE_SUI, &mut ts);
    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let sub = patreon::subscribe(&mut account, payment, &clock, ts.ctx());
        transfer::public_transfer(sub, SUBSCRIBER);
        ts::return_to_address(CREATOR, account);
    };

    // Access private content with active subscription — should work
    ts.next_tx(SUBSCRIBER);
    {
        let content = ts.take_from_address<patreon::Content>(CREATOR);
        let sub = ts.take_from_sender<patreon::Subscription>();
        patreon::assert_content_access(&content, &sub, &clock);
        ts.return_to_sender(sub);
        ts::return_to_address(CREATOR, content);
    };

    clock.destroy_for_testing();
    ts.end();
}

#[test, expected_failure(abort_code = ESubscriptionExpired, location = patreon)]
fun private_content_denied_with_expired_subscription() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(1000);

    // Create creator + private content
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = patreon::create_content(
            &mut account,
            b"Private Post".to_string(),
            b"Exclusive".to_string(),
            b"blob".to_string(),
            false,
            &clock,
            ts.ctx(),
        );
        transfer::public_transfer(content, CREATOR);
        ts.return_to_sender(account);
    };

    // Subscribe
    mint_sui(SUBSCRIBER, ONE_SUI, &mut ts);
    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let sub = patreon::subscribe(&mut account, payment, &clock, ts.ctx());
        transfer::public_transfer(sub, SUBSCRIBER);
        ts::return_to_address(CREATOR, account);
    };

    // Advance past expiry
    clock.increment_for_testing(THIRTY_DAYS_MS + 1);

    // Try to access — should fail with ESubscriptionExpired
    ts.next_tx(SUBSCRIBER);
    let content = ts.take_from_address<patreon::Content>(CREATOR);
    let sub = ts.take_from_sender<patreon::Subscription>();
    patreon::assert_content_access(&content, &sub, &clock);

    abort 0
}

#[test, expected_failure(abort_code = ENotSubscribed, location = patreon)]
fun private_content_denied_with_wrong_creator_subscription() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(1000);

    // Create creator 1
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    // Create creator 2 with private content
    ts.next_tx(CREATOR2);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Bob".to_string(),
            b"desc".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        ts::return_shared(platform);
    };

    ts.next_tx(CREATOR2);
    {
        let mut account2 = ts.take_from_sender<patreon::CreatorAccount>();
        let content = patreon::create_content(
            &mut account2,
            b"Bob Private".to_string(),
            b"desc".to_string(),
            b"blob".to_string(),
            false,
            &clock,
            ts.ctx(),
        );
        transfer::public_transfer(content, CREATOR2);
        ts.return_to_sender(account2);
    };

    // Subscribe to CREATOR 1 (not CREATOR 2)
    mint_sui(SUBSCRIBER, ONE_SUI, &mut ts);
    ts.next_tx(SUBSCRIBER);
    {
        let mut account1 = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let sub = patreon::subscribe(&mut account1, payment, &clock, ts.ctx());
        transfer::public_transfer(sub, SUBSCRIBER);
        ts::return_to_address(CREATOR, account1);
    };

    // Try to access CREATOR 2's private content with CREATOR 1's subscription
    ts.next_tx(SUBSCRIBER);
    let content = ts.take_from_address<patreon::Content>(CREATOR2);
    let sub = ts.take_from_sender<patreon::Subscription>();
    patreon::assert_content_access(&content, &sub, &clock); // should fail ENotSubscribed

    abort 0
}

// ================================================================
// =================== FULL FLOW E2E TEST =========================
// ================================================================

#[test]
fun full_e2e_flow() {
    let mut ts = setup();
    let mut clock = clock::create_for_testing(ts.ctx());
    clock.set_for_testing(1000);

    // 1. Creator creates account
    ts.next_tx(CREATOR);
    {
        let mut platform = ts.take_shared<patreon::Platform>();
        patreon::create_creator_account(
            &mut platform,
            b"Alice".to_string(),
            b"Web3 art content".to_string(),
            ONE_SUI,
            &clock,
            ts.ctx(),
        );
        assert!(patreon::platform_total_creators(&platform) == 1);
        ts::return_shared(platform);
    };

    // 2. Creator publishes public and private content
    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();

        let public_content = patreon::create_content(
            &mut account,
            b"Free Art".to_string(),
            b"Check out my free art".to_string(),
            b"walrus_free".to_string(),
            true,
            &clock,
            ts.ctx(),
        );
        let private_content = patreon::create_content(
            &mut account,
            b"Exclusive Art".to_string(),
            b"Patron-only content".to_string(),
            b"walrus_exclusive".to_string(),
            false,
            &clock,
            ts.ctx(),
        );

        assert!(patreon::creator_content_count(&account) == 2);

        transfer::public_transfer(public_content, CREATOR);
        transfer::public_transfer(private_content, CREATOR);
        ts.return_to_sender(account);
    };

    // 3. Subscriber subscribes
    mint_sui(SUBSCRIBER, 2 * ONE_SUI, &mut ts);
    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        let sub = patreon::subscribe(&mut account, payment, &clock, ts.ctx());

        assert!(patreon::creator_total_subscribers(&account) == 1);
        assert!(patreon::creator_balance(&account) == ONE_SUI);
        assert!(patreon::is_subscription_active(&sub, &clock));

        transfer::public_transfer(sub, SUBSCRIBER);
        ts::return_to_address(CREATOR, account);
    };

    // 4. Creator updates profile
    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        patreon::update_creator_profile(
            &mut account,
            b"Alice Pro".to_string(),
            b"Premium web3 art".to_string(),
            2 * ONE_SUI, // price increase
            ts.ctx(),
        );
        assert!(patreon::creator_name(&account) == b"Alice Pro".to_string());
        assert!(patreon::creator_subscription_price(&account) == 2 * ONE_SUI);
        ts.return_to_sender(account);
    };

    // 5. Creator toggles content visibility
    ts.next_tx(CREATOR);
    {
        let account = ts.take_from_sender<patreon::CreatorAccount>();
        let mut content = ts.take_from_sender<patreon::Content>();
        patreon::set_content_visibility(&account, &mut content, false, ts.ctx());
        assert!(!patreon::content_is_public(&content));
        ts.return_to_sender(content);
        ts.return_to_sender(account);
    };

    // 6. Time passes, subscription expires
    clock.increment_for_testing(THIRTY_DAYS_MS + 1);

    ts.next_tx(SUBSCRIBER);
    {
        let sub = ts.take_from_sender<patreon::Subscription>();
        assert!(!patreon::is_subscription_active(&sub, &clock));
        ts.return_to_sender(sub);
    };

    // 7. Subscriber renews
    mint_sui(SUBSCRIBER, 2 * ONE_SUI, &mut ts);
    ts.next_tx(SUBSCRIBER);
    {
        let mut account = ts.take_from_address<patreon::CreatorAccount>(CREATOR);
        let mut sub = ts.take_from_sender<patreon::Subscription>();
        let payment = ts.take_from_sender<coin::Coin<SUI>>();
        patreon::renew_subscription(&mut account, &mut sub, payment, &clock, ts.ctx());
        assert!(patreon::is_subscription_active(&sub, &clock));
        assert!(patreon::creator_balance(&account) == ONE_SUI + 2 * ONE_SUI);
        ts.return_to_sender(sub);
        ts::return_to_address(CREATOR, account);
    };

    // 8. Creator deletes a content
    ts.next_tx(CREATOR);
    {
        let mut account = ts.take_from_sender<patreon::CreatorAccount>();
        let content = ts.take_from_sender<patreon::Content>();
        patreon::delete_content(&mut account, content, ts.ctx());
        assert!(patreon::creator_content_count(&account) == 1);
        ts.return_to_sender(account);
    };

    clock.destroy_for_testing();
    ts.end();
}
