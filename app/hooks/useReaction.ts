'use client';

import { useState, useCallback } from 'react';
import { useExecuteTransaction } from './useExecuteTransaction';
import { buildReactToPost } from '@/lib/contract';

// ============================================================
// useReaction — toggle like/dislike on a post
// ============================================================

interface UseReactionResult {
    /** Send a reaction (1 = like, 2 = dislike). Same reaction = toggle off. */
    react: (reaction: 1 | 2) => Promise<boolean>;
    /** Whether a transaction is in progress */
    isPending: boolean;
    /** Error message */
    error: string | null;
}

export function useReaction(serviceObjectId: string, postId: number): UseReactionResult {
    const { executeTransaction, isPending: txPending } = useExecuteTransaction();
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const react = useCallback(async (reaction: 1 | 2): Promise<boolean> => {
        setIsPending(true);
        setError(null);
        try {
            const tx = buildReactToPost(serviceObjectId, postId, reaction);
            await executeTransaction(tx);
            return true;
        } catch (err) {
            console.error('[useReaction] error:', err);
            setError(err instanceof Error ? err.message : 'Failed to react');
            return false;
        } finally {
            setIsPending(false);
        }
    }, [serviceObjectId, postId, executeTransaction]);

    return { react, isPending: isPending || txPending, error };
}
