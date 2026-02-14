'use client';

import type { OnChainPost } from '@/types/post.types';
import { usePostContent } from '@/hooks/usePostContent';
import { PostImageGallery } from './PostImageGallery';
import { WALRUS_AGGREGATOR_URL } from '@/lib/contract-constants';

// ============================================================
// PostCard — displays a single post (locked or unlocked)
// ============================================================

interface PostCardProps {
    post: OnChainPost;
    serviceObjectId: string;
    isOwnProfile?: boolean;
}

export function PostCard({ post, serviceObjectId, isOwnProfile }: PostCardProps) {
    const { metadata, images, isLoading, error, isUnlocked, unlock } = usePostContent(serviceObjectId, post, isOwnProfile);

    const isPublic = post.requiredTier === 0;
    const dateStr = new Date(post.createdAtMs).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="content-card-premium rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-gray-500 font-medium">{dateStr}</span>
                    <div className="flex items-center gap-2">
                        {!isPublic && (
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-[#3c3cf6]/10 text-[#3c3cf6] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                                Tier {post.requiredTier}+
                            </span>
                        )}
                        {isPublic && (
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">public</span>
                                Public
                            </span>
                        )}
                    </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                    {post.title}
                </h3>
            </div>

            {/* Content Area */}
            {isUnlocked && metadata ? (
                <div className="px-5 pb-5">
                    {/* Text Content */}
                    {metadata.text && (
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                            {metadata.text}
                        </p>
                    )}

                    {/* Images */}
                    {images.length > 0 && (
                        <PostImageGallery images={images} />
                    )}
                </div>
            ) : (
                /* Locked / Loading state */
                <div className="px-5 pb-5">
                    {isLoading ? (
                        <div className="flex items-center gap-3 py-8 justify-center">
                            <span className="material-symbols-outlined text-[#3c3cf6] animate-spin">progress_activity</span>
                            <span className="text-sm text-gray-400 font-medium">
                                {isPublic ? 'Loading content...' : 'Decrypting content...'}
                            </span>
                        </div>
                    ) : error ? (
                        <div className="py-6 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-red-400">error</span>
                                <span className="text-sm text-red-300 font-medium">Failed to load</span>
                            </div>
                            <p className="text-xs text-gray-500">{error}</p>
                            {!isPublic && (
                                <button
                                    onClick={unlock}
                                    className="mt-3 px-4 py-2 text-xs font-bold text-[#3c3cf6] bg-[#3c3cf6]/10 hover:bg-[#3c3cf6]/20 rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    ) : !isPublic ? (
                        /* Locked content — needs subscription */
                        <div className="relative">
                            {/* Blurred placeholder */}
                            <div className="blur-sm select-none pointer-events-none py-4">
                                <div className="h-3 w-full bg-white/[0.04] rounded mb-2" />
                                <div className="h-3 w-5/6 bg-white/[0.04] rounded mb-2" />
                                <div className="h-3 w-4/6 bg-white/[0.04] rounded mb-4" />
                                <div className="aspect-[16/9] bg-white/[0.03] rounded-xl" />
                            </div>

                            {/* Unlock overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3c3cf6] to-[#6366f1] flex items-center justify-center mx-auto mb-3 shadow-[0_0_40px_-5px_rgba(60,60,246,0.5)]">
                                        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                                    </div>
                                    {isOwnProfile ? (
                                        <button
                                            onClick={unlock}
                                            className="px-5 py-2.5 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold text-sm rounded-xl hover:shadow-[0_0_30px_-5px_rgba(60,60,246,0.5)] active:scale-95 transition-all"
                                        >
                                            Preview as Creator
                                        </button>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-400 mb-3">Subscribe to Tier {post.requiredTier}+ to unlock</p>
                                            <button
                                                onClick={unlock}
                                                className="px-5 py-2.5 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold text-sm rounded-xl hover:shadow-[0_0_30px_-5px_rgba(60,60,246,0.5)] active:scale-95 transition-all"
                                            >
                                                Unlock Content
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Footer */}
            <div className="px-5 pb-4 pt-1 border-t border-white/[0.04] space-y-2">
                <div className="flex items-center gap-4 text-gray-600 text-xs font-semibold">
                    <span className="flex items-center gap-1 text-gray-500">
                        <span className="material-symbols-outlined text-xs">description</span>
                        {metadata?.images.length ?? 0} image{(metadata?.images.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                    {isUnlocked && (
                        <span className="flex items-center gap-1 text-emerald-400/60">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            Decrypted
                        </span>
                    )}
                </div>

                {/* Walrus Blob Storage Info */}
                <div className="space-y-1">
                    {post.metadataBlobId && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-mono">
                            <span className="material-symbols-outlined text-[10px] text-[#3c3cf6]/50">cloud</span>
                            <span className="text-gray-500 font-sans font-medium shrink-0">Metadata:</span>
                            <a
                                href={`${WALRUS_AGGREGATOR_URL}/v1/blobs/${post.metadataBlobId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-[#3c3cf6]/60 hover:text-[#3c3cf6] transition-colors"
                                title={post.metadataBlobId}
                            >
                                {post.metadataBlobId}
                            </a>
                            <button
                                onClick={() => navigator.clipboard.writeText(post.metadataBlobId)}
                                className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
                                title="Copy blob ID"
                            >
                                <span className="material-symbols-outlined text-[10px]">content_copy</span>
                            </button>
                        </div>
                    )}
                    {post.dataBlobId && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-mono">
                            <span className="material-symbols-outlined text-[10px] text-[#3c3cf6]/50">image</span>
                            <span className="text-gray-500 font-sans font-medium shrink-0">Data:</span>
                            <a
                                href={`${WALRUS_AGGREGATOR_URL}/v1/blobs/${post.dataBlobId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-[#3c3cf6]/60 hover:text-[#3c3cf6] transition-colors"
                                title={post.dataBlobId}
                            >
                                {post.dataBlobId}
                            </a>
                            <button
                                onClick={() => navigator.clipboard.writeText(post.dataBlobId)}
                                className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
                                title="Copy blob ID"
                            >
                                <span className="material-symbols-outlined text-[10px]">content_copy</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
