'use client';

import { useState, useCallback } from 'react';
import { useExecuteTransaction } from './useExecuteTransaction';
import { buildAddComment, buildDeleteComment } from '@/lib/contract';

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
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addComment = useCallback(async (content: string): Promise<boolean> => {
        setIsPending(true);
        setError(null);
        try {
            const tx = buildAddComment(serviceObjectId, postId, content);
            await executeTransaction(tx);
            return true;
        } catch (err) {
            console.error('[useComments] addComment error:', err);
            setError(err instanceof Error ? err.message : 'Failed to add comment');
            return false;
        } finally {
            setIsPending(false);
        }
    }, [serviceObjectId, postId, executeTransaction]);

    const deleteComment = useCallback(async (commentIndex: number): Promise<boolean> => {
        setIsPending(true);
        setError(null);
        try {
            const tx = buildDeleteComment(serviceObjectId, postId, commentIndex);
            await executeTransaction(tx);
            return true;
        } catch (err) {
            console.error('[useComments] deleteComment error:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete comment');
            return false;
        } finally {
            setIsPending(false);
        }
    }, [serviceObjectId, postId, executeTransaction]);

    return { addComment, deleteComment, isPending: isPending || txPending, error };
}
