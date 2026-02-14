'use client';

import { useState, useCallback } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { buildSubscribe } from '@/lib/contract';
import { useSponsoredTransaction } from '@/enoki/sponsor';

interface UseSubscribeResult {
    /** Subscribe to a tier */
    subscribe: (serviceObjectId: string, tierLevel: number, priceInMist: number) => Promise<boolean>;
    /** Whether a subscription transaction is pending */
    isLoading: boolean;
    /** Error from subscription */
    error: string | null;
    /** Whether the last subscription was successful */
    isSuccess: boolean;
}

/**
 * Hook to subscribe to a creator's tier.
 * Uses sponsored transactions (Enoki) — zero gas for the user.
 * User pays the tier price in SUI; gas is sponsored.
 */
export function useSubscribe(): UseSubscribeResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const currentAccount = useCurrentAccount();
    const { sponsorAndExecute } = useSponsoredTransaction();
    const suiClient = useSuiClient();

    const subscribe = useCallback(async (
        serviceObjectId: string,
        tierLevel: number,
        priceInMist: number,
    ): Promise<boolean> => {
        if (!currentAccount) {
            setError('No wallet connected');
            return false;
        }

        setIsLoading(true);
        setError(null);
        setIsSuccess(false);

        try {
            const tx = buildSubscribe(serviceObjectId, tierLevel, priceInMist);

            const result = await sponsorAndExecute(tx);

            // Wait for confirmation
            await suiClient.waitForTransaction({
                digest: result.digest,
            });

            setIsSuccess(true);
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Subscription failed';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentAccount, sponsorAndExecute, suiClient]);

    return { subscribe, isLoading, error, isSuccess };
}
