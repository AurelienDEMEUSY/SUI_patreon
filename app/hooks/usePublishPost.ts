'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useExecuteTransaction } from '@/hooks/useExecuteTransaction';
import { encryptContent } from '@/lib/seal';
import { uploadEncryptedContent, uploadToWalrus } from '@/lib/walrus';
import { buildPublishPost } from '@/lib/contract';
import {
    validatePostData,
    packImages,
    buildPostMetadata,
    serializeMetadata,
    getNextPostId,
} from '@/lib/post-service';
import type { PostImageUpload, PublishProgress, PublishStep } from '@/types/post.types';

// ============================================================
// usePublishPost — full pipeline: validate → encrypt → upload → TX
// ============================================================

interface UsePublishPostResult {
    /**
     * Publish a new post.
     * @param title - Post title (stored on-chain in clear)
     * @param text - Post text content (encrypted in metadata blob)
     * @param images - Images to include (encrypted in data blob)
     * @param requiredTier - Minimum tier to access (0 = public)
     * @returns The post ID on success, or null on failure
     */
    publishPost: (
        title: string,
        text: string,
        images: PostImageUpload[],
        requiredTier: number
    ) => Promise<number | null>;
    /** Current progress state */
    progress: PublishProgress;
    /** Whether the pipeline is running */
    isPublishing: boolean;
    /** Error message if any step failed */
    error: string | null;
    /** Reset state after publish */
    reset: () => void;
}

const INITIAL_PROGRESS: PublishProgress = {
    step: 'idle',
    percent: 0,
    message: '',
};

function makeProgress(step: PublishStep, percent: number, message: string): PublishProgress {
    return { step, percent, message };
}

/**
 * Hook to publish a new post with the full Walrus + SEAL pipeline.
 *
 * Pipeline:
 * 1. Validate inputs
 * 2. Read & pack images into binary blob
 * 3. Read next_post_id from chain (needed for SEAL ID)
 * 4. Encrypt metadata JSON with SEAL
 * 5. Encrypt image data blob with SEAL
 * 6. Upload both encrypted blobs to Walrus
 * 7. Execute publish_post transaction (Enoki sponsored or standard wallet)
 */
export function usePublishPost(serviceObjectId: string | null): UsePublishPostResult {
    const [progress, setProgress] = useState<PublishProgress>(INITIAL_PROGRESS);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { executeTransaction } = useExecuteTransaction();

    const reset = useCallback(() => {
        setProgress(INITIAL_PROGRESS);
        setIsPublishing(false);
        setError(null);
    }, []);

    const publishPost = useCallback(async (
        title: string,
        text: string,
        images: PostImageUpload[],
        requiredTier: number
    ): Promise<number | null> => {
        if (!currentAccount) {
            setError('No wallet connected');
            return null;
        }
        if (!serviceObjectId) {
            setError('No creator profile found. Create a profile first.');
            return null;
        }

        setIsPublishing(true);
        setError(null);

        try {
            // ── Step 1: Validate ──
            setProgress(makeProgress('validating', 5, 'Validating post...'));

            const validation = validatePostData(title, text, images);
            if (!validation.valid) {
                throw new Error(validation.errors.join('. '));
            }

            // ── Step 2: Pack images ──
            setProgress(makeProgress('reading-images', 15, 'Processing images...'));

            const { imageMetas, dataBlob } = await packImages(images);

            // ── Step 3: Get next post ID from chain ──
            const serviceObject = await suiClient.getObject({
                id: serviceObjectId,
                options: { showContent: true },
            });

            if (serviceObject.data?.content?.dataType !== 'moveObject') {
                throw new Error('Service object not found on chain');
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fields = (serviceObject.data.content as any).fields;
            const postId = getNextPostId(fields);

            // ── Step 4: Build & encrypt metadata ──
            setProgress(makeProgress('encrypting-metadata', 30, 'Encrypting content...'));

            const metadata = buildPostMetadata(text, imageMetas);
            const metadataBytes = serializeMetadata(metadata);

            let metadataBlobId: string;
            let dataBlobId: string;

            if (requiredTier === 0) {
                // Public post — no encryption, upload directly
                setProgress(makeProgress('uploading-metadata', 50, 'Uploading content...'));

                const metaResult = await uploadToWalrus(metadataBytes);
                metadataBlobId = metaResult.blobId;

                if (dataBlob.length > 0) {
                    setProgress(makeProgress('uploading-data', 65, 'Uploading images...'));
                    const dataResult = await uploadToWalrus(dataBlob);
                    dataBlobId = dataResult.blobId;
                } else {
                    dataBlobId = '';
                }
            } else {
                // Encrypted post — encrypt with SEAL then upload
                const { encryptedBytes: encryptedMeta } = await encryptContent(
                    suiClient,
                    metadataBytes,
                    serviceObjectId,
                    postId
                );

                setProgress(makeProgress('uploading-metadata', 45, 'Uploading encrypted content...'));
                metadataBlobId = await uploadEncryptedContent(encryptedMeta);

                // ── Step 5: Encrypt & upload data blob ──
                if (dataBlob.length > 0) {
                    setProgress(makeProgress('encrypting-data', 55, 'Encrypting images...'));

                    const { encryptedBytes: encryptedData } = await encryptContent(
                        suiClient,
                        dataBlob,
                        serviceObjectId,
                        postId
                    );

                    setProgress(makeProgress('uploading-data', 70, 'Uploading encrypted images...'));
                    dataBlobId = await uploadEncryptedContent(encryptedData);
                } else {
                    dataBlobId = '';
                }
            }

            // ── Step 6: Execute on-chain transaction ──
            setProgress(makeProgress('publishing-tx', 85, 'Publishing on-chain...'));

            const tx = buildPublishPost(
                serviceObjectId,
                title,
                metadataBlobId,
                dataBlobId,
                requiredTier
            );

            await executeTransaction(tx);

            // ── Done ──
            setProgress(makeProgress('done', 100, 'Post published!'));
            return postId;
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Publishing failed';
            console.error('[usePublishPost] error:', err);
            setError(errMsg);
            setProgress(makeProgress('error', 0, errMsg));
            return null;
        } finally {
            setIsPublishing(false);
        }
    }, [currentAccount, serviceObjectId, suiClient, executeTransaction]);

    return { publishPost, progress, isPublishing, error, reset };
}
