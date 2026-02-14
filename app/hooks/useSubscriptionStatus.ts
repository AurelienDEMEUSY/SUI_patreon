'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

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
 * to a given creator's Service object.
 *
 * Reads the `subscribers` Table inside the Service object via
 * `getDynamicFieldObject` using the subscriber address as key.
 */
export function useSubscriptionStatus(serviceObjectId: string | null | undefined): SubscriptionStatus {
    const [status, setStatus] = useState<SubscriptionStatus>({
        isSubscribed: false,
        tierLevel: 0,
        expiresAtMs: 0,
        isLoading: false,
    });

    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();

    useEffect(() => {
        if (!serviceObjectId || !currentAccount?.address) {
            return;
        }

        let cancelled = false;

        const check = async () => {
            setStatus((prev) => ({ ...prev, isLoading: true }));

            try {
                // 1. Fetch the Service object to get the subscribers Table UID
                const serviceObj = await suiClient.getObject({
                    id: serviceObjectId,
                    options: { showContent: true },
                });

                if (cancelled) return;

                if (serviceObj.data?.content?.dataType !== 'moveObject') {
                    setStatus({ isSubscribed: false, tierLevel: 0, expiresAtMs: 0, isLoading: false });
                    return;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fields = (serviceObj.data.content as any).fields;
                // The subscribers field is a Table — its UID is at fields.subscribers.fields.id.id
                const subscribersTableId = fields?.subscribers?.fields?.id?.id;

                if (!subscribersTableId) {
                    setStatus({ isSubscribed: false, tierLevel: 0, expiresAtMs: 0, isLoading: false });
                    return;
                }

                // 2. Query the dynamic field for the current user's address
                const dynField = await suiClient.getDynamicFieldObject({
                    parentId: subscribersTableId,
                    name: {
                        type: 'address',
                        value: currentAccount.address,
                    },
                });

                if (cancelled) return;

                if (!dynField.data?.content || dynField.data.content.dataType !== 'moveObject') {
                    // No subscription entry for this user
                    setStatus({ isSubscribed: false, tierLevel: 0, expiresAtMs: 0, isLoading: false });
                    return;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subFields = (dynField.data.content as any).fields?.value?.fields;
                const tier = Number(subFields?.tier ?? 0);
                const expiresAtMs = Number(subFields?.expires_at_ms ?? 0);
                const now = Date.now();

                setStatus({
                    isSubscribed: expiresAtMs > now,
                    tierLevel: tier,
                    expiresAtMs,
                    isLoading: false,
                });
            } catch (err) {
                // getDynamicFieldObject throws if the field doesn't exist on some versions
                if (!cancelled) {
                    console.warn('[useSubscriptionStatus] Error checking subscription:', err);
                    setStatus({ isSubscribed: false, tierLevel: 0, expiresAtMs: 0, isLoading: false });
                }
            }
        };

        check();

        return () => {
            cancelled = true;
        };
    }, [serviceObjectId, currentAccount?.address, suiClient]);

    return status;
}
