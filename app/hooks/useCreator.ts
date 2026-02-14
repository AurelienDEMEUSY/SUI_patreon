'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { findActiveServiceId } from '@/lib/service-lookup';
import type { Creator, Tier } from '@/types';

/**
 * Parse on-chain Service object fields into our Creator type.
 */
function parseServiceToCreator(
    serviceObjectId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: any,
    creatorAddress: string,
): Creator {
    const tiers: Tier[] = (fields.tiers || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any, index: number) => {
            const tf = t.fields || t;
            return {
                id: `${serviceObjectId}_tier_${tf.tier_level}`,
                creatorAddress,
                name: tf.name || '',
                description: '',
                priceInMist: Number(tf.price || 0),
                sealPolicyId: serviceObjectId,
                benefits: [],
                subscriberCount: 0,
                order: Number(tf.tier_level || index + 1),
                tierLevel: Number(tf.tier_level || index + 1),
                durationMs: Number(tf.duration_ms || 0),
            };
        }
    );

    return {
        address: creatorAddress,
        name: fields.name || 'Creator',
        bio: fields.description || '',
        avatarBlobId: null,
        bannerBlobId: null,
        suinsName: null,
        totalSubscribers: 0,
        totalContent: (fields.posts || []).length,
        tiers,
        createdAt: Math.floor(Date.now() / 1000),
        serviceObjectId,
    };
}

/**
 * Hook to fetch a single creator's data from on-chain.
 *
 * 1. Resolves the address to an active Service object ID (handles deleted profiles).
 * 2. Fetches the Service object and parses it into our Creator type.
 * 3. Falls back to a default empty profile if no Service exists.
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
                const foundServiceId = await findActiveServiceId(suiClient, effectiveAddress);

                if (cancelled) return;

                if (foundServiceId) {
                    const serviceObject = await suiClient.getObject({
                        id: foundServiceId,
                        options: { showContent: true },
                    });

                    if (cancelled) return;

                    if (serviceObject.data?.content?.dataType === 'moveObject') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const fields = (serviceObject.data.content as any).fields;
                        setCreator(parseServiceToCreator(foundServiceId, fields, effectiveAddress));
                        setServiceObjectId(foundServiceId);
                    }
                } else {
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
                    console.error('[useCreator] fetch error:', err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch creator');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchCreator();

        return () => { cancelled = true; };
    }, [effectiveAddress, suiClient]);

    return { creator, serviceObjectId, isLoading, error };
}
