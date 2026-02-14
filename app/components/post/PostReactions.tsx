'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useReaction } from '@/hooks/useReaction';
import type { OnChainPost } from '@/types/post.types';

// ============================================================
// PostReactions — like/dislike buttons for a post
// ============================================================

interface PostReactionsProps {
    post: OnChainPost;
    serviceObjectId: string;
}

export function PostReactions({ post, serviceObjectId }: PostReactionsProps) {
    const currentAccount = useCurrentAccount();
    const { react, isPending } = useReaction(serviceObjectId, post.postId);

    const userReaction = currentAccount?.address
        ? post.reactions[currentAccount.address] ?? 0
        : 0;

    const handleReact = async (reaction: 1 | 2) => {
        if (!currentAccount?.address || isPending) return;
        await react(reaction);
    };

    return (
        <div className="flex items-center gap-1.5">
            {/* Like button */}
            <button
                onClick={() => handleReact(1)}
                disabled={isPending || !currentAccount?.address}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed ${
                    userReaction === 1
                        ? 'bg-[#3c3cf6]/20 text-[#3c3cf6] border border-[#3c3cf6]/30'
                        : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-transparent'
                }`}
                title="Like"
            >
                <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: userReaction === 1 ? "'FILL' 1" : "'FILL' 0" }}
                >
                    thumb_up
                </span>
                <span>{post.likes}</span>
            </button>

            {/* Dislike button */}
            <button
                onClick={() => handleReact(2)}
                disabled={isPending || !currentAccount?.address}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed ${
                    userReaction === 2
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-transparent'
                }`}
                title="Dislike"
            >
                <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: userReaction === 2 ? "'FILL' 1" : "'FILL' 0" }}
                >
                    thumb_down
                </span>
                <span>{post.dislikes}</span>
            </button>

            {/* Loading indicator */}
            {isPending && (
                <span className="material-symbols-outlined text-sm text-gray-500 animate-spin ml-1">
                    progress_activity
                </span>
            )}
        </div>
    );
}
