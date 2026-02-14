'use client';

import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/lib/contract-constants';
import { findActiveServiceId } from '@/lib/service-lookup';

export interface LatestPostItem {
    creatorAddress: string;
    creatorName: string;
    serviceObjectId: string;
    postId: number;
    title: string;
    createdAtMs: number;
    metadataBlobId: string;
}

type PostPublishedEvent = { creator?: string; post_id?: string };
type SuiEvent = { id: { txDigest: string }; parsedJson: unknown; timestampMs?: number };

const DEFAULT_LIMIT = 12;

/**
 * Fetches the N most recently published posts across all creators.
 * Queries PostPublished events, sorts by timestamp, then loads each Service
 * to get post title, creator name, and metadata blob id.
 */
export function useLatestPosts(limit: number = DEFAULT_LIMIT) {
    const [posts, setPosts] = useState<LatestPostItem[]>([]);
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
                    if (!cancelled) setPosts([]);
                    return;
                }

                const sorted = [...events].sort((a, b) => {
                    const tsA = (a as SuiEvent).timestampMs ?? 0;
                    const tsB = (b as SuiEvent).timestampMs ?? 0;
                    return tsB - tsA;
                });

                const seen = new Set<string>();
                const results: LatestPostItem[] = [];

                for (const ev of sorted) {
                    if (results.length >= limit) break;

                    const parsed = (ev as SuiEvent).parsedJson as PostPublishedEvent;
                    const creatorAddress = parsed?.creator;
                    const postId = parsed?.post_id != null ? Number(parsed.post_id) : NaN;

                    if (!creatorAddress || Number.isNaN(postId)) continue;

                    const key = `${creatorAddress}:${postId}`;
                    if (seen.has(key)) continue;
                    seen.add(key);

                    const serviceObjectId = await findActiveServiceId(suiClient, creatorAddress);
                    if (cancelled || !serviceObjectId) continue;

                    const serviceObject = await suiClient.getObject({
                        id: serviceObjectId,
                        options: { showContent: true },
                    });

                    if (cancelled) return;

                    if (serviceObject.data?.content?.dataType !== 'moveObject') continue;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fields = (serviceObject.data.content as any).fields;
                    const postsList = fields.posts ?? [];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const postEntry = postsList.find((p: any) => Number(p.post_id ?? p.fields?.post_id) === postId);
                    if (!postEntry) continue;

                    const p = postEntry.fields ?? postEntry;
                    const title = typeof p.title === 'string' ? p.title : '';
                    const createdAtMs = Number(p.created_at_ms ?? 0);
                    const metadataBlobId = typeof p.metadata_blob_id === 'string' ? p.metadata_blob_id : '';
                    const creatorName = typeof fields.name === 'string' ? fields.name : 'Creator';

                    results.push({
                        creatorAddress,
                        creatorName,
                        serviceObjectId,
                        postId,
                        title,
                        createdAtMs,
                        metadataBlobId,
                    });
                }

                if (!cancelled) setPosts(results);
            } catch (err) {
                if (!cancelled) {
                    console.error('[useLatestPosts] fetch error:', err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch latest posts');
                    setPosts([]);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchLatest();
        return () => { cancelled = true; };
    }, [suiClient, limit]);

    return { posts, isLoading, error };
}
