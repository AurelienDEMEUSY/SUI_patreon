'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { INDEXER_API_URL } from '@/lib/contract-constants';
import { getCreatorPosts } from '@/lib/indexer-api';
import { queryServiceObject } from '@/lib/graphql/queries/posts';
import { parseServicePosts, getNextPostIdFromJson } from '@/lib/graphql/parsers';
import type { ServiceJson } from '@/lib/graphql/parsers';
import type { OnChainPost } from '@/types/post.types';

// ============================================================
// useCreatorPosts — fetch posts via GraphQL + React Query
// ============================================================

interface PostsResult {
    posts: OnChainPost[];
    nextPostId: number;
}

interface UseCreatorPostsResult {
    /** Parsed on-chain posts (sorted by createdAtMs desc) */
    posts: OnChainPost[];
    /** Next post ID (needed before encryption for sealId) */
    nextPostId: number;
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Refetch posts from chain (invalidates cache) */
    refetch: () => void;
}

/**
 * Fetches all posts for a creator from their on-chain Service object via GraphQL.
 * Uses React Query for caching. Also exposes `nextPostId` for SEAL encryption.
 *
 * MIGRATED: JSON-RPC → GraphQL → React Query (cached).
 */
export function useCreatorPosts(serviceObjectId: string | null): UseCreatorPostsResult {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['creatorPosts', serviceObjectId],
        queryFn: async (): Promise<PostsResult> => {
            if (!serviceObjectId) return { posts: [], nextPostId: 0 };

            if (INDEXER_API_URL) {
                console.log('[useCreatorPosts] Using indexer API');
                const posts = await getCreatorPosts(serviceObjectId);
                const nextPostId =
                    posts.length > 0 ? Math.max(...posts.map((p) => p.postId)) + 1 : 0;
                return {
                    posts: posts.sort((a, b) => b.createdAtMs - a.createdAtMs),
                    nextPostId,
                };
            }

            console.log('[useCreatorPosts] Using GraphQL');
            const result = await queryServiceObject(serviceObjectId);
            const json = result.data?.object?.asMoveObject?.contents?.json as ServiceJson | undefined;

            if (json) {
                const parsedPosts = parseServicePosts(serviceObjectId, json);
                parsedPosts.sort((a, b) => b.createdAtMs - a.createdAtMs);
                return {
                    posts: parsedPosts,
                    nextPostId: getNextPostIdFromJson(json),
                };
            }

            return { posts: [], nextPostId: 0 };
        },
        enabled: !!serviceObjectId,
        staleTime: 15_000, // Posts change more often than creator list
        gcTime: 5 * 60_000,
    });

    const refetch = useCallback((): void => {
        queryClient.invalidateQueries({ queryKey: ['creatorPosts', serviceObjectId] });
    }, [queryClient, serviceObjectId]);

    return {
        posts: data?.posts ?? [],
        nextPostId: data?.nextPostId ?? 0,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch posts') : null,
        refetch,
    };
}
