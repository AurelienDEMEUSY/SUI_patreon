'use client';

import { useCallback } from 'react';
import {
    useCurrentWallet,
    useSignAndExecuteTransaction,
    useSuiClient,
} from '@mysten/dapp-kit';
import { isEnokiWallet } from '@mysten/enoki';
import { useSponsoredTransaction } from '@/enoki/sponsor/useSponsoredTransaction';
import type { Transaction } from '@mysten/sui/transactions';

// ============================================================
// useExecuteTransaction — dual-wallet support (Enoki + standard)
// ============================================================

interface UseExecuteTransactionResult {
    /**
     * Execute a transaction, automatically choosing:
     * - Enoki sponsored TX for zkLogin wallets
     * - Standard signAndExecute for normal wallets (Sui Wallet, Suiet, etc.)
     */
    executeTransaction: (transaction: Transaction) => Promise<{ digest: string }>;
    /** Whether the transaction is currently pending */
    isPending: boolean;
}

/**
 * Universal hook that detects the connected wallet type and executes
 * the transaction with the appropriate method:
 *
 * - **Enoki wallet (zkLogin):** Uses sponsored transactions (zero gas for user)
 * - **Standard wallet (Sui Wallet, Suiet, Ethos, etc.):** Uses signAndExecuteTransaction
 */
export function useExecuteTransaction(): UseExecuteTransactionResult {
    const currentWallet = useCurrentWallet();
    const suiClient = useSuiClient();
    const { mutateAsync: signAndExecute, isPending: isSignPending } = useSignAndExecuteTransaction();
    const { sponsorAndExecute, isPending: isSponsorPending } = useSponsoredTransaction();

    const isEnoki = !!(currentWallet?.currentWallet && isEnokiWallet(currentWallet.currentWallet));

    const executeTransaction = useCallback(async (transaction: Transaction): Promise<{ digest: string }> => {
        if (isEnoki) {
            // Enoki wallet → sponsored transaction (zero gas)
            return sponsorAndExecute(transaction);
        } else {
            // Standard wallet → user pays gas
            const result = await signAndExecute({ transaction });
            // Wait for confirmation
            await suiClient.waitForTransaction({ digest: result.digest });
            return { digest: result.digest };
        }
    }, [isEnoki, sponsorAndExecute, signAndExecute, suiClient]);

    return {
        executeTransaction,
        isPending: isSignPending || isSponsorPending,
    };
}
