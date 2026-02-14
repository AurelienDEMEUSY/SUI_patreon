'use client';

import { useState, useCallback } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';
import { buildWithdrawRevenue } from '@/lib/contract';
import { useExecuteTransaction } from './useExecuteTransaction';
import { queryKeys } from '@/constants/query-keys';

interface UseWithdrawFundsResult {
    /** Withdraw all accumulated revenue from the Service */
    withdrawFunds: (serviceObjectId: string) => Promise<boolean>;
    /** Whether the withdraw transaction is pending */
    isLoading: boolean;
    /** Error from withdrawal */
    error: string | null;
    /** Whether the last withdrawal was successful */
    isSuccess: boolean;
}

/**
 * Hook to withdraw accumulated creator revenue from the on-chain Service.
 * Calls withdraw_creator_funds on the Move contract.
 *
 * Requirements:
 * - Only the creator (service.creator == sender) can withdraw.
 * - There must be a positive revenue balance.
 */
export function useWithdrawFunds(): UseWithdrawFundsResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const currentAccount = useCurrentAccount();
    const { executeTransaction } = useExecuteTransaction();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();

    const withdrawFunds = useCallback(async (
        serviceObjectId: string,
    ): Promise<boolean> => {
        if (!currentAccount) {
            setError('No wallet connected');
            return false;
        }

        setIsLoading(true);
        setError(null);
        setIsSuccess(false);

        try {
            const tx = buildWithdrawRevenue(serviceObjectId);
            const result = await executeTransaction(tx);

            await suiClient.waitForTransaction({
                digest: result.digest,
            });

            setIsSuccess(true);
            if (serviceObjectId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.creatorRevenue(serviceObjectId) });
            }
            return true;
        } catch (err) {
            let message = err instanceof Error ? err.message : 'Withdrawal failed';

            if (message.includes('ENoFundsToWithdraw') || message.includes('MoveAbort')) {
                message = 'No funds available to withdraw.';
            } else if (message.includes('ENotCreator')) {
                message = 'Only the creator can withdraw funds.';
            }

            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentAccount, executeTransaction, suiClient]);

    return { withdrawFunds, isLoading, error, isSuccess };
}
