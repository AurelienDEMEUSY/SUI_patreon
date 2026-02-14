'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useExecuteTransaction } from './useExecuteTransaction';
import { buildReactToPost } from '@/lib/contract';
import { queryKeys } from '@/constants/query-keys';

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
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (reaction: 1 | 2) => {
            const tx = buildReactToPost(serviceObjectId, postId, reaction);
            await executeTransaction(tx);
        },
        onSuccess: () => {
            // Invalidate the posts list so reaction counts are refreshed
            queryClient.invalidateQueries({ queryKey: queryKeys.creatorPosts(serviceObjectId) });
        },
        onError: (err) => {
            console.error('[useReaction] error:', err);
        },
    });

    const react = async (reaction: 1 | 2): Promise<boolean> => {
        try {
            await mutation.mutateAsync(reaction);
            return true;
        } catch {
            return false;
        }
    };

    return {
        react,
        isPending: mutation.isPending || txPending,
        error: mutation.error ? (mutation.error instanceof Error ? mutation.error.message : 'Failed to react') : null,
    };
}
