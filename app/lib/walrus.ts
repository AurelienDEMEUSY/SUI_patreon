import {
    WALRUS_PUBLISHER_URL,
    WALRUS_AGGREGATOR_URL,
    WALRUS_EPOCHS,
} from "./contract-constants";

// ============================================================
// Walrus Storage — Upload & Download encrypted blobs
// ============================================================

export interface WalrusUploadResponse {
    /** The blob ID assigned by Walrus */
    blobId: string;
    /** Whether this was a new upload or a reference to existing blob */
    isNew: boolean;
}

/**
 * Upload encrypted data to Walrus.
 * The data should already be encrypted with Seal before uploading.
 */
export async function uploadToWalrus(
    data: Uint8Array,
    epochs: number = WALRUS_EPOCHS
): Promise<WalrusUploadResponse> {
    const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/octet-stream",
        },
        body: data as unknown as BodyInit,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Walrus upload failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (result.newlyCreated) {
        return {
            blobId: result.newlyCreated.blobObject.blobId,
            isNew: true,
        };
    } else if (result.alreadyCertified) {
        return {
            blobId: result.alreadyCertified.blobId,
            isNew: false,
        };
    }

    throw new Error("Unexpected Walrus response format");
}

/**
 * Download a blob from Walrus.
 * Returns the raw bytes (still encrypted — decrypt with Seal after download).
 */
export async function downloadFromWalrus(
    blobId: string
): Promise<Uint8Array> {
    const url = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Walrus download failed (${response.status}): ${await response.text()}`
        );
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

/**
 * Upload already-encrypted data to Walrus and return the blob ID.
 */
export async function uploadEncryptedContent(
    encryptedData: Uint8Array
): Promise<string> {
    const result = await uploadToWalrus(encryptedData);
    return result.blobId;
}
