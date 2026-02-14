'use client';

import { Creator, Tier } from '@/types';
import { useSubscribe } from '@/hooks/useSubscribe';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useCreatorBlobUrl } from '@/hooks/useCreatorBlobUrl';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { format } from '@/lib/format';
import { useState, useRef, useEffect } from 'react';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop';

interface CreatorHeaderProps {
    creator: Creator;
    serviceObjectId?: string | null;
    isOwnProfile?: boolean;
    onAddTier?: () => void;
    onCreatePost?: () => void;
}

export function CreatorHeader({ creator, serviceObjectId, isOwnProfile, onAddTier, onCreatePost }: CreatorHeaderProps) {
    const currentAccount = useCurrentAccount();
    const { subscribe, isLoading: isSubscribing } = useSubscribe();
    const subscription = useSubscriptionStatus(serviceObjectId);
    const [subscribeError, setSubscribeError] = useState<string | null>(null);
    const [subscribeSuccess, setSubscribeSuccess] = useState(false);
    const [showTierMenu, setShowTierMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { url: bannerUrl, isLoading: bannerLoading } = useCreatorBlobUrl(creator.bannerBlobId, serviceObjectId ?? undefined);
    const { url: avatarUrl, isLoading: avatarLoading } = useCreatorBlobUrl(creator.avatarBlobId, serviceObjectId ?? undefined);

    const sortedTiers = [...creator.tiers].sort((a, b) => a.tierLevel - b.tierLevel);
    const hasTiers = sortedTiers.length > 0;

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowTierMenu(false);
            }
        };
        if (showTierMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTierMenu]);

    const handleSubscribe = async (tier: Tier) => {
        setShowTierMenu(false);
        setSubscribeError(null);
        setSubscribeSuccess(false);

        if (!currentAccount) {
            setSubscribeError('Please connect your wallet first');
            return;
        }
        if (!serviceObjectId) {
            setSubscribeError('Creator has no on-chain service');
            return;
        }

        try {
            const success = await subscribe(serviceObjectId, tier.tierLevel, tier.priceInMist);
            if (success) {
                setSubscribeSuccess(true);
                setTimeout(() => setSubscribeSuccess(false), 3000);
            } else {
                setSubscribeError('Subscription failed');
                setTimeout(() => setSubscribeError(null), 5000);
            }
        } catch (err) {
            setSubscribeError(err instanceof Error ? err.message : 'Subscription failed');
            setTimeout(() => setSubscribeError(null), 5000);
        }
    };
    return (
        <div className="relative mb-6">
            {/* Banner — Cinematic (téléchargé/décrypté depuis Walrus comme les images de post) */}
            <div className="w-full h-56 md:h-72 lg:h-80 relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#3c3cf6]/20 via-transparent to-purple-600/15 z-10" />
                {bannerLoading ? (
                    <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
                ) : (
                    <img
                        src={bannerUrl || DEFAULT_BANNER}
                        alt={`${creator.name} banner`}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Profile Section — Overlapping Banner */}
            <div className="relative -mt-24 px-6 md:px-10 z-20">
                <div className="flex flex-col md:flex-row md:items-end gap-5">
                    {/* Avatar with Glow Ring (téléchargé/décrypté depuis Walrus comme les images de post) */}
                    <div className="shrink-0">
                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden profile-glow-ring bg-black">
                            {avatarLoading ? (
                                <div className="w-full h-full bg-white/[0.06] animate-pulse" />
                            ) : (
                                <img
                                    src={avatarUrl || DEFAULT_AVATAR}
                                    alt={creator.name}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </div>

                    {/* Info + Actions */}
                    <div className="flex-1 flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-1">
                        {/* Text Info */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight truncate">
                                    {creator.name}
                                </h1>
                                <span
                                    className="material-symbols-outlined text-[#3c3cf6] text-xl md:text-2xl shrink-0"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    verified
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm md:text-base max-w-xl leading-relaxed line-clamp-2 mb-2">
                                {creator.bio}
                            </p>
                            {creator.suinsName && (
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#3c3cf6]/10 rounded-full border border-[#3c3cf6]/20">
                                    <span className="w-2 h-2 rounded-full bg-[#3c3cf6] animate-pulse" />
                                    <span className="text-sm font-semibold text-[#3c3cf6]">{creator.suinsName}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                            {isOwnProfile ? (
                                /* ── Owner actions ── */
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={onCreatePost}
                                        className="h-11 px-6 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] hover:from-[#4f4ff8] hover:to-[#7c7ff9] text-white font-bold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(60,60,246,0.5)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.7)] active:scale-95 flex items-center justify-center gap-2 text-sm"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit_note</span>
                                        Create Post
                                    </button>
                                    <button
                                        onClick={onAddTier}
                                        className="h-11 px-5 bg-white/[0.05] hover:bg-white/[0.10] text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-lg">add_circle</span>
                                        Add Tier
                                    </button>
                                </div>
                            ) : (
                                /* ── Visitor actions ── */
                                <>
                                    <div className="relative" ref={menuRef}>
                                        {hasTiers ? (
                                            <>
                                                <button
                                                    onClick={() => setShowTierMenu((v) => !v)}
                                                    disabled={isSubscribing}
                                                    className="h-11 px-7 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] hover:from-[#4f4ff8] hover:to-[#7c7ff9] text-white font-bold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(60,60,246,0.5)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.7)] active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {isSubscribing ? (
                                                        <>
                                                            <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                                            Processing…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>loyalty</span>
                                                            Subscribe
                                                            <span className="material-symbols-outlined text-base">expand_more</span>
                                                        </>
                                                    )}
                                                </button>

                                                {/* Tier dropdown */}
                                                {showTierMenu && (
                                                    <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#141428] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50">
                                                        <div className="px-4 py-3 border-b border-white/[0.06]">
                                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Choose a tier</p>
                                                        </div>
                                                        {sortedTiers.map((tier) => (
                                                            <button
                                                                key={tier.id}
                                                                onClick={() => handleSubscribe(tier)}
                                                                className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors text-left group/tier"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-bold text-white truncate group-hover/tier:text-[#3c3cf6] transition-colors">{tier.name}</p>
                                                                    <p className="text-[11px] text-gray-500">
                                                                        {tier.durationMs ? `per ${format.duration(tier.durationMs)}` : 'per month'}
                                                                    </p>
                                                                </div>
                                                                <span className="text-sm font-black text-white shrink-0">
                                                                    {format.mistToSui(tier.priceInMist)} <span className="text-[#3c3cf6] text-xs font-bold">SUI</span>
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <span className="h-11 px-7 bg-white/[0.05] text-gray-500 font-bold rounded-xl border border-white/10 flex items-center justify-center gap-2 text-sm cursor-default">
                                                <span className="material-symbols-outlined text-lg">loyalty</span>
                                                No tiers available
                                            </span>
                                        )}
                                    </div>

                                    {subscribeSuccess && (
                                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-3 py-2 rounded-lg">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            Subscribed successfully!
                                        </div>
                                    )}
                                    {subscribeError && (
                                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 px-3 py-2 rounded-lg">
                                            <span className="material-symbols-outlined text-sm">error</span>
                                            {subscribeError}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
