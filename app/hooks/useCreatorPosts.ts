'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import type { OnChainPost } from '@/types/post.types';
import { parseOnChainPosts, getNextPostId } from '@/lib/post-service';

// ============================================================
// useCreatorPosts — fetch posts from on-chain Service object
// ============================================================

interface UseCreatorPostsResult {
    /** Parsed on-chain posts (sorted by createdAtMs desc) */
    posts: OnChainPost[];
    /** Next post ID (needed before encryption for sealId) */
    nextPostId: number;
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Refetch posts from chain */
    refetch: () => void;
}

/**
 * Fetches all posts for a creator from their on-chain Service object.
 * Also exposes `nextPostId` which is required before SEAL encryption.
 */
export function useCreatorPosts(serviceObjectId: string | null): UseCreatorPostsResult {
    const [posts, setPosts] = useState<OnChainPost[]>([]);
    const [nextPostId, setNextPostId] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refetchCount, setRefetchCount] = useState(0);
    const suiClient = useSuiClient();

    const refetch = useCallback((): void => {
        setRefetchCount((c) => c + 1);
    }, []);

    useEffect(() => {
        if (!serviceObjectId) {
            setPosts([]);
            setNextPostId(0);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        const fetchPosts = async () => {
            try {
                const serviceObject = await suiClient.getObject({
                    id: serviceObjectId,
                    options: { showContent: true },
                });

                if (cancelled) return;

                if (serviceObject.data?.content?.dataType === 'moveObject') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fields = (serviceObject.data.content as any).fields;

                    const parsedPosts = parseOnChainPosts(fields);
                    // Sort by creation date, newest first
                    parsedPosts.sort((a, b) => b.createdAtMs - a.createdAtMs);
                    setPosts(parsedPosts);

                    setNextPostId(getNextPostId(fields));
                } else {
                    setPosts([]);
                    setNextPostId(0);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('[useCreatorPosts] fetch error:', err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch posts');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchPosts();

        return () => {
            cancelled = true;
        };
    }, [serviceObjectId, suiClient, refetchCount]);

    return { posts, nextPostId, isLoading, error, refetch };
}
