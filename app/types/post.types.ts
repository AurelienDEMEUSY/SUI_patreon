export interface PostImage {
    index: number;
    mimeType: string;
    fileName: string;
    size: number;
    width?: number;
    height?: number;
    alt?: string;
}

export const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
] as const;

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];

export interface PostMetadata {
    version: 1;
    text: string;
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
    postId: number;
    title: string;
    metadataBlobId: string;
    dataBlobId: string;
    requiredTier: number;
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

export interface DecryptedImage {
    url: string;
    meta: PostImage;
}

export interface DecryptedPost {
    onChain: OnChainPost;
    metadata: PostMetadata;
    images: DecryptedImage[];
}

export interface PostImageUpload {
    file: File;
    previewUrl: string;
    alt?: string;
}

export interface CreatePostFormData {
    title: string;
    text: string;
    images: PostImageUpload[];
    requiredTier: number;
}

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
    percent: number;
    message: string;
}

export const MAX_IMAGES_PER_POST = 5;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export const MAX_TOTAL_UPLOAD_BYTES = 40 * 1024 * 1024;

export const MAX_TITLE_LENGTH = 200;

export const MAX_TEXT_LENGTH = 50_000;
