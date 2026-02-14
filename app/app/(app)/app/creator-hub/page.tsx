'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { PageContainer } from '@/components/layout';
import { useCreator } from '@/hooks/useCreator';
import { useAutoRegister } from '@/hooks/useAutoRegister';
import { useCreatorPosts } from '@/hooks/useCreatorPosts';
import { CreateProfileForm } from '@/components/creator/CreateProfileForm';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { PostFeed } from '@/components/post/PostFeed';
import { useWithdrawFunds } from '@/hooks/useWithdrawFunds';
import { useCreatorRevenue } from '@/hooks/useCreatorRevenue';
import { format } from '@/lib/format';

export default function CreatorHubPage() {
    const router = useRouter();
    const currentAccount = useCurrentAccount();
    const { creator, serviceObjectId } = useCreator(currentAccount?.address || null);
    const {
        needsRegistration,
        isChecking,
        isRegistering,
        error: registerError,
        register,
    } = useAutoRegister();
    const { posts, isLoading: postsLoading, refetch: refetchPosts } = useCreatorPosts(serviceObjectId);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const { withdrawFunds, isLoading: isWithdrawing, error: withdrawError, isSuccess: withdrawSuccess } = useWithdrawFunds();
    const { revenueMist, isLoading: revenueLoading, refetch: refetchRevenue } = useCreatorRevenue(serviceObjectId);

    const hasProfile = !!serviceObjectId;

    const handleRegister = async (name: string, description: string) => {
        const result = await register(name, description);
        if (result) {
            setShowCreateForm(false);
            router.push(`/creator/${currentAccount?.address}`);
        }
        return result;
    };

    // Loading state
    if (isChecking) {
        return (
            <PageContainer maxWidth="max-w-4xl">
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <span className="material-symbols-outlined text-4xl text-[#3c3cf6] animate-spin mb-4">progress_activity</span>
                    <p className="text-white/50 text-sm font-medium">Checking your creator profile…</p>
                </div>
            </PageContainer>
        );
    }

    // Has a profile → show creator hub with posts
    if (hasProfile) {
        return (
            <PageContainer maxWidth="max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="w-10 h-10 bg-gradient-to-br from-[#3c3cf6] to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-[#3c3cf6]/20">
                                <span className="material-symbols-outlined text-xl text-white">auto_awesome</span>
                            </span>
                            Creator Hub
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 ml-[52px]">Manage your posts and content</p>
                    </div>
                    <button
                        onClick={() => setShowCreatePost(true)}
                        className="h-11 px-6 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] active:scale-95 flex items-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                        New Post
                    </button>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="stat-card px-5 py-4 text-center">
                        <div className="text-2xl font-black text-white">{posts.length}</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Posts</div>
                    </div>
                    <div className="stat-card px-5 py-4 text-center">
                        <div className="text-2xl font-black text-white">{creator?.tiers.length || 0}</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Tiers</div>
                    </div>
                    <div className="stat-card px-5 py-4 text-center">
                        <div className="text-2xl font-black text-white">{creator?.totalSubscribers || 0}</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Subscribers</div>
                    </div>
                </div>

                {/* Revenue & Withdraw */}
                <div className="stat-card p-5 mb-6 border border-[#3c3cf6]/20 bg-[#3c3cf6]/[0.03]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-2xl text-[#3c3cf6]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Available Revenue</div>
                                <div className="text-2xl font-black text-white mt-0.5">
                                    {revenueLoading ? (
                                        <span className="inline-block w-20 h-7 bg-white/[0.06] rounded animate-pulse" />
                                    ) : (
                                        <>{format.mistToSui(revenueMist)} <span className="text-[#3c3cf6] text-sm font-bold">SUI</span></>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                if (!serviceObjectId) return;
                                const success = await withdrawFunds(serviceObjectId);
                                if (success) refetchRevenue();
                            }}
                            disabled={isWithdrawing || revenueMist === 0}
                            className="h-11 px-6 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] hover:from-[#4f4ff8] hover:to-[#7c7ff9] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_30px_-5px_rgba(60,60,246,0.6)] active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100 shrink-0"
                        >
                            {isWithdrawing ? (
                                <>
                                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                    Withdrawing…
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-base">savings</span>
                                    Withdraw Funds
                                </>
                            )}
                        </button>
                    </div>
                    {withdrawSuccess && (
                        <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-3 py-2 rounded-lg">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Funds withdrawn successfully!
                        </div>
                    )}
                    {withdrawError && (
                        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 px-3 py-2 rounded-lg">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {withdrawError}
                        </div>
                    )}
                </div>

                {/* Create post quick action */}
                <button
                    onClick={() => setShowCreatePost(true)}
                    className="w-full mb-6 py-4 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#3c3cf6]/40 bg-white/[0.02] hover:bg-[#3c3cf6]/5 transition-all flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-[#3c3cf6] group"
                >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">edit_note</span>
                    Create a new post
                </button>

                {/* Posts feed */}
                <PostFeed
                    posts={posts}
                    serviceObjectId={serviceObjectId}
                    isOwnProfile={true}
                    isLoading={postsLoading}
                />

                {/* Create Post Modal */}
                {showCreatePost && creator && (
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
            </PageContainer>
        );
    }

    // No profile → empty state with registration
    return (
        <PageContainer maxWidth="max-w-4xl">
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-6 border border-white/[0.06]">
                    <span className="material-symbols-outlined text-3xl text-gray-500">person_off</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-2">No Creator Profile</h1>
                <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                    You don&apos;t have a creator profile yet. Create one to start publishing content, setting up subscription tiers, and earning from your community.
                </p>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-8 py-4 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] transition-all active:scale-95 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Create My Profile
                </button>
            </div>

            {showCreateForm && (
                <CreateProfileForm
                    onSubmit={handleRegister}
                    isLoading={isRegistering}
                    error={registerError}
                    onClose={() => setShowCreateForm(false)}
                />
            )}
        </PageContainer>
    );
}
