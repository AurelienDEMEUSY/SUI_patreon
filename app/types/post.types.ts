// ============================================================
// Post Types — Data model for creator posts (text + images)
// ============================================================
//
// On-chain (Move contract), a Post stores:
//   - post_id, title, metadata_blob_id, data_blob_id, required_tier, created_at_ms
//
// Off-chain (Walrus blobs), the actual content is split into:
//   - metadata blob → encrypted JSON PostMetadata (text + image references)
//   - data blob     → encrypted binary pack of all images
//
// Both blobs are encrypted with SEAL using:
//   sealId = BCS(serviceObjectId) + BCS(postId)

// ============================================================
// Image types
// ============================================================

/** Metadata for a single image within a post. */
export interface PostImage {
    /** Index in the binary data blob (for extraction) */
    index: number;
    /** MIME type: 'image/jpeg', 'image/png', 'image/gif', 'image/webp' */
    mimeType: string;
    /** Original filename */
    fileName: string;
    /** File size in bytes */
    size: number;
    /** Image width in pixels (if available) */
    width?: number;
    /** Image height in pixels (if available) */
    height?: number;
    /** Alt text for accessibility */
    alt?: string;
}

/** Supported image MIME types */
export const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
] as const;

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];

// ============================================================
// Post metadata (stored as encrypted JSON in Walrus)
// ============================================================

/**
 * The metadata blob stored on Walrus (encrypted with SEAL).
 * Contains the text content + references to images in the data blob.
 */
export interface PostMetadata {
    /** Schema version for forward compatibility */
    version: 1;
    /** Full text content of the post (plain text or Markdown) */
    text: string;
    /** Ordered list of images in the data blob */
    images: PostImage[];
}

// ============================================================
// On-chain comment representation
// ============================================================

/** A comment as read from the on-chain Post struct. */
export interface OnChainComment {
    /** Address of the comment author */
    author: string;
    /** Comment text content */
    content: string;
    /** Creation timestamp in milliseconds */
    createdAtMs: number;
}

// ============================================================
// On-chain post representation
// ============================================================

/**
 * A post as read from the on-chain Service object.
 * Maps directly to the Move `Post` struct fields.
 */
export interface OnChainPost {
    /** Post ID (auto-incremented by the contract) */
    postId: number;
    /** Post title (stored in clear on-chain) */
    title: string;
    /** Walrus blob ID for the encrypted metadata JSON */
    metadataBlobId: string;
    /** Walrus blob ID for the encrypted image data */
    dataBlobId: string;
    /** Minimum tier level required to decrypt (0 = public) */
    requiredTier: number;
    /** Creation timestamp in milliseconds */
    createdAtMs: number;
    /** Number of likes (thumbs up) */
    likes: number;
    /** Number of dislikes (thumbs down) */
    dislikes: number;
    /** Map of user address -> reaction (1=like, 2=dislike) */
    reactions: Record<string, number>;
    /** Comments on this post */
    comments: OnChainComment[];
}

// ============================================================
// Decrypted post (ready for rendering)
// ============================================================

/** A single image ready for display (decrypted from Walrus blob) */
export interface DecryptedImage {
    /** Object URL created from the decrypted image data */
    url: string;
    /** Image metadata */
    meta: PostImage;
}

/** A fully decrypted post ready for rendering in the UI */
export interface DecryptedPost {
    /** On-chain data */
    onChain: OnChainPost;
    /** Decrypted metadata (text + image references) */
    metadata: PostMetadata;
    /** Decrypted images as displayable Object URLs */
    images: DecryptedImage[];
}

// ============================================================
// Form types (for CreatePostForm)
// ============================================================

/** Image selected by the creator in the form (pre-upload) */
export interface PostImageUpload {
    /** Browser File object */
    file: File;
    /** Local preview URL (from URL.createObjectURL) */
    previewUrl: string;
    /** Alt text entered by the creator */
    alt?: string;
}

/** Form state for creating a new post */
export interface CreatePostFormData {
    /** Post title */
    title: string;
    /** Post text content */
    text: string;
    /** Images to upload */
    images: PostImageUpload[];
    /** Required tier level (0 = public/free) */
    requiredTier: number;
}

// ============================================================
// Publish pipeline state
// ============================================================

export type PublishStep =
    | 'idle'
    | 'validating'
    | 'reading-images'
    | 'encrypting-metadata'
    | 'encrypting-data'
    | 'uploading-metadata'
    | 'uploading-data'
    | 'publishing-tx'
    | 'done'
    | 'error';

export interface PublishProgress {
    step: PublishStep;
    /** Progress percentage (0–100) */
    percent: number;
    /** Human-readable status message */
    message: string;
}

// ============================================================
// Constants
// ============================================================

/** Maximum number of images per post */
export const MAX_IMAGES_PER_POST = 5;

/** Maximum file size per image in bytes (10 MB) */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum total upload size in bytes (40 MB — Walrus testnet limit is ~50MB) */
export const MAX_TOTAL_UPLOAD_BYTES = 40 * 1024 * 1024;

/** Maximum title length */
export const MAX_TITLE_LENGTH = 200;

/** Maximum text content length (50 KB) */
export const MAX_TEXT_LENGTH = 50_000;
