'use client';

import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/lib/contract-constants';
import { getDeletedCreatorCounts, isCreatorDeleted } from '@/lib/service-lookup';
import { getSubscriberCount } from '@/lib/subscriber-count';
import { queryKeys } from '@/constants/query-keys';
import type { Creator } from '@/types';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

async function fetchAllCreators(suiClient: SuiJsonRpcClient): Promise<Creator[]> {
    // Fetch registration events and deletion counts in parallel
    const [registeredEvents, { deletionCounts, registrationCounts }] = await Promise.all([
        suiClient.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::service::CreatorRegistered` },
            limit: 50,
        }),
        getDeletedCreatorCounts(suiClient),
    ]);

    // Resolve Service object IDs, skipping deleted creators
    const creatorEntries: { address: string; serviceObjectId: string }[] = [];

    for (const event of registeredEvents.data) {
        const parsedJson = event.parsedJson as { creator?: string };
        const addr = parsedJson?.creator;
        if (!addr) continue;

        if (isCreatorDeleted(addr, registrationCounts, deletionCounts)) continue;

        const txDetails = await suiClient.getTransactionBlock({
            digest: event.id.txDigest,
            options: { showObjectChanges: true },
        });

        const created = txDetails.objectChanges?.find(
            (c) => c.type === 'created' && c.objectType?.includes('::service::Service'),
        );

        if (created && 'objectId' in created) {
            creatorEntries.push({ address: addr, serviceObjectId: created.objectId });
        }
    }

    // Batch-fetch all Service objects
    const serviceObjects = await suiClient.multiGetObjects({
        ids: creatorEntries.map((e) => e.serviceObjectId),
        options: { showContent: true },
    });

    // Parse each Service into Creator type (skip destroyed objects)
    const parsedCreators: Creator[] = [];

    for (let i = 0; i < serviceObjects.length; i++) {
        const obj = serviceObjects[i];
        const entry = creatorEntries[i];

        if (obj.data?.content?.dataType !== 'moveObject') continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields = (obj.data.content as any).fields;

        const tiers = (fields.tiers || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (t: any) => {
                const tf = t.fields || t;
                return {
                    id: `${entry.serviceObjectId}_tier_${tf.tier_level}`,
                    creatorAddress: entry.address,
                    name: tf.name || '',
                    description: '',
                    priceInMist: Number(tf.price || 0),
                    sealPolicyId: entry.serviceObjectId,
                    benefits: [],
                    subscriberCount: 0,
                    order: Number(tf.tier_level || 1),
                    tierLevel: Number(tf.tier_level || 1),
                    durationMs: Number(tf.duration_ms || 0),
                };
            },
        );

        let totalSubscribers = 0;
        try {
            totalSubscribers = await getSubscriberCount(suiClient, entry.serviceObjectId, fields);
        } catch {
            // keep 0 on error
        }

        parsedCreators.push({
            address: entry.address,
            name: fields.name || 'Creator',
            bio: fields.description || '',
            avatarBlobId: fields.avatar_blob_id ?? null,
            bannerBlobId: fields.banner_blob_id ?? null,
            suinsName: null,
            totalSubscribers,
            totalContent: (fields.posts || []).length,
            tiers,
            createdAt: Math.floor(Date.now() / 1000),
            serviceObjectId: entry.serviceObjectId,
        });
    }

    return parsedCreators;
}

/**
 * Fetches ALL active creators registered on the platform.
 *
 * Queries CreatorRegistered events, filters out deleted profiles
 * (via CreatorDeleted events), then batch-fetches the Service objects.
 */
export function useAllCreators() {
    const suiClient = useSuiClient();

    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.allCreators(),
        queryFn: () => fetchAllCreators(suiClient),
        staleTime: 60_000,
    });

    return {
        creators: data ?? [],
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch creators') : null,
    };
}
