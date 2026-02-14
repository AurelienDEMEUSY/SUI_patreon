'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/lib/contract-constants';
import { queryKeys } from '@/constants/query-keys';
import type { Creator, Tier } from '@/types';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

export interface MySubscription {
    creator: Creator;
    tierLevel: number;
    expiresAtMs: number;
}

async function fetchMySubscriptions(
    suiClient: SuiJsonRpcClient,
    userAddress: string,
): Promise<MySubscription[]> {
    // 1. Query SubscriptionPurchased events to find creator addresses
    const [purchasedEvents, renewedEvents] = await Promise.all([
        suiClient.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::subscription::SubscriptionPurchased` },
            limit: 50,
        }),
        suiClient.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::subscription::SubscriptionRenewed` },
            limit: 50,
        }),
    ]);

    // 2. Collect unique creator addresses from events where subscriber = current user
    const creatorAddresses = new Set<string>();

    for (const event of [...purchasedEvents.data, ...renewedEvents.data]) {
        const parsed = event.parsedJson as {
            subscriber?: string;
            creator?: string;
        };
        if (parsed?.subscriber === userAddress && parsed?.creator) {
            creatorAddresses.add(parsed.creator);
        }
    }

    if (creatorAddresses.size === 0) return [];

    // 3. For each creator, find their Service object via CreatorRegistered events
    const registeredEvents = await suiClient.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::service::CreatorRegistered` },
        limit: 50,
    });

    // Map creator address → Service object ID
    const creatorServiceMap = new Map<string, string>();

    for (const event of registeredEvents.data) {
        const parsed = event.parsedJson as { creator?: string };
        if (!parsed?.creator || !creatorAddresses.has(parsed.creator)) continue;
        if (creatorServiceMap.has(parsed.creator)) continue;

        const txDetails = await suiClient.getTransactionBlock({
            digest: event.id.txDigest,
            options: { showObjectChanges: true },
        });

        const created = txDetails.objectChanges?.find(
            (c) => c.type === 'created' && c.objectType?.includes('::service::Service'),
        );

        if (created && 'objectId' in created) {
            creatorServiceMap.set(parsed.creator, created.objectId);
        }
    }

    // 4. Batch-fetch all Service objects
    const entries = Array.from(creatorServiceMap.entries());
    const serviceObjects = await suiClient.multiGetObjects({
        ids: entries.map(([, id]) => id),
        options: { showContent: true },
    });

    // 5. For each Service, check subscription status and parse Creator
    const results: MySubscription[] = [];

    for (let i = 0; i < serviceObjects.length; i++) {
        const obj = serviceObjects[i];
        const [creatorAddr, serviceId] = entries[i];

        if (obj.data?.content?.dataType !== 'moveObject') continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields = (obj.data.content as any).fields;

        const subscribersTableId = fields?.subscribers?.fields?.id?.id;
        if (!subscribersTableId) continue;

        try {
            const dynField = await suiClient.getDynamicFieldObject({
                parentId: subscribersTableId,
                name: { type: 'address', value: userAddress },
            });

            if (!dynField.data?.content || dynField.data.content.dataType !== 'moveObject') continue;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subFields = (dynField.data.content as any).fields?.value?.fields;
            const tier = Number(subFields?.tier ?? 0);
            const expiresAtMs = Number(subFields?.expires_at_ms ?? 0);
            const now = Date.now();

            if (expiresAtMs <= now) continue;

            const tiers: Tier[] = (fields.tiers || []).map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (t: any, index: number) => {
                    const tf = t.fields || t;
                    return {
                        id: `${serviceId}_tier_${tf.tier_level}`,
                        creatorAddress: creatorAddr,
                        name: tf.name || '',
                        description: '',
                        priceInMist: Number(tf.price || 0),
                        sealPolicyId: serviceId,
                        benefits: [],
                        subscriberCount: 0,
                        order: Number(tf.tier_level || index + 1),
                        tierLevel: Number(tf.tier_level || index + 1),
                        durationMs: Number(tf.duration_ms || 0),
                    };
                },
            );

            results.push({
                creator: {
                    address: creatorAddr,
                    name: fields.name || 'Creator',
                    bio: fields.description || '',
                    avatarBlobId: null,
                    bannerBlobId: null,
                    suinsName: null,
                    totalSubscribers: 0,
                    totalContent: (fields.posts || []).length,
                    tiers,
                    createdAt: Math.floor(Date.now() / 1000),
                    serviceObjectId: serviceId,
                },
                tierLevel: tier,
                expiresAtMs,
            });
        } catch {
            continue;
        }
    }

    return results;
}

/**
 * Fetches all creators the current user is subscribed to.
 */
export function useMySubscriptions() {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const userAddress = currentAccount?.address ?? '';

    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.mySubscriptions(userAddress),
        queryFn: () => fetchMySubscriptions(suiClient, userAddress),
        enabled: !!userAddress,
        staleTime: 30_000,
    });

    return {
        subscriptions: data ?? [],
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch subscriptions') : null,
    };
}
