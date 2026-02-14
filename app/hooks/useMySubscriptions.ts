'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { INDEXER_API_URL } from '@/lib/contract-constants';
import { getCreator, getMySubscriptions } from '@/lib/indexer-api';
import { queryAllCreators } from '@/lib/graphql/queries/creators';
import { querySubscriptionStatus } from '@/lib/graphql/queries/subscriptions';
import { parseServiceToCreator, getSubscribersTableId } from '@/lib/graphql/parsers';
import type { ServiceJson } from '@/lib/graphql/parsers';
import type { Creator } from '@/types';

export interface MySubscription {
    creator: Creator;
    tierLevel: number;
    expiresAtMs: number;
}

/**
 * Fetches all creators the current user is subscribed to.
 * Uses indexer API when INDEXER_API_URL is set, otherwise GraphQL.
 */
export function useMySubscriptions() {
    const currentAccount = useCurrentAccount();
    const subscriberAddress = currentAccount?.address ?? null;

    const { data: subscriptions = [], isLoading, error } = useQuery({
        queryKey: ['mySubscriptions', subscriberAddress],
        queryFn: async (): Promise<MySubscription[]> => {
            if (!subscriberAddress) return [];

            if (INDEXER_API_URL) {
                console.log('[useMySubscriptions] Using indexer API');
                const rows = await getMySubscriptions(subscriberAddress);
                const results: MySubscription[] = [];
                for (const row of rows) {
                    const creator = await getCreator(row.serviceObjectId);
                    if (creator) {
                        results.push({
                            creator,
                            tierLevel: row.tierLevel,
                            expiresAtMs: row.expiresAtMs,
                        });
                    }
                }
                return results;
            }

            console.log('[useMySubscriptions] Using GraphQL');
            // GraphQL: get all Service objects, check subscribers table for each
            const creatorsResult = await queryAllCreators(50);
            const nodes = creatorsResult.data?.objects?.nodes ?? [];

            if (nodes.length === 0) return [];

            const results: MySubscription[] = [];

            for (const node of nodes) {
                const json = node.asMoveObject?.contents?.json as ServiceJson | undefined;
                if (!json) continue;

                const subscribersTableId = getSubscribersTableId(json);
                if (!subscribersTableId) continue;

                try {
                    const subResult = await querySubscriptionStatus(
                        subscribersTableId,
                        subscriberAddress,
                    );

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const subValue = subResult.data?.object?.dynamicField?.value as any;
                    const subJson = subValue?.json;

                    if (!subJson) continue;

                    const tier = Number(subJson.tier ?? 0);
                    const expiresAtMs = Number(subJson.expires_at_ms ?? 0);
                    const now = Date.now();

                    if (expiresAtMs <= now) continue;

                    const creator = parseServiceToCreator(node.address, json);
                    results.push({ creator, tierLevel: tier, expiresAtMs });
                } catch {
                    continue;
                }
            }

            return results;
        },
        enabled: !!subscriberAddress,
        staleTime: 20_000,
        gcTime: 5 * 60_000,
    });

    return {
        subscriptions,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch subscriptions') : null,
    };
}
