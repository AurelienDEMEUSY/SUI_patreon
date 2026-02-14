'use client';

import { useState, useCallback } from 'react';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { buildDeleteProfile } from '@/lib/contract';

interface UseDeleteCreatorResult {
    /** Delete the creator profile on-chain */
    deleteCreator: (serviceObjectId: string) => Promise<boolean>;
    /** Whether the delete transaction is pending */
    isLoading: boolean;
    /** Error from deletion */
    error: string | null;
    /** Whether the last deletion was successful */
    isSuccess: boolean;
}

/**
 * Hook to delete a creator's profile from the platform.
 * Calls delete_creator_profile on the Move contract.
 *
 * Requirements:
 * - The creator must have no active subscribers (enforced on-chain).
 * - Any remaining revenue is transferred back to the creator.
 * - The Service object is destroyed and removed from the Platform registry.
 */
export function useDeleteCreator(): UseDeleteCreatorResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
    const suiClient = useSuiClient();

    const deleteCreator = useCallback(async (
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
            const tx = buildDeleteProfile(serviceObjectId);

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
            let message = err instanceof Error ? err.message : 'Profile deletion failed';

            // Provide user-friendly error for known contract errors
            if (message.includes('EHasSubscribers') || message.includes('MoveAbort')) {
                message = 'Cannot delete profile: you still have active subscribers. Wait for all subscriptions to expire first.';
            } else if (message.includes('ENotCreator')) {
                message = 'Cannot delete profile: you are not the owner of this service.';
            }

            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [currentAccount, signAndExecute, suiClient]);

    return { deleteCreator, isLoading, error, isSuccess };
}
