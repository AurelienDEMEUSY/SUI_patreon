// ============================================================
// Network & Contract Configuration
// ============================================================

/**
 * The Sui network to use. Switch to 'mainnet' for production.
 */
export const SUI_NETWORK = "testnet" as const;

/**
 * The deployed Move package ID for the Patreon contract.
 * Update this after running `sui client publish` in the contract/ directory.
 */
export const PACKAGE_ID = "0xaf96d62a4f48d290a7b89ff06a378bffa6f52e8c99a522dbbaf809fb659d4bdd";

/**
 * The shared Platform object ID created during contract initialization.
 * Update this after deploying — it's emitted in the publish transaction.
 */
export const PLATFORM_ID = "0x21d04f36c70ce554b59913311a96a8287da4b146793b8640aaddac74fe7e5cce";

/**
 * Move module names in the package.
 */
export const SERVICE_MODULE = "service";
export const SUBSCRIPTION_MODULE = "subscription";

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
