// ============================================================
// Post Service — Pack/unpack post data for Walrus + SEAL pipeline
// ============================================================
//
// Handles the serialization of post content (text + images) into
// two blobs ready for SEAL encryption and Walrus upload:
//   1. Metadata blob → JSON with text + image references
//   2. Data blob     → Binary pack of all image files
//
// Binary data blob format:
//   [4 bytes: image count (u32 LE)]
//   For each image:
//     [4 bytes: header JSON length (u32 LE)]
//     [N bytes: header JSON → { index, mimeType, fileName, size }]
//     [4 bytes: image data length (u32 LE)]
//     [M bytes: raw image bytes]

import type {
    PostMetadata,
    PostImage,
    PostImageUpload,
    DecryptedImage,
    OnChainPost,
} from '@/types/post.types';
import {
    SUPPORTED_IMAGE_TYPES,
    MAX_IMAGES_PER_POST,
    MAX_IMAGE_SIZE_BYTES,
    MAX_TOTAL_UPLOAD_BYTES,
    MAX_TITLE_LENGTH,
    MAX_TEXT_LENGTH,
} from '@/types/post.types';
import type { SupportedImageType } from '@/types/post.types';

// ============================================================
// Validation
// ============================================================

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validate post form data before starting the publish pipeline.
 */
export function validatePostData(
    title: string,
    text: string,
    images: PostImageUpload[]
): ValidationResult {
    const errors: string[] = [];

    // Title validation
    if (!title.trim()) {
        errors.push('Title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
        errors.push(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
    }

    // Content validation (at least text or images)
    if (!text.trim() && images.length === 0) {
        errors.push('Post must contain text or at least one image');
    }

    if (text.length > MAX_TEXT_LENGTH) {
        errors.push(`Text must be ${MAX_TEXT_LENGTH} characters or less`);
    }

    // Image validation
    if (images.length > MAX_IMAGES_PER_POST) {
        errors.push(`Maximum ${MAX_IMAGES_PER_POST} images per post`);
    }

    let totalSize = 0;
    for (const img of images) {
        if (img.file.size > MAX_IMAGE_SIZE_BYTES) {
            errors.push(`Image "${img.file.name}" exceeds ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB limit`);
        }
        if (!SUPPORTED_IMAGE_TYPES.includes(img.file.type as SupportedImageType)) {
            errors.push(`Image "${img.file.name}" has unsupported type "${img.file.type}". Supported: ${SUPPORTED_IMAGE_TYPES.join(', ')}`);
        }
        totalSize += img.file.size;
    }

    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
        errors.push(`Total image size exceeds ${MAX_TOTAL_UPLOAD_BYTES / (1024 * 1024)}MB limit`);
    }

    return { valid: errors.length === 0, errors };
}

// ============================================================
// Image reading
// ============================================================

/**
 * Read a File as a Uint8Array.
 */
async function readFileAsBytes(file: File): Promise<Uint8Array> {
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
}

/**
 * Get image dimensions from a File.
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to load image: ${file.name}`));
        };
        img.src = url;
    });
}

// ============================================================
// Pack images into a binary blob
// ============================================================

/**
 * Read image files and build the metadata + binary data blob.
 *
 * @returns metadata images array (for JSON) and the packed binary Uint8Array
 */
export async function packImages(
    imageUploads: PostImageUpload[]
): Promise<{ imageMetas: PostImage[]; dataBlob: Uint8Array }> {
    if (imageUploads.length === 0) {
        return { imageMetas: [], dataBlob: new Uint8Array(0) };
    }

    const imageMetas: PostImage[] = [];
    const imageBuffers: { header: Uint8Array; data: Uint8Array }[] = [];

    for (let i = 0; i < imageUploads.length; i++) {
        const upload = imageUploads[i];
        const data = await readFileAsBytes(upload.file);

        let width: number | undefined;
        let height: number | undefined;
        try {
            const dims = await getImageDimensions(upload.file);
            width = dims.width;
            height = dims.height;
        } catch {
            // Dimensions are optional — continue without them
        }

        const meta: PostImage = {
            index: i,
            mimeType: upload.file.type,
            fileName: upload.file.name,
            size: upload.file.size,
            width,
            height,
            alt: upload.alt,
        };

        imageMetas.push(meta);

        const headerJson = JSON.stringify(meta);
        const headerBytes = new TextEncoder().encode(headerJson);

        imageBuffers.push({ header: headerBytes, data });
    }

    // Calculate total size:
    // 4 bytes (image count) + for each: 4 (header len) + header + 4 (data len) + data
    let totalSize = 4;
    for (const buf of imageBuffers) {
        totalSize += 4 + buf.header.length + 4 + buf.data.length;
    }

    const result = new Uint8Array(totalSize);
    const view = new DataView(result.buffer);
    let offset = 0;

    // Write image count
    view.setUint32(offset, imageBuffers.length, true); // little-endian
    offset += 4;

    // Write each image
    for (const buf of imageBuffers) {
        // Header length
        view.setUint32(offset, buf.header.length, true);
        offset += 4;

        // Header JSON
        result.set(buf.header, offset);
        offset += buf.header.length;

        // Data length
        view.setUint32(offset, buf.data.length, true);
        offset += 4;

        // Image data
        result.set(buf.data, offset);
        offset += buf.data.length;
    }

    return { imageMetas, dataBlob: result };
}

// ============================================================
// Unpack images from binary blob
// ============================================================

/**
 * Extract images from a packed binary data blob.
 * Creates Object URLs for each image — caller must revoke them when done.
 *
 * @returns Array of DecryptedImage with displayable Object URLs
 */
export function unpackImages(dataBlob: Uint8Array): DecryptedImage[] {
    if (dataBlob.length === 0) {
        return [];
    }

    const view = new DataView(dataBlob.buffer, dataBlob.byteOffset, dataBlob.byteLength);
    let offset = 0;

    // Read image count
    const imageCount = view.getUint32(offset, true);
    offset += 4;

    const images: DecryptedImage[] = [];

    for (let i = 0; i < imageCount; i++) {
        // Read header length
        const headerLen = view.getUint32(offset, true);
        offset += 4;

        // Read header JSON
        const headerBytes = dataBlob.slice(offset, offset + headerLen);
        const headerJson = new TextDecoder().decode(headerBytes);
        const meta: PostImage = JSON.parse(headerJson);
        offset += headerLen;

        // Read data length
        const dataLen = view.getUint32(offset, true);
        offset += 4;

        // Read image data
        const imageData = dataBlob.slice(offset, offset + dataLen);
        offset += dataLen;

        // Create Object URL for display
        const blob = new Blob([imageData], { type: meta.mimeType });
        const url = URL.createObjectURL(blob);

        images.push({ url, meta });
    }

    return images;
}

/**
 * Revoke all Object URLs from a list of DecryptedImages.
 * Call this on component unmount to prevent memory leaks.
 */
export function revokeImageUrls(images: DecryptedImage[]): void {
    for (const img of images) {
        URL.revokeObjectURL(img.url);
    }
}

// ============================================================
// Metadata serialization
// ============================================================

/**
 * Build the PostMetadata JSON to be encrypted and stored on Walrus.
 */
export function buildPostMetadata(
    text: string,
    imageMetas: PostImage[]
): PostMetadata {
    return {
        version: 1,
        text,
        images: imageMetas,
    };
}

/**
 * Serialize PostMetadata to bytes (ready for SEAL encryption).
 */
export function serializeMetadata(metadata: PostMetadata): Uint8Array {
    const json = JSON.stringify(metadata);
    return new TextEncoder().encode(json);
}

/**
 * Deserialize PostMetadata from decrypted bytes.
 */
export function deserializeMetadata(data: Uint8Array): PostMetadata {
    const json = new TextDecoder().decode(data);
    const parsed = JSON.parse(json);

    // Validate version
    if (parsed.version !== 1) {
        throw new Error(`Unsupported PostMetadata version: ${parsed.version}`);
    }

    return parsed as PostMetadata;
}

// ============================================================
// On-chain post parsing
// ============================================================

/**
 * Parse raw on-chain post fields from a Service object into OnChainPost.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseOnChainPost(raw: any): OnChainPost {
    const fields = raw.fields || raw;
    return {
        postId: Number(fields.post_id ?? fields.postId ?? 0),
        title: String(fields.title || ''),
        metadataBlobId: String(fields.metadata_blob_id || fields.metadataBlobId || ''),
        dataBlobId: String(fields.data_blob_id || fields.dataBlobId || ''),
        requiredTier: Number(fields.required_tier ?? fields.requiredTier ?? 0),
        createdAtMs: Number(fields.created_at_ms ?? fields.createdAtMs ?? 0),
    };
}

/**
 * Parse all posts from a Service object's fields.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseOnChainPosts(serviceFields: any): OnChainPost[] {
    const rawPosts = serviceFields.posts || [];
    return rawPosts.map(parseOnChainPost);
}

/**
 * Get the next_post_id from Service fields (needed before encryption).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNextPostId(serviceFields: any): number {
    return Number(serviceFields.next_post_id ?? serviceFields.nextPostId ?? 0);
}
