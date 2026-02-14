'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { findActiveServiceId } from '@/lib/service-lookup';
import { getSubscriberCount } from '@/lib/subscriber-count';
import { getWalrusImageUrl } from '@/lib/walrus';
import { queryKeys } from '@/constants/query-keys';
import type { Creator, Tier } from '@/types';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

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
        address: fields.creator || creatorAddress,
        name: fields.name || 'Creator',
        bio: fields.description || '',
        avatarBlobId: fields.avatar_blob_id
            ? getWalrusImageUrl(fields.avatar_blob_id)
            : null,
        bannerBlobId: null,
        suinsName: fields.suins_name?.fields?.vec?.[0] ?? null,
        totalSubscribers: 0,
        totalContent: (fields.posts || []).length,
        tiers,
        createdAt: Math.floor(Date.now() / 1000),
        serviceObjectId,
    };
}

/** Pure async fetcher — no React hooks inside. */
async function fetchCreatorData(
    suiClient: SuiJsonRpcClient,
    effectiveAddress: string,
): Promise<{ creator: Creator; serviceObjectId: string | null }> {
    const foundServiceId = await findActiveServiceId(suiClient, effectiveAddress);

    if (foundServiceId) {
        const serviceObject = await suiClient.getObject({
            id: foundServiceId,
            options: { showContent: true },
        });

        if (serviceObject.data?.content?.dataType === 'moveObject') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fields = (serviceObject.data.content as any).fields;
            const creator = parseServiceToCreator(foundServiceId, fields, effectiveAddress);
            const totalSubscribers = await getSubscriberCount(suiClient, foundServiceId, fields);
            return {
                creator: { ...creator, totalSubscribers },
                serviceObjectId: foundServiceId,
            };
        }
    }

    return {
        creator: {
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
        },
        serviceObjectId: null,
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
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const effectiveAddress = addressOrServiceId || currentAccount?.address || null;

    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.creator(effectiveAddress ?? ''),
        queryFn: () => fetchCreatorData(suiClient, effectiveAddress!),
        enabled: !!effectiveAddress,
        staleTime: 30_000,
    });

    return {
        creator: data?.creator ?? null,
        serviceObjectId: data?.serviceObjectId ?? null,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch creator') : null,
    };
}
