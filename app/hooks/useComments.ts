'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useExecuteTransaction } from './useExecuteTransaction';
import { buildAddComment, buildDeleteComment } from '@/lib/contract';
import { queryKeys } from '@/constants/query-keys';

// ============================================================
// useComments — add/delete comments on a post
// ============================================================

interface UseCommentsResult {
    /** Add a comment to the post */
    addComment: (content: string) => Promise<boolean>;
    /** Delete a comment by index */
    deleteComment: (commentIndex: number) => Promise<boolean>;
    /** Whether a transaction is in progress */
    isPending: boolean;
    /** Error message */
    error: string | null;
}

export function useComments(serviceObjectId: string, postId: number): UseCommentsResult {
    const { executeTransaction, isPending: txPending } = useExecuteTransaction();
    const queryClient = useQueryClient();

    const invalidatePosts = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.creatorPosts(serviceObjectId) });
    };

    const addMutation = useMutation({
        mutationFn: async (content: string) => {
            const tx = buildAddComment(serviceObjectId, postId, content);
            await executeTransaction(tx);
        },
        onSuccess: invalidatePosts,
        onError: (err) => {
            console.error('[useComments] addComment error:', err);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (commentIndex: number) => {
            const tx = buildDeleteComment(serviceObjectId, postId, commentIndex);
            await executeTransaction(tx);
        },
        onSuccess: invalidatePosts,
        onError: (err) => {
            console.error('[useComments] deleteComment error:', err);
        },
    });

    const addComment = async (content: string): Promise<boolean> => {
        try {
            await addMutation.mutateAsync(content);
            return true;
        } catch {
            return false;
        }
    };

    const deleteComment = async (commentIndex: number): Promise<boolean> => {
        try {
            await deleteMutation.mutateAsync(commentIndex);
            return true;
        } catch {
            return false;
        }
    };

    const isPending = addMutation.isPending || deleteMutation.isPending || txPending;
    const error = addMutation.error || deleteMutation.error;

    return {
        addComment,
        deleteComment,
        isPending,
        error: error ? (error instanceof Error ? error.message : 'Failed') : null,
    };
}
