#[test_only]
module contract::contract_tests;

use sui::test_scenario::{Self as ts};
use sui::clock;
use sui::coin;
use sui::sui::SUI;
use sui::bcs;
use contract::service::{Self as service, Service};
use contract::platform::{Self as platform, Platform, AdminCap};
use contract::subscription;

const ADMIN: address = @0xAD;
const CREATOR: address = @0xC1;
const SUBSCRIBER: address = @0x51;

const ENoAccess: u64 = 4;

#[test]
fun test_create_creator_profile() {
    let mut scenario = ts::begin(ADMIN);
    {
        platform::init_for_testing(scenario.ctx());
    };

    // Creator registers
    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(
            &mut platform,
            b"Test Creator".to_string(),
            b"A test creator".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(platform);
    };

    // Verify Service was created as shared object
    scenario.next_tx(CREATOR);
    {
        let service = scenario.take_shared<Service>();
        assert!(service::get_post_count(&service) == 0);
        assert!(service::get_tier_count(&service) == 0);
        ts::return_shared(service);
    };

    scenario.end();
}

#[test]
fun test_add_subscription_tier() {
    let mut scenario = ts::begin(ADMIN);
    {
        platform::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(
            &mut platform,
            b"Creator".to_string(),
            b"desc".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(platform);
    };

    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        service::add_subscription_tier(
            &mut service,
            1, // tier_level
            b"Basic".to_string(),
            1_000_000_000, // 1 SUI
            30 * 24 * 60 * 60 * 1000, // 30 days in ms
            scenario.ctx(),
        );
        assert!(service::get_tier_count(&service) == 1);
        ts::return_shared(service);
    };

    scenario.end();
}

#[test]
fun test_publish_post() {
    let mut scenario = ts::begin(ADMIN);
    {
        platform::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(
            &mut platform,
            b"Creator".to_string(),
            b"desc".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(platform);
    };

    // Add a tier, then publish a post
    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        let clock = clock::create_for_testing(scenario.ctx());

        service::add_subscription_tier(
            &mut service,
            1,
            b"Basic".to_string(),
            1_000_000_000,
            30 * 24 * 60 * 60 * 1000,
            scenario.ctx(),
        );

        service::publish_post(
            &mut service,
            b"My first post".to_string(),
            b"meta_blob_123".to_string(),
            b"data_blob_456".to_string(),
            1, // requires Basic tier
            &clock,
            scenario.ctx(),
        );

        assert!(service::get_post_count(&service) == 1);

        clock::destroy_for_testing(clock);
        ts::return_shared(service);
    };

    scenario.end();
}

#[test]
fun test_subscribe_overpayment_refund() {
    let mut scenario = ts::begin(ADMIN);
    {
        platform::init_for_testing(scenario.ctx());
    };

    // Creator setup
    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(&mut platform, b"C".to_string(), b"D".to_string(), scenario.ctx());
        ts::return_shared(platform);
    };

    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        service::add_subscription_tier(
            &mut service,
            1,
            b"Basic".to_string(),
            1_000_000_000, // 1 SUI
            30 * 24 * 60 * 60 * 1000,
            scenario.ctx(),
        );
        ts::return_shared(service);
    };

    // Subscriber pays 10 SUI for 1 SUI tier
    scenario.next_tx(SUBSCRIBER);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        let clock = clock::create_for_testing(scenario.ctx());

        let payment = coin::mint_for_testing<SUI>(10_000_000_000, scenario.ctx());

        subscription::subscribe(
            &mut service,
            &mut platform,
            1,
            payment,
            &clock,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clock);
        ts::return_shared(service);
        ts::return_shared(platform);
    };

    // Check subscriber got 9 SUI back
    scenario.next_tx(SUBSCRIBER);
    {
        let coin = scenario.take_from_sender<coin::Coin<SUI>>();
        assert!(coin::value(&coin) == 9_000_000_000);
        scenario.return_to_sender(coin);
    };

    scenario.end();
}

#[test]
fun test_seal_approve_tier_access() {
    let mut scenario = ts::begin(ADMIN);
    {
        platform::init_for_testing(scenario.ctx());
    };

    // setup
    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(&mut platform, b"C".to_string(), b"D".to_string(), scenario.ctx());
        ts::return_shared(platform);
    };

    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        let clock = clock::create_for_testing(scenario.ctx());

        // Add Tier 1 (Basic) and Tier 2 (Premium)
        service::add_subscription_tier(&mut service, 1, b"Basic".to_string(), 100, 1000, scenario.ctx());
        service::add_subscription_tier(&mut service, 2, b"Premium".to_string(), 200, 1000, scenario.ctx());

        // Publish Post 0 (Tier 1) and Post 1 (Tier 2)
        service::publish_post(&mut service, b"P1".to_string(), b"".to_string(), b"".to_string(), 1, &clock, scenario.ctx());
        service::publish_post(&mut service, b"P2".to_string(), b"".to_string(), b"".to_string(), 2, &clock, scenario.ctx());

        clock::destroy_for_testing(clock);
        ts::return_shared(service);
    };

    // Subscriber buys Tier 1
    scenario.next_tx(SUBSCRIBER);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        let mut clock = clock::create_for_testing(scenario.ctx());
        clock::set_for_testing(&mut clock, 100);

        let payment = coin::mint_for_testing<SUI>(100, scenario.ctx());
        subscription::subscribe(&mut service, &mut platform, 1, payment, &clock, scenario.ctx());

        let service_addr = object::id_address(&service);

        // Try to access Post 0 (Tier 1) -> Should Succeed
        let post_id_0: u64 = 0;
        let mut id_0 = bcs::to_bytes(&service_addr);
        vector::append(&mut id_0, bcs::to_bytes(&post_id_0));

        service::seal_approve(id_0, &service, &clock, scenario.ctx());

        ts::return_shared(service);
        ts::return_shared(platform);
        clock::destroy_for_testing(clock);
    };

    // Subscriber tries to access Post 1 (Tier 2) -> Should Fail
    scenario.next_tx(SUBSCRIBER);
    {
        let service = scenario.take_shared<Service>();
        let clock = clock::create_for_testing(scenario.ctx());

        let service_addr = object::id_address(&service);
        let post_id_1: u64 = 1;
        let mut id_1 = bcs::to_bytes(&service_addr);
        vector::append(&mut id_1, bcs::to_bytes(&post_id_1));

        // This should NOT abort in test because we can't catch aborts easily without specific test support,
        // but in normal Move test failure IS the abort.
        // So we expect this to fail.
        // To test failure we need #[expected_failure] but we can't do that in the middle of a test.
        // So we will split this test into successful access and failing access.

        ts::return_shared(service);
        clock::destroy_for_testing(clock);
    };

    scenario.end();
}

#[test]
#[expected_failure(abort_code = ENoAccess, location = contract::service)]
fun test_seal_approve_fail_low_tier() {
    let mut scenario = ts::begin(ADMIN);
    { platform::init_for_testing(scenario.ctx()); };

    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(&mut platform, b"C".to_string(), b"D".to_string(), scenario.ctx());
        ts::return_shared(platform);
    };

    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        let clock = clock::create_for_testing(scenario.ctx());
        service::add_subscription_tier(&mut service, 2, b"Premium".to_string(), 200, 1000, scenario.ctx());
        service::publish_post(&mut service, b"P2".to_string(), b"".to_string(), b"".to_string(), 2, &clock, scenario.ctx());
        clock::destroy_for_testing(clock);
        ts::return_shared(service);
    };

    // Since we don't have a Tier 1 to buy, let's create it first
    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        service::add_subscription_tier(&mut service, 1, b"Basic".to_string(), 100, 1000, scenario.ctx());
        ts::return_shared(service);
    };

    // Buy Tier 1
    scenario.next_tx(SUBSCRIBER);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        let clock = clock::create_for_testing(scenario.ctx());
        let payment = coin::mint_for_testing<SUI>(100, scenario.ctx());
        subscription::subscribe(&mut service, &mut platform, 1, payment, &clock, scenario.ctx());
        ts::return_shared(service);
        ts::return_shared(platform);
        clock::destroy_for_testing(clock);
    };

    // Try to access Post 0 (Tier 2) with Tier 1 Subscription
    scenario.next_tx(SUBSCRIBER);
    {
        let service = scenario.take_shared<Service>();
        let clock = clock::create_for_testing(scenario.ctx());

        let service_addr = object::id_address(&service);
        let post_id: u64 = 0; // The first post created was the Tier 2 one
        let mut id = bcs::to_bytes(&service_addr);
        vector::append(&mut id, bcs::to_bytes(&post_id));

        service::seal_approve(id, &service, &clock, scenario.ctx()); // Expect abort

        ts::return_shared(service);
        clock::destroy_for_testing(clock);
    };
    scenario.end();
}

#[test]
fun test_crud_operations() {
    let mut scenario = ts::begin(ADMIN);
    { platform::init_for_testing(scenario.ctx()); };

    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(&mut platform, b"C".to_string(), b"D".to_string(), scenario.ctx());
        ts::return_shared(platform);
    };

    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();

        // Update Profile
        service::update_creator_profile(&mut service, b"New Name".to_string(), b"New Desc".to_string(), scenario.ctx());
        assert!(service::get_creator_name(&service) == b"New Name".to_string());

        // Create Post
        let clock = clock::create_for_testing(scenario.ctx());
        service::add_subscription_tier(&mut service, 1, b"Basic".to_string(), 100, 1000, scenario.ctx());
        service::publish_post(&mut service, b"Title".to_string(), b"M".to_string(), b"D".to_string(), 1, &clock, scenario.ctx());

        // Update Post
        service::update_post(&mut service, 0, b"New Title".to_string(), b"M2".to_string(), b"D2".to_string(), scenario.ctx());

        // Set Visibility (Free)
        service::set_post_visibility(&mut service, 0, 0, scenario.ctx());

        // Delete Post
        service::delete_post(&mut service, 0, scenario.ctx());
        assert!(service::get_post_count(&service) == 0);

        clock::destroy_for_testing(clock);
        ts::return_shared(service);
    };
    scenario.end();
}

#[test]
fun test_admin_update_fee() {
    let mut scenario = ts::begin(ADMIN);
    { platform::init_for_testing(scenario.ctx()); };

    scenario.next_tx(ADMIN);
    {
        let mut platform = scenario.take_shared<Platform>();
        let cap = scenario.take_from_sender<AdminCap>();

        platform::update_platform_fee(&mut platform, &cap, 1000, scenario.ctx()); // 10%

        scenario.return_to_sender(cap);
        ts::return_shared(platform);
    };
    scenario.end();
}

#[test]
fun test_set_suins_name() {
    let mut scenario = ts::begin(ADMIN);
    { platform::init_for_testing(scenario.ctx()); };

    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(
            &mut platform,
            b"Creator".to_string(),
            b"desc".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(platform);
    };

    // Set SuiNS name
    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        service::set_suins_name(
            &mut service,
            &mut platform,
            b"creator.patreon.sui".to_string(),
            scenario.ctx(),
        );
        assert!(service::get_suins_name(&service) == option::some(b"creator.patreon.sui".to_string()));
        ts::return_shared(service);
        ts::return_shared(platform);
    };

    scenario.end();
}

#[test]
fun test_remove_suins_name() {
    let mut scenario = ts::begin(ADMIN);
    { platform::init_for_testing(scenario.ctx()); };

    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(
            &mut platform,
            b"Creator".to_string(),
            b"desc".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(platform);
    };

    // Set name
    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        service::set_suins_name(
            &mut service,
            &mut platform,
            b"creator.patreon.sui".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(service);
        ts::return_shared(platform);
    };

    // Remove name
    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        service::remove_suins_name(
            &mut service,
            &mut platform,
            scenario.ctx(),
        );
        assert!(service::get_suins_name(&service) == option::none());
        ts::return_shared(service);
        ts::return_shared(platform);
    };

    scenario.end();
}

#[test]
fun test_change_suins_name() {
    let mut scenario = ts::begin(ADMIN);
    { platform::init_for_testing(scenario.ctx()); };

    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(
            &mut platform,
            b"Creator".to_string(),
            b"desc".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(platform);
    };

    // Set initial name
    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        service::set_suins_name(
            &mut service,
            &mut platform,
            b"old.patreon.sui".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(service);
        ts::return_shared(platform);
    };

    // Change to new name
    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        service::set_suins_name(
            &mut service,
            &mut platform,
            b"new.patreon.sui".to_string(),
            scenario.ctx(),
        );
        assert!(service::get_suins_name(&service) == option::some(b"new.patreon.sui".to_string()));
        ts::return_shared(service);
        ts::return_shared(platform);
    };

    scenario.end();
}

#[test]
fun test_admin_remove_suins_name() {
    let mut scenario = ts::begin(ADMIN);
    { platform::init_for_testing(scenario.ctx()); };

    scenario.next_tx(CREATOR);
    {
        let mut platform = scenario.take_shared<Platform>();
        service::create_creator_profile(
            &mut platform,
            b"C".to_string(),
            b"D".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(platform);
    };

    // Creator sets name
    scenario.next_tx(CREATOR);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        service::set_suins_name(
            &mut service,
            &mut platform,
            b"c.patreon.sui".to_string(),
            scenario.ctx(),
        );
        ts::return_shared(service);
        ts::return_shared(platform);
    };

    // Admin removes the name
    scenario.next_tx(ADMIN);
    {
        let mut service = scenario.take_shared<Service>();
        let mut platform = scenario.take_shared<Platform>();
        let cap = scenario.take_from_sender<AdminCap>();
        service::admin_remove_suins_name(
            &mut service,
            &mut platform,
            &cap,
            scenario.ctx(),
        );
        assert!(service::get_suins_name(&service) == option::none());
        scenario.return_to_sender(cap);
        ts::return_shared(service);
        ts::return_shared(platform);
    };

    scenario.end();
}
