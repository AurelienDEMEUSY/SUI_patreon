'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { INDEXER_API_URL } from '@/lib/contract-constants';
import { getSubscriptionStatus } from '@/lib/indexer-api';
import { queryCreatorByObjectId } from '@/lib/graphql/queries/creators';
import { querySubscriptionStatus } from '@/lib/graphql/queries/subscriptions';
import { getSubscribersTableId } from '@/lib/graphql/parsers';
import type { ServiceJson } from '@/lib/graphql/parsers';

export interface SubscriptionStatus {
    /** Whether the current user has an active (non-expired) subscription */
    isSubscribed: boolean;
    /** The tier level of the subscription (0 if not subscribed) */
    tierLevel: number;
    /** Expiry timestamp in milliseconds */
    expiresAtMs: number;
    /** Whether the query is still loading */
    isLoading: boolean;
}

/**
 * Hook to check if the current connected wallet has an active subscription
 * to a given creator's Service object via GraphQL + React Query.
 *
 * MIGRATED: JSON-RPC (2 calls) → GraphQL → React Query (cached).
 */
export function useSubscriptionStatus(serviceObjectId: string | null | undefined): SubscriptionStatus {
    const currentAccount = useCurrentAccount();
    const subscriberAddress = currentAccount?.address ?? null;

    const { data, isLoading } = useQuery({
        queryKey: ['subscriptionStatus', serviceObjectId, subscriberAddress],
        queryFn: async () => {
            if (!serviceObjectId || !subscriberAddress) {
                return { isSubscribed: false, tierLevel: 0, expiresAtMs: 0 };
            }

            if (INDEXER_API_URL) {
                console.log('[useSubscriptionStatus] Using indexer API');
                const status = await getSubscriptionStatus(
                    subscriberAddress,
                    serviceObjectId,
                );
                if (!status) {
                    return { isSubscribed: false, tierLevel: 0, expiresAtMs: 0 };
                }
                return {
                    isSubscribed: status.expiresAtMs > Date.now(),
                    tierLevel: status.tierLevel,
                    expiresAtMs: status.expiresAtMs,
                };
            }

            console.log('[useSubscriptionStatus] Using GraphQL');
            // GraphQL: fetch Service object, then subscribers table
            const serviceResult = await queryCreatorByObjectId(serviceObjectId);
            const json = serviceResult.data?.object?.asMoveObject?.contents?.json as ServiceJson | undefined;

            if (!json) {
                return { isSubscribed: false, tierLevel: 0, expiresAtMs: 0 };
            }

            const subscribersTableId = getSubscribersTableId(json);
            if (!subscribersTableId) {
                return { isSubscribed: false, tierLevel: 0, expiresAtMs: 0 };
            }

            try {
                const subResult = await querySubscriptionStatus(
                    subscribersTableId,
                    subscriberAddress,
                );

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subValue = subResult.data?.object?.dynamicField?.value as any;
                const subJson = subValue?.json;

                if (!subJson) {
                    return { isSubscribed: false, tierLevel: 0, expiresAtMs: 0 };
                }

                const tier = Number(subJson.tier ?? 0);
                const expiresAtMs = Number(subJson.expires_at_ms ?? 0);

                return {
                    isSubscribed: expiresAtMs > Date.now(),
                    tierLevel: tier,
                    expiresAtMs,
                };
            } catch {
                return { isSubscribed: false, tierLevel: 0, expiresAtMs: 0 };
            }
        },
        enabled: !!serviceObjectId && !!subscriberAddress,
        staleTime: 15_000,
        gcTime: 5 * 60_000,
    });

    return {
        isSubscribed: data?.isSubscribed ?? false,
        tierLevel: data?.tierLevel ?? 0,
        expiresAtMs: data?.expiresAtMs ?? 0,
        isLoading,
    };
}
