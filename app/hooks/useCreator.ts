'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/lib/contract-constants';
import type { Creator, Tier } from '@/types';

/**
 * Parse on-chain Service object fields into our Creator type.
 */
function parseServiceToCreator(
    serviceObjectId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: any,
    creatorAddress: string
): Creator {
    const tiers: Tier[] = (fields.tiers || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any, index: number) => {
            const tierFields = t.fields || t;
            return {
                id: `${serviceObjectId}_tier_${tierFields.tier_level}`,
                creatorAddress,
                name: tierFields.name || '',
                description: '', // Contract doesn't store tier description
                priceInMist: Number(tierFields.price || 0),
                sealPolicyId: serviceObjectId, // Seal uses the Service ID
                benefits: [], // Contract doesn't store benefits list
                subscriberCount: 0, // Would need separate query
                order: Number(tierFields.tier_level || index + 1),
                tierLevel: Number(tierFields.tier_level || index + 1),
                durationMs: Number(tierFields.duration_ms || 0),
            } as Tier & { tierLevel: number; durationMs: number };
        }
    );

    return {
        address: creatorAddress,
        name: fields.name || 'Creator',
        bio: fields.description || '',
        avatarBlobId: null,
        bannerBlobId: null,
        suinsName: null,
        totalSubscribers: 0, // Would need to iterate subscribers table
        totalContent: (fields.posts || []).length,
        tiers,
        createdAt: Math.floor(Date.now() / 1000),
        serviceObjectId,
    };
}

/**
 * Hook to fetch creator data from on-chain.
 *
 * Strategy:
 * 1. If we have a serviceObjectId, fetch the Service object directly
 * 2. If we have a creator address, query CreatorRegistered events to find their Service
 * 3. Fallback to a default empty creator profile
 */
export function useCreator(addressOrServiceId: string | null) {
    const [creator, setCreator] = useState<Creator | null>(null);
    const [serviceObjectId, setServiceObjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const effectiveAddress = addressOrServiceId || currentAccount?.address || null;

    useEffect(() => {
        if (!effectiveAddress) return;

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        const fetchCreator = async () => {
            try {
                // Step 1: Query CreatorRegistered events to find Service object ID
                const registeredEvents = await suiClient.queryEvents({
                    query: {
                        MoveEventType: `${PACKAGE_ID}::service::CreatorRegistered`,
                    },
                    limit: 50,
                });

                // Also query CreatorDeleted events to detect deleted profiles
                const deletedEvents = await suiClient.queryEvents({
                    query: {
                        MoveEventType: `${PACKAGE_ID}::service::CreatorDeleted`,
                    },
                    limit: 50,
                });

                const myRegistrations = registeredEvents.data.filter(
                    (e) => (e.parsedJson as { creator?: string })?.creator === effectiveAddress
                );
                const myDeletions = deletedEvents.data.filter(
                    (e) => (e.parsedJson as { creator?: string })?.creator === effectiveAddress
                );

                // If deletions >= registrations, the profile has been deleted
                const wasDeleted = myRegistrations.length > 0 && myDeletions.length >= myRegistrations.length;

                let foundServiceId: string | null = null;

                if (!wasDeleted) {
                    for (const event of myRegistrations) {
                        // Find the Service object from the transaction
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
                            const objectId = serviceObj.objectId;

                            // Validate the object still exists on-chain
                            const objectResponse = await suiClient.getObject({
                                id: objectId,
                                options: { showContent: true },
                            });

                            if (objectResponse.data?.content) {
                                foundServiceId = objectId;
                                break;
                            }
                            // Object was destroyed, skip it
                        }
                    }
                }

                if (cancelled) return;

                if (foundServiceId) {
                    // Step 2: Fetch the Service object details
                    const serviceObject = await suiClient.getObject({
                        id: foundServiceId,
                        options: { showContent: true },
                    });

                    if (cancelled) return;

                    if (serviceObject.data?.content?.dataType === 'moveObject') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const fields = (serviceObject.data.content as any).fields;
                        const parsed = parseServiceToCreator(
                            foundServiceId,
                            fields,
                            effectiveAddress
                        );
                        setCreator(parsed);
                        setServiceObjectId(foundServiceId);
                    }
                } else {
                    // No on-chain Service found — show default profile
                    setCreator({
                        address: effectiveAddress,
                        name: 'New Creator',
                        bio: 'Welcome! Connect your wallet and start creating.',
                        avatarBlobId: null,
                        bannerBlobId: null,
                        suinsName: null,
                        totalSubscribers: 0,
                        totalContent: 0,
                        tiers: [],
                        createdAt: Math.floor(Date.now() / 1000),
                    });
                    setServiceObjectId(null);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Error fetching creator:', err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch creator');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchCreator();

        return () => {
            cancelled = true;
        };
    }, [effectiveAddress, suiClient]);

    return { creator, serviceObjectId, isLoading, error };
}
