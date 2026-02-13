import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, PLATFORM_ID } from "./constants";

// ============================================================
// Transaction Builders for the Patreon Contract
// ============================================================
//
// Each function returns a Transaction that can be signed and executed
// using @mysten/dapp-kit's useSignAndExecuteTransaction() hook.

/**
 * Build a transaction to register as a creator on the platform.
 * Creates a shared Service object whose ID becomes the Seal identity.
 *
 * @param name - Creator display name
 * @param description - Creator bio / description
 * @returns Transaction to sign and execute
 */
export function buildCreateProfile(
    name: string,
    description: string
): Transaction {
    const tx = new Transaction();

    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_creator_profile`,
        arguments: [
            tx.object(PLATFORM_ID),
            tx.pure.string(name),
            tx.pure.string(description),
        ],
    });

    return tx;
}

/**
 * Build a transaction to add a subscription tier to a creator's service.
 *
 * @param serviceObjectId - The creator's Service object ID
 * @param tierLevel - Tier level number (1 = basic, 2 = premium, etc.)
 * @param name - Human-readable tier name
 * @param priceInMist - Price in MIST (1 SUI = 1_000_000_000 MIST)
 * @param durationMs - Duration in milliseconds
 * @returns Transaction to sign and execute
 */
export function buildAddTier(
    serviceObjectId: string,
    tierLevel: number,
    name: string,
    priceInMist: number,
    durationMs: number
): Transaction {
    const tx = new Transaction();

    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::add_subscription_tier`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.u64(tierLevel),
            tx.pure.string(name),
            tx.pure.u64(priceInMist),
            tx.pure.u64(durationMs),
        ],
    });

    return tx;
}

/**
 * Build a transaction to publish an encrypted post.
 *
 * The content should be encrypted with Seal and uploaded to Walrus
 * BEFORE calling this function. Pass the resulting blob IDs.
 *
 * @param serviceObjectId - The creator's Service object ID
 * @param title - Post title
 * @param metadataBlobId - Walrus blob ID for encrypted metadata
 * @param dataBlobId - Walrus blob ID for encrypted data
 * @param requiredTier - Minimum tier level to access (0 = free)
 * @returns Transaction to sign and execute
 */
export function buildPublishPost(
    serviceObjectId: string,
    title: string,
    metadataBlobId: string,
    dataBlobId: string,
    requiredTier: number
): Transaction {
    const tx = new Transaction();

    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::publish_post`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.string(title),
            tx.pure.string(metadataBlobId),
            tx.pure.string(dataBlobId),
            tx.pure.u64(requiredTier),
            tx.object("0x6"), // Clock
        ],
    });

    return tx;
}

/**
 * Build a transaction to subscribe to a creator.
 *
 * The subscriber pays in SUI. The payment is split between
 * the creator (95%) and the platform (5%).
 *
 * @param serviceObjectId - The creator's Service object ID
 * @param tierLevel - Tier level to subscribe to
 * @param paymentAmountMist - Payment amount in MIST
 * @returns Transaction to sign and execute
 */
export function buildSubscribe(
    serviceObjectId: string,
    tierLevel: number,
    paymentAmountMist: number
): Transaction {
    const tx = new Transaction();

    // Split the exact payment from the gas coin
    const [paymentCoin] = tx.splitCoins(tx.gas, [
        tx.pure.u64(paymentAmountMist),
    ]);

    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::subscribe`,
        arguments: [
            tx.object(serviceObjectId),
            tx.object(PLATFORM_ID),
            tx.pure.u64(tierLevel),
            paymentCoin,
            tx.object("0x6"), // Clock
        ],
    });

    return tx;
}

/**
 * Build a transaction for a creator to withdraw their accumulated revenue.
 *
 * @param serviceObjectId - The creator's Service object ID
 * @returns Transaction to sign and execute
 */
export function buildWithdrawRevenue(
    serviceObjectId: string
): Transaction {
    const tx = new Transaction();

    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::withdraw_creator_funds`,
        arguments: [tx.object(serviceObjectId)],
    });

    return tx;
}

// ============================================================
// New CRUD Operations
// ============================================================

/**
 * Update creator profile details.
 */
export function buildUpdateProfile(
    serviceObjectId: string,
    name: string,
    description: string
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_creator_profile`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.string(name),
            tx.pure.string(description),
        ],
    });
    return tx;
}

/**
 * Remove a subscription tier.
 */
export function buildRemoveTier(
    serviceObjectId: string,
    tierLevel: number
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::remove_subscription_tier`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.u64(tierLevel),
        ],
    });
    return tx;
}

/**
 * Update an existing post.
 */
export function buildUpdatePost(
    serviceObjectId: string,
    postId: string | number,
    title: string,
    metadataBlobId: string,
    dataBlobId: string
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_post`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.u64(postId),
            tx.pure.string(title),
            tx.pure.string(metadataBlobId),
            tx.pure.string(dataBlobId),
        ],
    });
    return tx;
}

/**
 * Set the required tier for a post.
 */
export function buildSetPostVisibility(
    serviceObjectId: string,
    postId: string | number,
    requiredTier: number
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::set_post_visibility`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.u64(postId),
            tx.pure.u64(requiredTier),
        ],
    });
    return tx;
}

/**
 * Delete a post.
 */
export function buildDeletePost(
    serviceObjectId: string,
    postId: string | number
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::delete_post`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.u64(postId),
        ],
    });
    return tx;
}
