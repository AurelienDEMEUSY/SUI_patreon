'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useComments } from '@/hooks/useComments';
import { useAddressNames } from '@/hooks/useAddressNames';
import type { OnChainPost } from '@/types/post.types';

// ============================================================
// CommentSection — displays comments with expand + add form
// ============================================================

interface CommentSectionProps {
    post: OnChainPost;
    serviceObjectId: string;
    creatorAddress?: string;
}

/** Number of comments to show before "See more" */
const PREVIEW_COUNT = 2;

export function CommentSection({ post, serviceObjectId, creatorAddress }: CommentSectionProps) {
    const currentAccount = useCurrentAccount();
    const { addComment, deleteComment, isPending, error } = useComments(serviceObjectId, post.postId);

    const [expanded, setExpanded] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Resolve all comment author addresses to names
    const authorAddresses = post.comments.map((c) => c.author);
    const addressNames = useAddressNames(authorAddresses);

    const visibleComments = expanded
        ? post.comments
        : post.comments.slice(0, PREVIEW_COUNT);
    const hasMore = post.comments.length > PREVIEW_COUNT;

    const handleSubmit = async () => {
        const text = newComment.trim();
        if (!text || isPending) return;
        const success = await addComment(text);
        if (success) {
            setNewComment('');
            setShowForm(false);
        }
    };

    const handleDelete = async (index: number) => {
        if (isPending) return;
        await deleteComment(index);
    };

    const formatTime = (ms: number) => {
        const diff = Date.now() - ms;
        const minutes = Math.floor(diff / 60_000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-3">
            {/* Comment count + add button */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => post.comments.length > 0 && setExpanded(!expanded)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                    disabled={post.comments.length === 0}
                >
                    <span className="material-symbols-outlined text-sm">chat_bubble</span>
                    {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                </button>

                {currentAccount?.address && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-1 text-xs font-bold text-[#3c3cf6] hover:text-[#6366f1] transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">add_comment</span>
                        Comment
                    </button>
                )}
            </div>

            {/* Comment form */}
            {showForm && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Write a comment..."
                        maxLength={500}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/40 transition-colors"
                        disabled={isPending}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || isPending}
                        className="px-4 py-2 bg-[#3c3cf6] hover:bg-[#3c3cf6]/80 text-white font-bold text-xs rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        {isPending ? (
                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-sm">send</span>
                        )}
                    </button>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">error</span>
                    {error}
                </p>
            )}

            {/* Comments list */}
            {visibleComments.length > 0 && (
                <div className="space-y-2.5">
                    {visibleComments.map((comment, idx) => {
                        // Use real index in the full array for deletion
                        const realIndex = expanded ? idx : idx;
                        const isAuthor = currentAccount?.address === comment.author;
                        const isCreator = currentAccount?.address === creatorAddress;
                        const canDelete = isAuthor || isCreator;
                        const displayName = addressNames[comment.author] || `${comment.author.slice(0, 6)}…${comment.author.slice(-4)}`;

                        return (
                            <div
                                key={`${comment.author}-${comment.createdAtMs}-${idx}`}
                                className="group flex gap-2.5 py-2 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                            >
                                {/* Avatar placeholder */}
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3c3cf6]/30 to-[#6366f1]/30 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-[#3c3cf6]">
                                        {displayName.slice(0, 2).toUpperCase()}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-white truncate max-w-[140px]" title={comment.author}>
                                            {displayName}
                                        </span>
                                        {comment.author === creatorAddress && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#3c3cf6]/10 text-[#3c3cf6] px-1.5 py-0.5 rounded-md">
                                                Creator
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-600">{formatTime(comment.createdAtMs)}</span>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed break-words">
                                        {comment.content}
                                    </p>
                                </div>

                                {/* Delete button */}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(realIndex)}
                                        disabled={isPending}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 shrink-0 self-start mt-1"
                                        title="Delete comment"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* See more / See less */}
            {hasMore && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs font-bold text-[#3c3cf6] hover:text-[#6366f1] transition-colors flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-sm">
                        {expanded ? 'expand_less' : 'expand_more'}
                    </span>
                    {expanded ? 'Show less' : `See ${post.comments.length - PREVIEW_COUNT} more comment${post.comments.length - PREVIEW_COUNT !== 1 ? 's' : ''}`}
                </button>
            )}
        </div>
    );
}
