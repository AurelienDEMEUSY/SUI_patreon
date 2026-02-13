import { SealClient, SessionKey } from "@mysten/seal";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import {
    SUI_NETWORK,
    PACKAGE_ID,
    MODULE_NAME,
    SEAL_KEY_SERVER_OBJECT_IDS,
    SEAL_THRESHOLD,
} from "./constants";

// ============================================================
// Types
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySuiClient = any;

/** Convert a hex string to a number array (for tx.pure.vector) */
function hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
}

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// ============================================================
// SealClient Singleton
// ============================================================

let sealClientInstance: SealClient | null = null;

/**
 * Get or create a SealClient instance.
 * Reuses the same instance for performance (caches keys internally).
 */
export function getSealClient(suiClient: AnySuiClient): SealClient {
    if (!sealClientInstance) {
        sealClientInstance = new SealClient({
            suiClient,
            serverConfigs: SEAL_KEY_SERVER_OBJECT_IDS.map((id) => ({
                objectId: id,
                weight: 1,
            })),
            verifyKeyServers: false,
        });
    }
    return sealClientInstance;
}

/**
 * Create a default SuiJsonRpcClient for the configured network.
 */
export function createSuiClient(): SuiJsonRpcClient {
    return new SuiJsonRpcClient({
        url: getJsonRpcFullnodeUrl(SUI_NETWORK),
        network: SUI_NETWORK,
    });
}

// ============================================================
// Seal Identity Construction
// ============================================================

/**
 * Build the Seal identity bytes from a Service object ID and Post ID.
 * Defines the identity as: [ServiceAddress (32 bytes)][PostId (8 bytes, little-endian)]
 *
 * @param serviceObjectId - The hex string of the Service object ID
 * @param postId - The ID of the post (u64)
 * @returns Hex string of the identity
 */
export function buildSealId(serviceObjectId: string, postId: string | number): string {
    const serviceAddr = serviceObjectId.startsWith("0x") ? serviceObjectId : `0x${serviceObjectId}`;

    // Address is 32 bytes
    const serviceBytes = bcs.Address.serialize(serviceAddr).toBytes();

    // Post ID is u64 (8 bytes)
    const postBytes = bcs.u64().serialize(postId).toBytes();

    const combined = new Uint8Array(serviceBytes.length + postBytes.length);
    combined.set(serviceBytes);
    combined.set(postBytes, serviceBytes.length);

    return toHex(combined);
}

// ============================================================
// Encryption
// ============================================================

/**
 * Encrypt content using Seal.
 *
 * @param suiClient - SuiClient instance
 * @param data - The plaintext bytes to encrypt
 * @param serviceObjectId - The Service object ID
 * @param postId - The Post ID
 * @returns The encrypted bytes and a backup key
 */
export async function encryptContent(
    suiClient: AnySuiClient,
    data: Uint8Array,
    serviceObjectId: string,
    postId: string | number
): Promise<{ encryptedBytes: Uint8Array; backupKey: Uint8Array }> {
    const sealClient = getSealClient(suiClient);
    const id = buildSealId(serviceObjectId, postId);
    const packageId = PACKAGE_ID.replace("0x", "");

    const result = await sealClient.encrypt({
        threshold: SEAL_THRESHOLD,
        packageId,
        id,
        data,
    });

    return {
        encryptedBytes: result.encryptedObject as Uint8Array,
        backupKey: result.key as Uint8Array,
    };
}

// ============================================================
// Session Key Management
// ============================================================

/**
 * Create a Seal session key for decryption.
 *
 * @param suiAddress - The user's Sui wallet address
 * @param suiClient - SuiClient instance
 * @param ttlMin - Time-to-live in minutes (default: 10)
 * @returns The SessionKey instance (not yet signed)
 */
export async function createSessionKey(
    suiAddress: string,
    suiClient: AnySuiClient,
    ttlMin: number = 10
): Promise<SessionKey> {
    const packageId = PACKAGE_ID.replace("0x", "");

    const sessionKey = await SessionKey.create({
        address: suiAddress,
        packageId,
        ttlMin,
        suiClient,
    });

    return sessionKey;
}

// ============================================================
// Decryption
// ============================================================

/**
 * Build the PTB for Seal decryption.
 * Key servers dry-run this to verify access.
 *
 * @param serviceObjectId - The Service object ID
 * @param postId - The Post ID
 * @param suiClient - SuiClient instance
 * @returns The built transaction bytes (TransactionKind only)
 */
export async function buildDecryptionTx(
    serviceObjectId: string,
    postId: string | number,
    suiClient: AnySuiClient
): Promise<Uint8Array> {
    const idHex = buildSealId(serviceObjectId, postId);
    const idBytes = hexToBytes(idHex);

    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::seal_approve`,
        arguments: [
            tx.pure.vector("u8", idBytes),
            tx.object(serviceObjectId),
            tx.object("0x6"), // Clock
        ],
    });

    const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
    });

    return txBytes as Uint8Array;
}

/**
 * Decrypt content using Seal.
 *
 * @param suiClient - SuiClient instance
 * @param encryptedData - The encrypted bytes (from Walrus)
 * @param serviceObjectId - The Service object ID
 * @param postId - The Post ID
 * @param sessionKey - An active, signed SessionKey
 * @returns The decrypted plaintext bytes
 */
export async function decryptContent(
    suiClient: AnySuiClient,
    encryptedData: Uint8Array,
    serviceObjectId: string,
    postId: string | number,
    sessionKey: SessionKey
): Promise<Uint8Array> {
    const sealClient = getSealClient(suiClient);
    const txBytes = await buildDecryptionTx(serviceObjectId, postId, suiClient);

    const decryptedBytes = await sealClient.decrypt({
        data: encryptedData,
        sessionKey,
        txBytes,
    });

    return decryptedBytes as Uint8Array;
}
