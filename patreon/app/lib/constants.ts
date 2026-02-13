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
export const PACKAGE_ID = "0xTODO_REPLACE_AFTER_DEPLOY";

/**
 * The shared Platform object ID created during contract initialization.
 * Update this after deploying — it's emitted in the publish transaction.
 */
export const PLATFORM_ID = "0xTODO_REPLACE_AFTER_DEPLOY";

/**
 * The module name in the Move package.
 */
export const MODULE_NAME = "contract";

// ============================================================
// Seal Key Servers (Testnet)
// ============================================================

/**
 * Verified Seal key server object IDs on testnet.
 * These are operated by independent organizations.
 * @see https://docs.seal.mystenlabs.com
 */
export const SEAL_KEY_SERVER_OBJECT_IDS = [
    "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
    "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
];

/**
 * Threshold: minimum number of key servers needed for decryption.
 * With 2 servers and threshold 2, both must approve.
 */
export const SEAL_THRESHOLD = 2;

// ============================================================
// Walrus Configuration
// ============================================================

/**
 * Walrus publisher URL — for uploading encrypted blobs.
 * Testnet publisher endpoint.
 */
export const WALRUS_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";

/**
 * Walrus aggregator URL — for downloading blobs.
 * Testnet aggregator endpoint.
 */
export const WALRUS_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";

/**
 * Number of Walrus storage epochs (how long the blob is stored).
 * 1 epoch ≈ 1 day on testnet.
 */
export const WALRUS_EPOCHS = 5;
