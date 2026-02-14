'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { useSessionKey, useDecrypt } from '@/hooks/useSeal';
import { downloadFromWalrus } from '@/lib/walrus';
import {
    deserializeMetadata,
    unpackImages,
    revokeImageUrls,
} from '@/lib/post-service';
import type { OnChainPost, PostMetadata, DecryptedImage } from '@/types/post.types';

// ============================================================
// usePostContent — download, decrypt and parse a single post
// ============================================================

interface UsePostContentResult {
    /** Decrypted metadata (text + image refs) — null until unlocked */
    metadata: PostMetadata | null;
    /** Decrypted images as Object URLs — empty until unlocked */
    images: DecryptedImage[];
    /** Whether the post content is loading */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Whether the post is unlocked (decrypted) */
    isUnlocked: boolean;
    /** Trigger decryption (for encrypted posts) */
    unlock: () => Promise<void>;
}

/**
 * Hook to fetch, decrypt, and display a single post's content.
 *
 * For public posts (requiredTier === 0):
 *   - Downloads directly from Walrus (no SEAL decryption)
 *   - Auto-loads on mount
 *
 * For encrypted posts (requiredTier > 0):
 *   - Waits for `unlock()` to be called
 *   - Creates a session key, then decrypts via SEAL
 *   - Revokes Object URLs on unmount
 */
export function usePostContent(
    serviceObjectId: string | null,
    post: OnChainPost | null,
    isOwnProfile: boolean = false
): UsePostContentResult {
    const [metadata, setMetadata] = useState<PostMetadata | null>(null);
    const [images, setImages] = useState<DecryptedImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);

    const imagesRef = useRef<DecryptedImage[]>([]);
    const suiClient = useSuiClient();
    const { sessionKey, createAndSign } = useSessionKey();
    const { decrypt } = useDecrypt(sessionKey, createAndSign);

    // Cleanup Object URLs on unmount or when images change
    useEffect(() => {
        return () => {
            revokeImageUrls(imagesRef.current);
        };
    }, []);

    // Auto-load public posts
    useEffect(() => {
        if (!post || !serviceObjectId) return;
        if (post.requiredTier === 0 && !isUnlocked && !isLoading) {
            loadPublicContent();
        }
        // Only re-run when the specific post or service changes (not on every render)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post?.postId, serviceObjectId]);

    // Auto-unlock encrypted posts for the creator (they have max tier access on-chain)
    useEffect(() => {
        if (!post || !serviceObjectId) return;
        if (isOwnProfile && post.requiredTier > 0 && !isUnlocked && !isLoading && !error) {
            unlock();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post?.postId, serviceObjectId, isOwnProfile]);

    /**
     * Load public (unencrypted) post content directly from Walrus.
     */
    const loadPublicContent = useCallback(async () => {
        if (!post || !serviceObjectId) return;

        setIsLoading(true);
        setError(null);

        try {
            // Download metadata blob
            const metaBytes = await downloadFromWalrus(post.metadataBlobId);
            const parsedMetadata = deserializeMetadata(metaBytes);
            setMetadata(parsedMetadata);

            // Download and unpack images
            if (post.dataBlobId && post.dataBlobId !== '') {
                const dataBytes = await downloadFromWalrus(post.dataBlobId);
                const decoded = unpackImages(dataBytes);

                // Revoke previous URLs
                revokeImageUrls(imagesRef.current);
                imagesRef.current = decoded;
                setImages(decoded);
            } else {
                setImages([]);
            }

            setIsUnlocked(true);
        } catch (err) {
            console.error('[usePostContent] public load error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load post');
        } finally {
            setIsLoading(false);
        }
    }, [post, serviceObjectId]);

    /**
     * Decrypt and load encrypted post content via SEAL.
     */
    const unlock = useCallback(async () => {
        if (!post || !serviceObjectId) {
            setError('No post or service to decrypt');
            return;
        }

        if (isUnlocked) return; // Already unlocked

        setIsLoading(true);
        setError(null);

        try {
            // Decrypt metadata via SEAL
            const decryptedMeta = await decrypt(
                post.metadataBlobId,
                serviceObjectId,
                post.postId
            );
            const parsedMetadata = deserializeMetadata(decryptedMeta);
            setMetadata(parsedMetadata);

            // Decrypt image data via SEAL
            if (post.dataBlobId && post.dataBlobId !== '') {
                const decryptedData = await decrypt(
                    post.dataBlobId,
                    serviceObjectId,
                    post.postId
                );
                const decoded = unpackImages(decryptedData);

                // Revoke previous URLs
                revokeImageUrls(imagesRef.current);
                imagesRef.current = decoded;
                setImages(decoded);
            } else {
                setImages([]);
            }

            setIsUnlocked(true);
        } catch (err) {
            console.error('[usePostContent] decrypt error:', err);
            const errMsg = err instanceof Error ? err.message : 'Decryption failed';

            if (errMsg.includes('ENoAccess') || errMsg.includes('access')) {
                setError('You need an active subscription to view this content');
            } else {
                setError(errMsg);
            }
        } finally {
            setIsLoading(false);
        }
    }, [post, serviceObjectId, isUnlocked, decrypt]);

    return { metadata, images, isLoading, error, isUnlocked, unlock };
}
