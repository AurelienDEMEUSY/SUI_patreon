'use client';

import { useState, useCallback } from 'react';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { buildSubscribe } from '@/lib/contract';

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
 * Builds and executes the subscription transaction, paying in SUI.
 */
export function useSubscribe(): UseSubscribeResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
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

            const result = await signAndExecute({
                transaction: tx,
            });

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
    }, [currentAccount, signAndExecute, suiClient]);

    return { subscribe, isLoading, error, isSuccess };
}
