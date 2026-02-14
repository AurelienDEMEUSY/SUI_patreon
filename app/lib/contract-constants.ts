// ============================================================
// Network & Contract Configuration
// ============================================================

/**
 * The Sui network to use. Switch to 'mainnet' for production.
 * Set via NEXT_PUBLIC_SUI_NETWORK in .env.local.
 */
export const SUI_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet") as "testnet" | "mainnet" | "devnet";

/**
 * The deployed Move package ID for the Patreon contract.
 * Set via NEXT_PUBLIC_PACKAGE_ID in .env.local after running `sui client publish`.
 */
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID
    ?? "0xaf96d62a4f48d290a7b89ff06a378bffa6f52e8c99a522dbbaf809fb659d4bdd";

/**
 * The shared Platform object ID created during contract initialization.
 * Set via NEXT_PUBLIC_PLATFORM_ID in .env.local — emitted in the publish transaction.
 */
export const PLATFORM_ID = process.env.NEXT_PUBLIC_PLATFORM_ID
    ?? "0x21d04f36c70ce554b59913311a96a8287da4b146793b8640aaddac74fe7e5cce";

/**
 * Move module names in the package.
 */
export const SERVICE_MODULE = "service";
export const SUBSCRIPTION_MODULE = "subscription";

// ============================================================
// Enoki Sponsored Transactions — Allowed Targets & Addresses
// ============================================================

/**
 * All Move call targets the app can sponsor.
 * Passed inline to createSponsoredTransaction (sender variant).
 */
export const ALLOWED_MOVE_CALL_TARGETS: string[] = [
    `${PACKAGE_ID}::${SERVICE_MODULE}::create_creator_profile`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::update_creator_profile`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::add_subscription_tier`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::remove_subscription_tier`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::publish_post`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::update_post`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::set_post_visibility`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::delete_post`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::withdraw_creator_funds`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::delete_creator_profile`,
    `${PACKAGE_ID}::${SERVICE_MODULE}::seal_approve`,
    `${PACKAGE_ID}::${SUBSCRIPTION_MODULE}::subscribe`,
];

/**
 * Shared object addresses referenced by transactions (Platform, Clock).
 * The sender address is added dynamically at call time.
 */
export const ALLOWED_ADDRESSES: string[] = [
    PLATFORM_ID,
    "0x6", // Sui Clock
];

// ============================================================
// Seal Key Servers (Testnet)
// ============================================================

/**
 * Verified Seal key server object IDs on testnet.
 * @see https://docs.seal.mystenlabs.com
 */
export const SEAL_KEY_SERVER_OBJECT_IDS = [
    "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
    "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
];

/**
 * Threshold: minimum number of key servers needed for decryption.
 */
export const SEAL_THRESHOLD = 2;

// ============================================================
// Walrus Configuration
// ============================================================

/**
 * Walrus publisher URL — for uploading encrypted blobs (testnet).
 */
export const WALRUS_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";

/**
 * Walrus aggregator URL — for downloading blobs (testnet).
 */
export const WALRUS_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";

/**
 * Number of Walrus storage epochs (1 epoch ≈ 1 day on testnet).
 */
export const WALRUS_EPOCHS = 5;

// ============================================================
// SuiNS Configuration
// ============================================================

/**
 * The parent SuiNS name under which creator subnames are created.
 * e.g., "alice.patreon.sui"
 */
export const SUINS_PARENT_NAME = "patreon.sui";

/**
 * Object ID of the SuinsRegistration NFT for the parent name (patreon.sui).
 * The admin wallet that signs subname creation must own this NFT.
 */
export const SUINS_PARENT_NFT_ID = "0x91ea4d5e68745fd48494687c347c87c9088674a795d260c7b7d854d9f8b3f12e";
