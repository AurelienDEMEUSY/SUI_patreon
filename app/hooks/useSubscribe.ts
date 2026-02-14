'use client';

import { useState, useCallback } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';
import { buildSubscribe } from '@/lib/contract';
import { useSponsoredTransaction } from '@/enoki/sponsor';
import { queryKeys } from '@/constants/query-keys';

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
 * User pays the tier price in SUI (from their own coins); gas is sponsored.
 *
 * IMPORTANT: We do NOT use tx.gas for payment because Enoki forbids GasCoin
 * references in sponsored transactions. Instead, we query the user's SUI
 * coins and pass them explicitly to the transaction builder.
 */
export function useSubscribe(): UseSubscribeResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const currentAccount = useCurrentAccount();
    const { sponsorAndExecute } = useSponsoredTransaction();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();

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
            // ── 1. Fetch the user's SUI coins ──
            const { data: coins } = await suiClient.getCoins({
                owner: currentAccount.address,
                coinType: '0x2::sui::SUI',
            });

            if (coins.length === 0) {
                throw new Error('You have no SUI coins. Please fund your wallet.');
            }

            const totalBalance = coins.reduce(
                (sum, c) => sum + BigInt(c.balance),
                BigInt(0),
            );
            if (totalBalance < BigInt(priceInMist)) {
                const needed = (Number(priceInMist) / 1_000_000_000).toFixed(2);
                const available = (Number(totalBalance) / 1_000_000_000).toFixed(2);
                throw new Error(
                    `Insufficient SUI balance. Need ${needed} SUI but only have ${available} SUI.`,
                );
            }

            const singleCoin = coins.find(
                (c) => BigInt(c.balance) >= BigInt(priceInMist),
            );
            const selectedCoins = singleCoin ? [singleCoin] : coins;

            console.log('[useSubscribe] Selected coins:', selectedCoins.map(c => ({
                id: c.coinObjectId,
                balance: c.balance,
            })));

            // ── 2. Build the transaction ──
            const tx = buildSubscribe(
                serviceObjectId,
                tierLevel,
                priceInMist,
                selectedCoins,
            );

            // ── 3. Sponsor & execute ──
            const result = await sponsorAndExecute(tx, {
                extraAllowedAddresses: selectedCoins.map((c) => c.coinObjectId),
            });

            // Wait for confirmation
            await suiClient.waitForTransaction({
                digest: result.digest,
            });

            setIsSuccess(true);

            // ── 4. Invalidate related queries ──
            queryClient.invalidateQueries({
                queryKey: queryKeys.subscriptionStatus(serviceObjectId, currentAccount.address),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.mySubscriptions(currentAccount.address),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.creator(serviceObjectId),
            });

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Subscription failed';
            console.error('[useSubscribe] Error:', message);
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentAccount, sponsorAndExecute, suiClient, queryClient]);

    return { subscribe, isLoading, error, isSuccess };
}
