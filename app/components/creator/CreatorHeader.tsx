'use client';

import { createPortal } from 'react-dom';
import { Creator, Tier } from '@/types';
import { useSubscribe } from '@/hooks/useSubscribe';
import { useCreatorBlobUrl } from '@/hooks/useCreatorBlobUrl';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { format } from '@/lib/format';
import { useState, useRef, useEffect } from 'react';

function formatStat(num: number): string {
    if (num >= 10_000) return `${(num / 1000).toFixed(0)}k`;
    if (num >= 1_000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
}

const DEFAULT_BANNER = '/image2.png';
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
    const [subscribeError, setSubscribeError] = useState<string | null>(null);
    const [subscribeSuccess, setSubscribeSuccess] = useState(false);
    const [showTierMenu, setShowTierMenu] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { url: bannerUrl, isLoading: bannerLoading } = useCreatorBlobUrl(creator.bannerBlobId, serviceObjectId ?? undefined);
    const { url: avatarUrl, isLoading: avatarLoading } = useCreatorBlobUrl(creator.avatarBlobId, serviceObjectId ?? undefined);

    const sortedTiers = [...creator.tiers].sort((a, b) => a.tierLevel - b.tierLevel);
    const hasTiers = sortedTiers.length > 0;

    const openTierMenu = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
            setShowTierMenu(true);
        }
    };

    const closeTierMenu = () => {
        setShowTierMenu(false);
        setDropdownPosition(null);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const inMenu = menuRef.current?.contains(target);
            const inDropdown = dropdownRef.current?.contains(target);
            if (!inMenu && !inDropdown) {
                closeTierMenu();
            }
        };
        if (showTierMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTierMenu]);

    const handleSubscribe = async (tier: Tier) => {
        closeTierMenu();
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
        <div className="relative w-full mb-0">
            {/* Full-width Banner — compact, image2.png by default */}
            <div className="w-full h-36 md:h-44 lg:h-52 relative overflow-hidden rounded-b-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#3c3cf6]/15 via-transparent to-purple-600/10 z-10" />
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

            {/* Profile card — overlapping banner, stats inline, buttons top right */}
            <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 relative z-20 -mt-20">
                <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row gap-6 min-w-0 flex-1">
                                <div className="shrink-0">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-2 ring-white/[0.08] bg-black">
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

                                <div className="flex-1 min-w-0 flex flex-col gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                                {creator.name}
                                            </h1>
                                            <span
                                                className="material-symbols-outlined text-[#3c3cf6] text-lg shrink-0"
                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                            >
                                                verified
                                            </span>
                                            {creator.suinsName && (
                                                <span className="text-xs font-medium text-[#3c3cf6] bg-[#3c3cf6]/10 px-2.5 py-1 rounded-full">
                                                    {creator.suinsName}
                                                </span>
                                            )}
                                        </div>
                                        {creator.bio && (
                                            <p className="text-gray-400 text-sm mt-1.5 line-clamp-2 max-w-2xl">
                                                {creator.bio}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 border-t border-white/[0.06]">
                                        <div className="flex items-center gap-6 text-sm">
                                            <span className="flex items-center gap-1.5">
                                                <span className="font-bold text-white tabular-nums">{formatStat(creator.totalSubscribers)}</span>
                                                <span className="text-gray-500 font-medium">subscribers</span>
                                            </span>
                                            <span className="text-white/20">·</span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="font-bold text-white tabular-nums">{formatStat(creator.totalContent)}</span>
                                                <span className="text-gray-500 font-medium">posts</span>
                                            </span>
                                            <span className="text-white/20">·</span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="font-bold text-white tabular-nums">{creator.tiers.length}</span>
                                                <span className="text-gray-500 font-medium">tiers</span>
                                            </span>
                                        </div>

                                        {!isOwnProfile && (
                                            <div className="flex flex-col gap-2 shrink-0">
                                                <div className="relative" ref={menuRef}>
                                                    {hasTiers ? (
                                                        <>
                                                            <button
                                                                ref={buttonRef}
                                                                type="button"
                                                                onClick={() => (showTierMenu ? closeTierMenu() : openTierMenu())}
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

                                                            {showTierMenu &&
                                                                dropdownPosition &&
                                                                typeof document !== 'undefined' &&
                                                                createPortal(
                                                                    <div
                                                                        ref={dropdownRef}
                                                                        className="fixed w-72 rounded-xl bg-[#141428] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-[100]"
                                                                        style={{
                                                                            top: dropdownPosition.top,
                                                                            right: dropdownPosition.right,
                                                                        }}
                                                                    >
                                                                        <div className="px-4 py-3 border-b border-white/[0.06]">
                                                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Choose a tier</p>
                                                                        </div>
                                                                        {sortedTiers.map((tier) => (
                                                                            <button
                                                                                key={tier.id}
                                                                                type="button"
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
                                                                    </div>,
                                                                    document.body,
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Create Post / Add Tier — top right of card (owner only) */}
                            {isOwnProfile && (
                                <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
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
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
