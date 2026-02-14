'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { queryKeys } from '@/constants/query-keys';
import type { OnChainPost } from '@/types/post.types';
import { parseOnChainPosts, getNextPostId } from '@/lib/post-service';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

// ============================================================
// useCreatorPosts — fetch posts from on-chain Service object
// ============================================================

interface CreatorPostsData {
    posts: OnChainPost[];
    nextPostId: number;
}

async function fetchCreatorPosts(
    suiClient: SuiJsonRpcClient,
    serviceObjectId: string,
): Promise<CreatorPostsData> {
    const serviceObject = await suiClient.getObject({
        id: serviceObjectId,
        options: { showContent: true },
    });

    if (serviceObject.data?.content?.dataType === 'moveObject') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields = (serviceObject.data.content as any).fields;
        const parsedPosts = parseOnChainPosts(fields);
        parsedPosts.sort((a, b) => b.createdAtMs - a.createdAtMs);
        return { posts: parsedPosts, nextPostId: getNextPostId(fields) };
    }

    return { posts: [], nextPostId: 0 };
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
    /** Refetch posts from chain */
    refetch: () => void;
}

/**
 * Fetches all posts for a creator from their on-chain Service object.
 * Also exposes `nextPostId` which is required before SEAL encryption.
 */
export function useCreatorPosts(serviceObjectId: string | null): UseCreatorPostsResult {
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.creatorPosts(serviceObjectId ?? ''),
        queryFn: () => fetchCreatorPosts(suiClient, serviceObjectId!),
        enabled: !!serviceObjectId,
        staleTime: 15_000,
    });

    const refetch = () => {
        if (serviceObjectId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.creatorPosts(serviceObjectId) });
        }
    };

    return {
        posts: data?.posts ?? [],
        nextPostId: data?.nextPostId ?? 0,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch posts') : null,
        refetch,
    };
}
