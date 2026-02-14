'use client';

import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/lib/contract-constants';
import { findActiveServiceId } from '@/lib/service-lookup';
import { parseOnChainPost } from '@/lib/post-service';
import { queryKeys } from '@/constants/query-keys';
import type { OnChainPost } from '@/types/post.types';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

export interface LatestPost {
    creatorAddress: string;
    creatorName: string;
    serviceObjectId: string;
    postId: number;
    title: string;
    createdAtMs: number;
    /** Post complet on-chain (metadataBlobId, dataBlobId, requiredTier) pour usePostContent / décryptage */
    onChainPost: OnChainPost;
}

type PostPublishedEvent = { creator?: string; post_id?: string };
type SuiEvent = { id: { txDigest: string }; parsedJson: unknown; timestampMs?: number };

async function fetchLatestPost(suiClient: SuiJsonRpcClient): Promise<LatestPost | null> {
    const { data: events } = await suiClient.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::service::PostPublished` },
        limit: 50,
    });

    if (!events.length) return null;

    const sorted = [...events].sort((a, b) => {
        const tsA = (a as SuiEvent).timestampMs ?? 0;
        const tsB = (b as SuiEvent).timestampMs ?? 0;
        return tsB - tsA;
    });

    for (const ev of sorted) {
        const parsed = (ev as SuiEvent).parsedJson as PostPublishedEvent;
        const creatorAddress = parsed?.creator;
        const postId = parsed?.post_id != null ? Number(parsed.post_id) : NaN;

        if (!creatorAddress || Number.isNaN(postId)) continue;

        const serviceObjectId = await findActiveServiceId(suiClient, creatorAddress);
        if (!serviceObjectId) continue;

        const serviceObject = await suiClient.getObject({
            id: serviceObjectId,
            options: { showContent: true },
        });

        if (serviceObject.data?.content?.dataType !== 'moveObject') continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields = (serviceObject.data.content as any).fields;
        const posts = fields.posts ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postEntry = posts.find((p: any) => Number(p.post_id ?? p.fields?.post_id) === postId);
        if (!postEntry) continue;

        const onChainPost = parseOnChainPost(postEntry);
        if (onChainPost.requiredTier !== 0) continue; // skip restricted, keep only public

        const creatorName = typeof fields.name === 'string' ? fields.name : 'Creator';
        return {
            creatorAddress,
            creatorName,
            serviceObjectId,
            postId,
            title: onChainPost.title,
            createdAtMs: onChainPost.createdAtMs,
            onChainPost,
        };
    }

    return null;
}

/**
 * Fetches the most recently published **public** post (requiredTier === 0) across all creators.
 */
export function useLatestPost() {
    const suiClient = useSuiClient();

    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.latestPost(),
        queryFn: () => fetchLatestPost(suiClient),
        staleTime: 30_000,
    });

    return {
        post: data ?? null,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch latest post') : null,
    };
}
