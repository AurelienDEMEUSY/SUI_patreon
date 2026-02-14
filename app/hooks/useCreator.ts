'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { INDEXER_API_URL } from '@/lib/contract-constants';
import { getCreator, getCreators } from '@/lib/indexer-api';
import { queryCreatorByObjectId, queryAllCreators } from '@/lib/graphql/queries/creators';
import { parseServiceToCreator } from '@/lib/graphql/parsers';
import type { ServiceJson } from '@/lib/graphql/parsers';
import type { Creator } from '@/types';

interface CreatorResult {
    creator: Creator;
    serviceObjectId: string | null;
}

/** Default empty profile for when no creator exists */
function defaultProfile(address: string): CreatorResult {
    return {
        creator: {
            address,
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
 * Hook to fetch a single creator's data from on-chain via GraphQL + React Query.
 *
 * Uses React Query for caching — navigating between pages won't re-fetch.
 *
 * Strategy:
 * 1. Search all Service objects for one where `creator == address`
 * 2. If not found and looks like an object ID, try direct query
 * 3. Falls back to a default empty profile if no Service exists
 */
export function useCreator(addressOrServiceId: string | null) {
    const currentAccount = useCurrentAccount();
    const effectiveAddress = addressOrServiceId || currentAccount?.address || null;

    const { data, isLoading, error } = useQuery({
        queryKey: ['creator', effectiveAddress],
        queryFn: async (): Promise<CreatorResult> => {
            if (!effectiveAddress) return defaultProfile('');

            if (INDEXER_API_URL) {
                console.log('[useCreator] Using indexer API');
                // Indexer: try by service object ID first, then by creator address
                const isObjectId =
                    effectiveAddress.startsWith('0x') && effectiveAddress.length > 42;
                if (isObjectId) {
                    const creator = await getCreator(effectiveAddress);
                    if (creator) {
                        return { creator, serviceObjectId: effectiveAddress };
                    }
                }
                const creators = await getCreators(effectiveAddress);
                const c = creators[0];
                if (c) {
                    return {
                        creator: c,
                        serviceObjectId: c.serviceObjectId ?? null,
                    };
                }
                return defaultProfile(effectiveAddress);
            }

            console.log('[useCreator] Using GraphQL');
            // GraphQL: search all Service objects for one matching this creator address
            const result = await queryAllCreators(50);
            const nodes = result.data?.objects?.nodes ?? [];

            let foundNode = nodes.find((n) => {
                const json = n.asMoveObject?.contents?.json as ServiceJson | undefined;
                return json?.creator === effectiveAddress;
            });

            if (!foundNode) {
                foundNode = nodes.find((n) => n.address === effectiveAddress);
            }

            if (!foundNode && effectiveAddress.startsWith('0x') && effectiveAddress.length > 42) {
                const directResult = await queryCreatorByObjectId(effectiveAddress);
                const json = directResult.data?.object?.asMoveObject?.contents?.json as ServiceJson | undefined;
                if (json) {
                    const addr = directResult.data?.object?.address;
                    if (addr) {
                        return {
                            creator: parseServiceToCreator(addr, json),
                            serviceObjectId: addr,
                        };
                    }
                }
            }

            if (foundNode) {
                const json = foundNode.asMoveObject?.contents?.json as ServiceJson;
                return {
                    creator: parseServiceToCreator(foundNode.address, json),
                    serviceObjectId: foundNode.address,
                };
            }

            return defaultProfile(effectiveAddress);
        },
        enabled: !!effectiveAddress,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
    });

    return {
        creator: data?.creator ?? null,
        serviceObjectId: data?.serviceObjectId ?? null,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch creator') : null,
    };
}
