'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useCreator } from '@/hooks/useCreator';
import { useAutoRegister } from '@/hooks/useAutoRegister';
import { CreatorHeader } from '@/components/creator/CreatorHeader';
import { CreatorStats } from '@/components/creator/CreatorStats';
import { ProfileTabs } from '@/components/creator/ProfileTabs';
import { ContentFeed } from '@/components/content/ContentFeed';
import { TierCard } from '@/components/tier/TierCard';

export default function CreatorProfilePage() {
    const params = useParams();
    const address = params.address as string;
    const { creator, serviceObjectId, isLoading, error } = useCreator(address);
    const { isRegistering, isChecking } = useAutoRegister();
    const [activeTab, setActiveTab] = useState('posts');

    if (isLoading || isChecking) {
        return (
            <div className="max-w-6xl mx-auto px-4 pb-20">
                {/* Skeleton Banner */}
                <div className="w-full h-56 md:h-72 lg:h-80 rounded-3xl bg-white/[0.03] animate-pulse mb-6" />
                {/* Skeleton Avatar + Info */}
                <div className="flex gap-5 -mt-24 px-6 md:px-10 relative z-20 mb-8">
                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-white/[0.06] animate-pulse shrink-0" />
                    <div className="flex-1 pt-16 space-y-3">
                        <div className="h-8 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
                        <div className="h-4 w-80 bg-white/[0.04] rounded-lg animate-pulse" />
                    </div>
                </div>
                {/* Skeleton Stats */}
                <div className="flex gap-3 mb-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="stat-card px-5 py-6 flex-1 animate-pulse">
                            <div className="h-8 w-16 bg-white/[0.06] rounded mx-auto mb-2" />
                            <div className="h-3 w-20 bg-white/[0.04] rounded mx-auto" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !creator) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-4xl text-gray-600">person_off</span>
                </div>
                <h1 className="text-xl font-bold text-white mb-2">{error || 'Creator not found'}</h1>
                <p className="text-gray-500 max-w-sm">The creator you are looking for does not exist or an error occurred.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 pb-20">
            {/* Registration Banner */}
            {isRegistering && (
                <div className="mb-4 flex items-center gap-3 bg-[#3c3cf6]/10 border border-[#3c3cf6]/30 rounded-2xl px-5 py-3.5">
                    <span className="material-symbols-outlined text-[#3c3cf6] animate-spin">progress_activity</span>
                    <span className="text-sm text-white font-medium">Setting up your creator profile on-chain...</span>
                </div>
            )}

            {/* Hero Header */}
            <CreatorHeader creator={creator} />

            {/* Stats Row */}
            <div className="mb-8 mt-2">
                <CreatorStats creator={creator} />
            </div>

            {/* Tabs + Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                {/* Left Column: Tabs & Content */}
                <div>
                    <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="min-h-[400px]">
                        {activeTab === 'posts' && (
                            <ContentFeed content={[]} />
                        )}

                        {activeTab === 'about' && (
                            <div className="content-card-premium rounded-2xl p-7 md:p-8">
                                <h3 className="text-xl font-bold text-white mb-4">About {creator.name}</h3>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-line text-[15px]">
                                    {creator.bio}
                                </p>
                                <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-2 gap-6">
                                    <div>
                                        <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1.5">Joined</span>
                                        <span className="text-white font-medium text-sm">{new Date(creator.createdAt * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1.5">SuiNS</span>
                                        <span className="text-[#3c3cf6] font-semibold text-sm">{creator.suinsName || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1.5">Total Posts</span>
                                        <span className="text-white font-medium text-sm">{creator.totalContent}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1.5">Subscribers</span>
                                        <span className="text-white font-medium text-sm">{creator.totalSubscribers.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'membership' && (
                            <div className="grid grid-cols-1 gap-5">
                                {creator.tiers.length > 0 ? (
                                    creator.tiers.map((tier) => (
                                        <TierCard
                                            key={tier.id}
                                            tier={tier}
                                            serviceObjectId={serviceObjectId}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06]">
                                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-3xl text-gray-600">workspace_premium</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1.5">No membership tiers</h3>
                                        <p className="text-gray-500 text-sm max-w-xs">This creator hasn&apos;t set up any subscription tiers yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar (Sticky) */}
                <div className="hidden lg:block">
                    <div className="sticky top-24 space-y-5">
                        {/* Quick About */}
                        {activeTab !== 'about' && (
                            <div className="stat-card p-5">
                                <h4 className="font-bold text-white text-sm mb-2.5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base text-[#3c3cf6]">info</span>
                                    About
                                </h4>
                                <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed mb-3">{creator.bio}</p>
                                <button
                                    onClick={() => setActiveTab('about')}
                                    className="text-[#3c3cf6] text-xs font-bold hover:underline underline-offset-2"
                                >
                                    Read more →
                                </button>
                            </div>
                        )}

                        {/* On-chain Info */}
                        {serviceObjectId && (
                            <div className="stat-card p-5">
                                <h4 className="font-bold text-white text-sm mb-2.5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base text-[#3c3cf6]">token</span>
                                    On-chain
                                </h4>
                                <div className="space-y-2">
                                    <div>
                                        <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Service ID</span>
                                        <span className="text-gray-400 text-xs font-mono break-all">{serviceObjectId}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Links */}
                        <div className="stat-card p-5">
                            <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-[#3c3cf6]">link</span>
                                Links
                            </h4>
                            <div className="flex flex-col gap-3">
                                <a href="#" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group/link">
                                    <span className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover/link:bg-white/[0.08] transition-colors">
                                        <span className="material-symbols-outlined text-[#4F9CF7] text-base">language</span>
                                    </span>
                                    Website
                                </a>
                                <a href="#" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group/link">
                                    <span className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover/link:bg-white/[0.08] transition-colors">
                                        <svg className="w-4 h-4 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                        </svg>
                                    </span>
                                    Discord Community
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
