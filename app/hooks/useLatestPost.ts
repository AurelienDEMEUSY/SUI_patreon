'use client';

import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/lib/contract-constants';
import { findActiveServiceId } from '@/lib/service-lookup';

export interface LatestPost {
    creatorAddress: string;
    creatorName: string;
    serviceObjectId: string;
    postId: number;
    title: string;
    createdAtMs: number;
}

type PostPublishedEvent = { creator?: string; post_id?: string };
type SuiEvent = { id: { txDigest: string }; parsedJson: unknown; timestampMs?: number };

/**
 * Fetches the most recently published post across all creators.
 * Queries PostPublished events, sorts by timestamp, then loads the Service
 * to get the post title and creator name.
 */
export function useLatestPost() {
    const [post, setPost] = useState<LatestPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const suiClient = useSuiClient();

    useEffect(() => {
        let cancelled = false;

        const fetchLatest = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { data: events } = await suiClient.queryEvents({
                    query: { MoveEventType: `${PACKAGE_ID}::service::PostPublished` },
                    limit: 50,
                });

                if (cancelled || !events.length) {
                    if (!cancelled) setPost(null);
                    return;
                }

                // Sort by timestamp descending (most recent first)
                const sorted = [...events].sort((a, b) => {
                    const tsA = (a as SuiEvent).timestampMs ?? 0;
                    const tsB = (b as SuiEvent).timestampMs ?? 0;
                    return tsB - tsA;
                });

                const latest = sorted[0] as SuiEvent;
                const parsed = latest.parsedJson as PostPublishedEvent;
                const creatorAddress = parsed?.creator;
                const postId = parsed?.post_id != null ? Number(parsed.post_id) : NaN;

                if (!creatorAddress || Number.isNaN(postId)) {
                    setPost(null);
                    return;
                }

                const serviceObjectId = await findActiveServiceId(suiClient, creatorAddress);
                if (cancelled || !serviceObjectId) {
                    if (!cancelled) setPost(null);
                    return;
                }

                const serviceObject = await suiClient.getObject({
                    id: serviceObjectId,
                    options: { showContent: true },
                });

                if (cancelled) return;

                if (serviceObject.data?.content?.dataType !== 'moveObject') {
                    setPost(null);
                    return;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fields = (serviceObject.data.content as any).fields;
                const posts = fields.posts ?? [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const postEntry = posts.find((p: any) => Number(p.post_id ?? p.fields?.post_id) === postId);
                if (!postEntry) {
                    setPost(null);
                    return;
                }

                const p = postEntry.fields ?? postEntry;
                const title = typeof p.title === 'string' ? p.title : '';
                const createdAtMs = Number(p.created_at_ms ?? 0);
                const creatorName = typeof fields.name === 'string' ? fields.name : 'Creator';

                if (!cancelled) {
                    setPost({
                        creatorAddress,
                        creatorName,
                        serviceObjectId,
                        postId,
                        title,
                        createdAtMs,
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('[useLatestPost] fetch error:', err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch latest post');
                    setPost(null);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchLatest();
        return () => { cancelled = true; };
    }, [suiClient]);

    return { post, isLoading, error };
}
