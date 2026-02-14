'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useCreator } from '@/hooks/useCreator';
import { useAutoRegister } from '@/hooks/useAutoRegister';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useCreatorPosts } from '@/hooks/useCreatorPosts';
import { CreatorHeader } from '@/components/creator/CreatorHeader';
import { ProfileTabs } from '@/components/creator/ProfileTabs';
import { PostFeed } from '@/components/post/PostFeed';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { TierCard } from '@/components/tier/TierCard';
import { AddTierForm } from '@/components/tier/AddTierForm';
import { format } from '@/lib/format';

export default function CreatorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const address = params.address as string;
    const currentAccount = useCurrentAccount();
    const { creator, serviceObjectId, isLoading, error } = useCreator(address);
    const { isRegistering, isChecking } = useAutoRegister();
    const subscription = useSubscriptionStatus(serviceObjectId);
    const [activeTab, setActiveTab] = useState('posts');
    const [showAddTier, setShowAddTier] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const { posts, isLoading: postsLoading, refetch: refetchPosts } = useCreatorPosts(serviceObjectId);

    const isOwnProfile = !!(currentAccount?.address && creator?.address && currentAccount.address === creator.address);

    if (isLoading || isChecking) {
        return (
            <div className="w-full pb-20">
                <div className="w-full h-36 md:h-44 lg:h-52 bg-white/[0.03] animate-pulse rounded-b-2xl" />
                <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 -mt-20 relative z-10">
                    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 p-6 flex gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-white/[0.06] animate-pulse shrink-0" />
                        <div className="flex-1 space-y-4">
                            <div className="h-6 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
                            <div className="h-4 w-full max-w-sm bg-white/[0.04] rounded animate-pulse" />
                            <div className="flex gap-6 pt-2">
                                <span className="h-4 w-20 bg-white/[0.05] rounded animate-pulse" />
                                <span className="h-4 w-16 bg-white/[0.05] rounded animate-pulse" />
                                <span className="h-4 w-14 bg-white/[0.05] rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !creator) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-4xl text-gray-600">person_off</span>
                </div>
                <h1 className="text-xl font-bold text-white mb-2">{error || 'Creator account does not exist'}</h1>
                <p className="text-gray-500 max-w-sm mb-6">This address does not have a creator profile on-chain.</p>
                <button
                    onClick={() => router.push('/app')}
                    className="px-6 py-3 bg-[#3c3cf6] hover:bg-[#3c3cf6]/90 text-white font-bold rounded-xl transition-all text-sm"
                >
                    Discover Creators
                </button>
            </div>
        );
    }

    return (
        <div className="w-full pb-20">
            {isRegistering && (
                <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 mb-4">
                    <div className="flex items-center gap-3 bg-[#3c3cf6]/10 border border-[#3c3cf6]/30 rounded-2xl px-5 py-3.5">
                        <span className="material-symbols-outlined text-[#3c3cf6] animate-spin">progress_activity</span>
                        <span className="text-sm text-white font-medium">Setting up your creator profile on-chain...</span>
                    </div>
                </div>
            )}

            <CreatorHeader
                creator={creator}
                serviceObjectId={serviceObjectId}
                isOwnProfile={isOwnProfile}
                onAddTier={() => setShowAddTier(true)}
                onCreatePost={() => setShowCreatePost(true)}
            />

            <div className="w-full max-w-6xl mx-auto px-6 lg:px-10">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 mt-8">
                    <div className="min-w-0">
                        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

                        <div className="min-h-[400px] mt-2">
                            {activeTab === 'posts' && (
                                <div>
                                    {isOwnProfile && serviceObjectId && (
                                        <button
                                            onClick={() => setShowCreatePost(true)}
                                            className="w-full mb-6 py-4 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#3c3cf6]/40 bg-white/[0.02] hover:bg-[#3c3cf6]/5 transition-all flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-[#3c3cf6] group"
                                        >
                                            <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">edit_note</span>
                                            Create a new post
                                        </button>
                                    )}
                                    <PostFeed
                                        posts={posts}
                                        serviceObjectId={serviceObjectId || ''}
                                        isOwnProfile={isOwnProfile}
                                        isLoading={postsLoading}
                                    />
                                </div>
                            )}

                            {activeTab === 'about' && (
                                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8">
                                    <h3 className="text-xl font-bold text-white mb-4">About {creator.name}</h3>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-line text-[15px]">
                                        {creator.bio}
                                    </p>
                                    <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        <div>
                                            <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1.5">Joined</span>
                                            <span className="text-white font-medium text-sm">{new Date(creator.createdAt * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1.5">SuiNS</span>
                                            <span className="text-[#3c3cf6] font-semibold text-sm">{creator.suinsName || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1.5">Posts</span>
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
                                    {isOwnProfile && serviceObjectId && (
                                        <button
                                            onClick={() => setShowAddTier(true)}
                                            className="w-full py-4 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#3c3cf6]/40 bg-white/[0.02] hover:bg-[#3c3cf6]/5 transition-all flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-[#3c3cf6] group"
                                        >
                                            <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">add_circle</span>
                                            Add a new tier
                                        </button>
                                    )}

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
                                            <p className="text-gray-500 text-sm max-w-xs">
                                                {isOwnProfile
                                                    ? 'Create your first tier so supporters can subscribe!'
                                                    : "This creator hasn't set up any subscription tiers yet."}
                                            </p>
                                            {isOwnProfile && serviceObjectId && (
                                                <button
                                                    onClick={() => setShowAddTier(true)}
                                                    className="mt-6 h-11 px-7 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] active:scale-95 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                                    Create First Tier
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="sticky top-24 space-y-5">
                            {!isOwnProfile && subscription.isSubscribed && creator && (
                                <div className="rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/[0.06]">
                                    <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                        Your Subscription
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Tier</span>
                                            <span className="text-sm font-bold text-emerald-400">
                                                {creator.tiers.find(t => t.tierLevel === subscription.tierLevel)?.name || `Tier ${subscription.tierLevel}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Status</span>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Active
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Expires</span>
                                            <span className="text-xs font-medium text-gray-400">
                                                {new Date(subscription.expiresAtMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Time Left</span>
                                            <span className="text-xs font-medium text-gray-400">
                                                {format.duration(subscription.expiresAtMs - Date.now())}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'about' && (
                                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
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

                            {serviceObjectId && (
                                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                                    <h4 className="font-bold text-white text-sm mb-2.5 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base text-[#3c3cf6]">token</span>
                                        On-chain
                                    </h4>
                                    <div className="space-y-2">
                                        <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Service ID</span>
                                        <span className="text-gray-400 text-xs font-mono break-all">{serviceObjectId}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showAddTier && serviceObjectId && (
                <AddTierForm
                    serviceObjectId={serviceObjectId}
                    existingTierLevels={creator.tiers.map((t) => t.tierLevel)}
                    onSuccess={() => {
                        setShowAddTier(false);
                        router.refresh();
                        window.location.reload();
                    }}
                    onClose={() => setShowAddTier(false)}
                />
            )}

            {showCreatePost && serviceObjectId && (
                <CreatePostForm
                    serviceObjectId={serviceObjectId}
                    tiers={creator.tiers}
                    onSuccess={() => {
                        setShowCreatePost(false);
                        refetchPosts();
                    }}
                    onClose={() => setShowCreatePost(false)}
                />
            )}
        </div>
    );
}
