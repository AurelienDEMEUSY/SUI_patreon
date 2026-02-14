import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, PLATFORM_ID, SERVICE_MODULE, SUBSCRIPTION_MODULE } from "./contract-constants";

// ============================================================
// Transaction Builders for the Patreon Contract
// ============================================================

/**
 * Register as a creator on the platform.
 * Creates a shared Service object whose ID becomes the Seal identity.
 */
export function buildCreateProfile(
    name: string,
    description: string
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::create_creator_profile`,
        arguments: [
            tx.object(PLATFORM_ID),
            tx.pure.string(name),
            tx.pure.string(description),
        ],
    });
    return tx;
}

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
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::update_creator_profile`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.string(name),
            tx.pure.string(description),
        ],
    });
    return tx;
}

/**
 * Add a subscription tier to a creator's service.
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
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::add_subscription_tier`,
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
 * Remove a subscription tier.
 */
export function buildRemoveTier(
    serviceObjectId: string,
    tierLevel: number
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::remove_subscription_tier`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.u64(tierLevel),
        ],
    });
    return tx;
}

/**
 * Publish an encrypted post (content encrypted with Seal, stored on Walrus).
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
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::publish_post`,
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
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::update_post`,
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
 * Set post visibility (required tier).
 */
export function buildSetPostVisibility(
    serviceObjectId: string,
    postId: string | number,
    requiredTier: number
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::set_post_visibility`,
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
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::delete_post`,
        arguments: [
            tx.object(serviceObjectId),
            tx.pure.u64(postId),
        ],
    });
    return tx;
}

/**
 * Subscribe to a creator by paying the tier price in SUI.
 * Payment is split: creator (95%) + platform fee (5%).
 *
 * IMPORTANT — Sponsored transaction compatibility:
 * Enoki forbids referencing `tx.gas` (GasCoin) in transaction arguments because
 * the gas coin belongs to the sponsor, not the user. Instead, the caller must
 * provide explicit SUI coin object(s) owned by the user. If multiple coins are
 * provided, they are merged into the first one before splitting the payment.
 *
 * @param serviceObjectId  The creator's Service object ID
 * @param tierLevel        The tier level to subscribe to
 * @param paymentAmountMist The price in MIST (1 SUI = 1_000_000_000 MIST)
 * @param userCoins        Array of the user's SUI coin objects (at least one required)
 */
export function buildSubscribe(
    serviceObjectId: string,
    tierLevel: number,
    paymentAmountMist: number,
    userCoins: { coinObjectId: string }[],
): Transaction {
    if (userCoins.length === 0) {
        throw new Error("No SUI coins provided for subscription payment");
    }

    const tx = new Transaction();

    // Reference the primary coin
    const primaryCoin = tx.object(userCoins[0].coinObjectId);

    // Merge additional coins into the primary if the user has multiple
    if (userCoins.length > 1) {
        tx.mergeCoins(
            primaryCoin,
            userCoins.slice(1).map((c) => tx.object(c.coinObjectId)),
        );
    }

    // Split exact payment from the user's own coin (NOT tx.gas)
    const [paymentCoin] = tx.splitCoins(primaryCoin, [
        tx.pure.u64(paymentAmountMist),
    ]);

    tx.moveCall({
        target: `${PACKAGE_ID}::${SUBSCRIPTION_MODULE}::subscribe`,
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
 * Creator withdraws accumulated revenue.
 */
export function buildWithdrawRevenue(
    serviceObjectId: string
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::withdraw_creator_funds`,
        arguments: [tx.object(serviceObjectId)],
    });
    return tx;
}

/**
 * Delete the creator's profile and unregister from the platform.
 * Requires no active subscribers. Remaining revenue is returned.
 */
export function buildDeleteProfile(
    serviceObjectId: string
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::delete_creator_profile`,
        arguments: [
            tx.object(serviceObjectId),
            tx.object(PLATFORM_ID),
        ],
    });
    return tx;
}

// ============================================================
// SuiNS Name Management
// ============================================================

/**
 * Link a SuiNS subname to the creator's Service.
 * Must be signed by the creator (service.creator == sender).
 * Called after the API route has created the leaf on SuiNS.
 */
export function buildSetSuinsName(
    serviceObjectId: string,
    suinsName: string,
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::set_suins_name`,
        arguments: [
            tx.object(serviceObjectId),
            tx.object(PLATFORM_ID),
            tx.pure.string(suinsName),
        ],
    });
    return tx;
}

/**
 * Remove the SuiNS subname link from the creator's Service.
 * Must be signed by the creator.
 */
export function buildRemoveSuinsName(
    serviceObjectId: string,
): Transaction {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${SERVICE_MODULE}::remove_suins_name`,
        arguments: [
            tx.object(serviceObjectId),
            tx.object(PLATFORM_ID),
        ],
    });
    return tx;
}
