'use client';

import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/lib/contract-constants';
import type { Creator } from '@/types';

interface OnChainCreatorSummary {
    address: string;
    serviceObjectId: string;
    name: string;
    description: string;
    tiers: Creator['tiers'];
    totalContent: number;
    totalSubscribers: number;
}

/**
 * Fetches ALL creators registered on the platform from on-chain events
 * and returns their parsed Service objects.
 */
export function useAllCreators() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const suiClient = useSuiClient();

    useEffect(() => {
        let cancelled = false;

        const fetchAllCreators = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Step 1: Query all CreatorRegistered events
                const events = await suiClient.queryEvents({
                    query: {
                        MoveEventType: `${PACKAGE_ID}::service::CreatorRegistered`,
                    },
                    limit: 50,
                });

                if (cancelled) return;

                // Step 1b: Query CreatorDeleted events to exclude deleted creators
                const deletedEvents = await suiClient.queryEvents({
                    query: {
                        MoveEventType: `${PACKAGE_ID}::service::CreatorDeleted`,
                    },
                    limit: 50,
                });

                if (cancelled) return;

                // Build a set of deleted creator addresses with their deletion count
                const deletionCounts = new Map<string, number>();
                for (const event of deletedEvents.data) {
                    const addr = (event.parsedJson as { creator?: string })?.creator;
                    if (addr) {
                        deletionCounts.set(addr, (deletionCounts.get(addr) || 0) + 1);
                    }
                }

                // Count registrations per address
                const registrationCounts = new Map<string, number>();
                for (const event of events.data) {
                    const addr = (event.parsedJson as { creator?: string })?.creator;
                    if (addr) {
                        registrationCounts.set(addr, (registrationCounts.get(addr) || 0) + 1);
                    }
                }

                // Step 2: For each event, find the Service object ID from the tx
                // Skip creators whose deletions >= registrations (profile was deleted)
                const creatorEntries: { address: string; serviceObjectId: string }[] = [];

                for (const event of events.data) {
                    const parsedJson = event.parsedJson as { creator?: string; name?: string };
                    if (!parsedJson?.creator) continue;

                    // Skip creators that have been deleted
                    const addr = parsedJson.creator;
                    const regCount = registrationCounts.get(addr) || 0;
                    const delCount = deletionCounts.get(addr) || 0;
                    if (delCount >= regCount) continue;

                    const txDigest = event.id.txDigest;
                    const txDetails = await suiClient.getTransactionBlock({
                        digest: txDigest,
                        options: { showObjectChanges: true },
                    });

                    const serviceObj = txDetails.objectChanges?.find(
                        (change) =>
                            change.type === 'created' &&
                            change.objectType?.includes('::service::Service')
                    );

                    if (serviceObj && 'objectId' in serviceObj) {
                        creatorEntries.push({
                            address: parsedJson.creator,
                            serviceObjectId: serviceObj.objectId,
                        });
                    }
                }

                if (cancelled) return;

                // Step 3: Fetch all Service objects in parallel
                const serviceObjects = await suiClient.multiGetObjects({
                    ids: creatorEntries.map((e) => e.serviceObjectId),
                    options: { showContent: true },
                });

                if (cancelled) return;

                // Step 4: Parse each Service into Creator type
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
                        }
                    );

                    parsedCreators.push({
                        address: entry.address,
                        name: fields.name || 'Creator',
                        bio: fields.description || '',
                        avatarBlobId: null,
                        bannerBlobId: null,
                        suinsName: null,
                        totalSubscribers: 0,
                        totalContent: (fields.posts || []).length,
                        tiers,
                        createdAt: Math.floor(Date.now() / 1000),
                        serviceObjectId: entry.serviceObjectId,
                    });
                }

                if (!cancelled) {
                    setCreators(parsedCreators);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Error fetching creators:', err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch creators');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchAllCreators();

        return () => {
            cancelled = true;
        };
    }, [suiClient]);

    return { creators, isLoading, error };
}
