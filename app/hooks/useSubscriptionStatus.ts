'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { queryKeys } from '@/constants/query-keys';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

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

const DEFAULT_STATUS: Omit<SubscriptionStatus, 'isLoading'> = {
    isSubscribed: false,
    tierLevel: 0,
    expiresAtMs: 0,
};

async function fetchSubscriptionStatus(
    suiClient: SuiJsonRpcClient,
    serviceObjectId: string,
    userAddress: string,
): Promise<Omit<SubscriptionStatus, 'isLoading'>> {
    // 1. Fetch the Service object to get the subscribers Table UID
    const serviceObj = await suiClient.getObject({
        id: serviceObjectId,
        options: { showContent: true },
    });

    if (serviceObj.data?.content?.dataType !== 'moveObject') {
        return DEFAULT_STATUS;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields = (serviceObj.data.content as any).fields;
    const subscribersTableId = fields?.subscribers?.fields?.id?.id;

    if (!subscribersTableId) {
        return DEFAULT_STATUS;
    }

    // 2. Query the dynamic field for the current user's address
    try {
        const dynField = await suiClient.getDynamicFieldObject({
            parentId: subscribersTableId,
            name: { type: 'address', value: userAddress },
        });

        if (!dynField.data?.content || dynField.data.content.dataType !== 'moveObject') {
            return DEFAULT_STATUS;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subFields = (dynField.data.content as any).fields?.value?.fields;
        const tier = Number(subFields?.tier ?? 0);
        const expiresAtMs = Number(subFields?.expires_at_ms ?? 0);
        const now = Date.now();

        return {
            isSubscribed: expiresAtMs > now,
            tierLevel: tier,
            expiresAtMs,
        };
    } catch {
        // getDynamicFieldObject throws if the field doesn't exist on some versions
        return DEFAULT_STATUS;
    }
}

/**
 * Hook to check if the current connected wallet has an active subscription
 * to a given creator's Service object.
 */
export function useSubscriptionStatus(serviceObjectId: string | null | undefined): SubscriptionStatus {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();

    const enabled = !!serviceObjectId && !!currentAccount?.address;

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.subscriptionStatus(serviceObjectId ?? '', currentAccount?.address ?? ''),
        queryFn: () => fetchSubscriptionStatus(suiClient, serviceObjectId!, currentAccount!.address),
        enabled,
        staleTime: 10_000,
    });

    return {
        ...(data ?? DEFAULT_STATUS),
        isLoading,
    };
}
