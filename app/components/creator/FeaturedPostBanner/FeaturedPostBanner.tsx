'use client';

import Link from 'next/link';
import type { FeaturedPostBannerProps } from './FeaturedPostBanner.types';

export function FeaturedPostBanner({ post, isLoading, error }: FeaturedPostBannerProps) {
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
                {/* Fond avec légère texture / flou */}
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-transparent" />

                <div className="relative z-10 p-8 md:p-10 flex flex-col justify-between h-full min-h-[200px] md:min-h-[240px]">
                    <div className="max-w-2xl">
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-1 line-clamp-2">
                            {post.title || 'Sans titre'}
                        </h2>
                        <p className="text-white/70 text-base md:text-lg">
                            par <span className="font-medium text-white/90">{post.creatorName}</span>
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

                {/* Décoration côté droit */}
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#3c3cf6]/10 to-transparent pointer-events-none" />
            </div>
        </section>
    );
}
