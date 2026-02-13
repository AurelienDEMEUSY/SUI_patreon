'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useCreator } from '@/hooks/useCreator';
import { CreatorHeader } from '@/components/creator/CreatorHeader';
import { CreatorStats } from '@/components/creator/CreatorStats';
import { ProfileTabs } from '@/components/creator/ProfileTabs';
import { ContentFeed } from '@/components/content/ContentFeed';
import { TierCard } from '@/components/tier/TierCard';

export default function CreatorProfilePage() {
    const params = useParams();
    const address = params.address as string;
    const { creator, isLoading, error } = useCreator(address);
    const [activeTab, setActiveTab] = useState('posts');

    console.log('CreatorProfilePage rendered', { address, creator, isLoading, error });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-2 border-[#3c3cf6] border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (error || !creator) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <span className="material-symbols-outlined text-4xl text-gray-500 mb-2">error</span>
                <h1 className="text-xl font-bold text-white mb-2">{error || 'Creator not found'}</h1>
                <p className="text-gray-400">The creator you are looking for does not exist or an error occurred.</p>
            </div>
        );
    }

    // Filter content for this creator
    const creatorContent: any[] = []; // Placeholder for real content fetching logic

    return (
        <div className="max-w-7xl mx-auto px-4 pb-20">
            <CreatorHeader creator={creator} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                {/* Left Column: Tabs & Content */}
                <div>
                    <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="min-h-[400px]">
                        {activeTab === 'posts' && (
                            <ContentFeed content={creatorContent} />
                        )}

                        {activeTab === 'about' && (
                            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-4">About {creator.name}</h3>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                    {creator.bio}
                                </p>
                                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Joined</span>
                                        <span className="text-white font-medium">{new Date(creator.createdAt * 1000).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase tracking-widest text-gray-500 mb-1">SuiNS</span>
                                        <span className="text-[#3c3cf6] font-mono">{creator.suinsName || 'None'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'membership' && (
                            <div className="grid grid-cols-1 gap-6">
                                {creator.tiers.length > 0 ? (
                                    creator.tiers.map((tier) => (
                                        <TierCard key={tier.id} tier={tier} />
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        No membership tiers available.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Stats & Extras (Sticky) */}
                <div className="hidden lg:block">
                    <div className="sticky top-24 space-y-6">
                        <CreatorStats creator={creator} />

                        {/* Quick About (if not on about tab) */}
                        {activeTab !== 'about' && (
                            <div className="glass-card p-6 rounded-2xl">
                                <h4 className="font-bold text-white mb-2">About</h4>
                                <p className="text-sm text-gray-400 line-clamp-4 mb-4">{creator.bio}</p>
                                <button
                                    onClick={() => setActiveTab('about')}
                                    className="text-[#3c3cf6] text-sm font-bold hover:underline"
                                >
                                    Read more
                                </button>
                            </div>
                        )}

                        {/* Social / External Links (Mock) */}
                        <div className="glass-card p-6 rounded-2xl">
                            <h4 className="font-bold text-white mb-4">Links</h4>
                            <div className="flex flex-col gap-3">
                                <a href="#" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[#1DA1F2]">public</span>
                                    Website
                                </a>
                                <a href="#" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[#5865F2]">discord</span>
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
