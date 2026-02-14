'use client';

import Link from 'next/link';
import { useMySubscriptions } from '@/hooks/useMySubscriptions';
import { format } from '@/lib/format';
import { PageContainer } from '@/components/layout';

export default function SubscriptionsPage() {
    const { subscriptions, isLoading, error } = useMySubscriptions();

    return (
        <PageContainer>
            {/* Header */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span
                        className="material-symbols-outlined text-[#3c3cf6] text-2xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        loyalty
                    </span>
                    <h1 className="text-3xl font-black text-white">My Subscriptions</h1>
                </div>
                <p className="text-white/50 text-sm">
                    {isLoading
                        ? 'Loading your subscriptions…'
                        : subscriptions.length > 0
                            ? `You are subscribed to ${subscriptions.length} creator${subscriptions.length > 1 ? 's' : ''}`
                            : 'Creators you subscribe to will appear here'}
                </p>
            </section>

            {/* Loading skeleton */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
                            <div className="h-40 rounded-xl bg-white/[0.04] mb-4" />
                            <div className="flex items-start gap-4">
                                <div className="size-12 rounded-full bg-white/[0.06]" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-32 bg-white/[0.06] rounded" />
                                    <div className="h-3 w-48 bg-white/[0.04] rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 text-red-300">
                    <span className="material-symbols-outlined">error</span>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && subscriptions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#3c3cf6]/10 flex items-center justify-center mb-4 border border-[#3c3cf6]/20">
                        <span className="material-symbols-outlined text-3xl text-[#3c3cf6]">star</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1.5">No active subscriptions</h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                        You haven&apos;t subscribed to any creators yet. Discover amazing content and support your favorite artists.
                    </p>
                    <Link
                        href="/app"
                        className="mt-6 px-6 py-3 bg-[#3c3cf6] hover:bg-[#3c3cf6]/90 text-white font-bold rounded-xl transition-all text-sm"
                    >
                        Discover Creators
                    </Link>
                </div>
            )}

            {/* Subscriptions grid */}
            {!isLoading && subscriptions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptions.map(({ creator, tierLevel, expiresAtMs }) => {
                        const tierName = creator.tiers.find((t) => t.tierLevel === tierLevel)?.name || `Tier ${tierLevel}`;
                        const timeLeft = expiresAtMs - Date.now();

                        return (
                            <div key={creator.address} className="glass-card rounded-2xl overflow-hidden p-4 group">
                                {/* Banner / gradient */}
                                <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-[#3c3cf6]/20 via-purple-600/10 to-pink-500/10 flex items-center justify-center">
                                    <span className="text-6xl font-black text-white/10 select-none">
                                        {creator.name.charAt(0)}
                                    </span>

                                    {/* Subscription badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className="backdrop-blur-md bg-emerald-500/80 px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            {tierName}
                                        </span>
                                    </div>

                                    {creator.tiers.length > 0 && (
                                        <div className="absolute top-3 right-3">
                                            <span className="backdrop-blur-md bg-[#3c3cf6]/80 px-2 py-1 rounded text-[10px] font-bold">
                                                {creator.tiers.length} TIER{creator.tiers.length > 1 ? 'S' : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Creator info */}
                                <div className="flex items-start gap-4">
                                    <div className="size-12 rounded-full border-2 border-emerald-500/30 bg-gradient-to-br from-[#3c3cf6]/30 to-purple-500/20 flex items-center justify-center text-xl font-bold shrink-0">
                                        {creator.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="font-bold truncate">{creator.name}</h4>
                                        <p className="text-xs text-white/50 mb-2 truncate">
                                            {creator.bio || 'On-chain creator'}
                                        </p>
                                        <div className="flex gap-4 text-xs font-semibold text-white/70">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">description</span>
                                                {creator.totalContent} posts
                                            </span>
                                            {creator.tiers.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">workspace_premium</span>
                                                    from {format.mistToSui(Math.min(...creator.tiers.map((t) => t.priceInMist)))} SUI
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Subscription info bar */}
                                <div className="mt-4 flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[11px] font-bold text-emerald-400">Active</span>
                                    </div>
                                    <span className="text-[11px] text-white/40 font-medium">
                                        {format.duration(timeLeft)} remaining
                                    </span>
                                </div>

                                {/* View Profile link */}
                                <Link
                                    href={`/creator/${creator.address}`}
                                    className="block w-full text-center mt-3 py-3 rounded-xl bg-white/5 hover:bg-[#3c3cf6] border border-white/10 hover:border-[#3c3cf6] transition-all text-sm font-bold"
                                >
                                    View Profile
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </PageContainer>
    );
}
