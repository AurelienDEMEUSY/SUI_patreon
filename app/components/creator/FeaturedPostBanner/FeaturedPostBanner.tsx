'use client';

import Link from 'next/link';
import { usePostContent } from '@/hooks/usePostContent';
import type { FeaturedPostBannerProps } from './FeaturedPostBanner.types';

export function FeaturedPostBanner({ post, isLoading, error }: FeaturedPostBannerProps) {
    const content = usePostContent(
        post?.serviceObjectId ?? null,
        post?.onChainPost ?? null
    );
    const { images, isLoading: contentLoading, isUnlocked, unlock } = content;
    const bannerImageUrl = isUnlocked && images.length > 0 ? images[0].url : null;

    if (error) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="rounded-3xl bg-white/[0.04] border border-white/[0.06] overflow-hidden mb-5">
                <div className="relative min-h-[200px] md:min-h-[240px] p-8 md:p-10 flex flex-col justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
                    <div className="relative z-10 space-y-2">
                        <div className="h-10 w-3/4 max-w-md rounded-xl bg-white/10 animate-pulse" />
                        <div className="h-5 w-48 rounded-lg bg-white/5 animate-pulse" />
                    </div>
                    <div className="relative z-10 mt-3">
                        <div className="h-9 w-28 rounded-lg bg-white/10 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return null;
    }

    const creatorHref = `/creator/${post.creatorAddress}`;

    return (
        <section className="rounded-3xl overflow-hidden mb-5 border border-white/[0.06]">
            <div className="relative min-h-[200px] md:min-h-[240px] bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/70">
                {/* Image de fond : même décryptage que PostCard (Walrus + Seal) */}
                {bannerImageUrl ? (
                    <>
                        <img
                            src={bannerImageUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50" />
                    </>
                ) : (
                    <>
                        <div
                            className="absolute inset-0 opacity-40"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-transparent" />
                    </>
                )}

                {contentLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-[5]">
                        <span className="material-symbols-outlined text-[#3c3cf6] animate-spin text-3xl">progress_activity</span>
                    </div>
                )}

                {!contentLoading && !isUnlocked && post.onChainPost.requiredTier > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[5]">
                        <button
                            type="button"
                            onClick={unlock}
                            className="px-4 py-2 text-sm font-semibold bg-white text-black rounded-lg hover:bg-white/95"
                        >
                            Déverrouiller l’aperçu
                        </button>
                    </div>
                )}

                <div className="relative z-10 p-8 md:p-10 flex flex-col justify-between h-full min-h-[200px] md:min-h-[240px]">
                    <div className="max-w-2xl">
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-1 line-clamp-2 drop-shadow-lg">
                            {post.title || 'Sans titre'}
                        </h2>
                        <p className="text-white/90 text-base md:text-lg drop-shadow-md">
                            par <span className="font-medium text-white">{post.creatorName}</span>
                        </p>
                    </div>
                    <div className="mt-3">
                        <Link
                            href={creatorHref}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-white text-black rounded-lg hover:bg-white/95 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            Voir le post
                        </Link>
                    </div>
                </div>

                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#3c3cf6]/10 to-transparent pointer-events-none z-[1]" />
            </div>
        </section>
    );
}
