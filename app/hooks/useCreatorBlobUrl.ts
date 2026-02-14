'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { downloadFromWalrus } from '@/lib/walrus';
import { useSessionKey, useDecrypt } from '@/hooks/useSeal';

/** Seal "post" ID used for creator profile blobs (avatar, banner). */
const PROFILE_POST_ID = 0;

function isHttpUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

/** JPEG, PNG, WebP magic bytes. */
function looksLikeImageBytes(bytes: Uint8Array): boolean {
    if (bytes.length < 4) return false;
    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
    // WebP: RIFF....WEBP
    if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
    return false;
}

function bytesToObjectUrl(bytes: Uint8Array, mimeType: string = 'image/jpeg'): string {
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
}

export interface UseCreatorBlobUrlResult {
    url: string | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Resolves a creator profile blob (avatar or banner) to a displayable URL.
 * - If blobId is null/empty → returns null (use fallback in UI).
 * - If blobId is already an http(s) URL → returns it as-is.
 * - Otherwise: downloads from Walrus. If raw image bytes → object URL.
 *   If encrypted → decrypts with Seal (serviceObjectId, PROFILE_POST_ID) then object URL.
 * Revokes object URLs on unmount.
 */
export function useCreatorBlobUrl(
    blobId: string | null | undefined,
    serviceObjectId: string | null | undefined
): UseCreatorBlobUrlResult {
    const [url, setUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const createdUrlRef = useRef<string | null>(null);
    const { sessionKey, createAndSign } = useSessionKey();
    const { decrypt } = useDecrypt(sessionKey, createAndSign);

    const loadBlob = useCallback(async () => {
        if (!blobId || blobId.trim() === '') {
            setUrl(null);
            return;
        }

        if (isHttpUrl(blobId)) {
            setUrl(blobId);
            return;
        }

        if (!serviceObjectId) {
            setUrl(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const rawBytes = await downloadFromWalrus(blobId);

            if (looksLikeImageBytes(rawBytes)) {
                const mime = rawBytes[0] === 0xff ? 'image/jpeg' : rawBytes[0] === 0x89 ? 'image/png' : 'image/webp';
                const objectUrl = bytesToObjectUrl(rawBytes, mime);
                if (createdUrlRef.current) URL.revokeObjectURL(createdUrlRef.current);
                createdUrlRef.current = objectUrl;
                setUrl(objectUrl);
                setIsLoading(false);
                return;
            }

            // Encrypted: decrypt with Seal (profile = postId 0)
            const decrypted = await decrypt(blobId, serviceObjectId, PROFILE_POST_ID);
            const objectUrl = bytesToObjectUrl(decrypted, 'image/jpeg');
            if (createdUrlRef.current) URL.revokeObjectURL(createdUrlRef.current);
            createdUrlRef.current = objectUrl;
            setUrl(objectUrl);
        } catch (err) {
            console.error('[useCreatorBlobUrl]', err);
            setError(err instanceof Error ? err.message : 'Failed to load image');
            setUrl(null);
        } finally {
            setIsLoading(false);
        }
    }, [blobId, serviceObjectId, decrypt]);

    useEffect(() => {
        if (!blobId || blobId.trim() === '') {
            setUrl(null);
            setError(null);
            setIsLoading(false);
            return;
        }
        if (isHttpUrl(blobId)) {
            setUrl(blobId);
            setError(null);
            setIsLoading(false);
            return;
        }
        if (!serviceObjectId) {
            setUrl(null);
            setError(null);
            setIsLoading(false);
            return;
        }
        loadBlob();
        return () => {
            if (createdUrlRef.current) {
                URL.revokeObjectURL(createdUrlRef.current);
                createdUrlRef.current = null;
            }
        };
    }, [blobId, serviceObjectId, loadBlob]);

    return { url, isLoading, error };
}
