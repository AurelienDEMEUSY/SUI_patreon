'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useCreator } from '@/hooks/useCreator';
import { useAutoRegister } from '@/hooks/useAutoRegister';
import { useCreatorPosts } from '@/hooks/useCreatorPosts';
import { useWithdrawFunds } from '@/hooks/useWithdrawFunds';
import { useCreatorRevenue } from '@/hooks/useCreatorRevenue';
import { CreatorHeader } from '@/components/creator/CreatorHeader';
import { ProfileTabs } from '@/components/creator/ProfileTabs';
import { CreateProfileForm } from '@/components/creator/CreateProfileForm';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { AddTierForm } from '@/components/tier/AddTierForm';
import { CreatorProfileSkeleton } from '@/components/creator/CreatorProfileSkeleton';
import { NoCreatorProfile } from '@/components/creator/NoCreatorProfile';
import { CreatorAboutTab } from '@/components/creator/CreatorAboutTab';
import { CreatorHubSidebar } from '@/components/creator/CreatorHubSidebar';
import { CreatorPostsTab } from '@/components/creator/CreatorPostsTab';
import { CreatorMembershipTab } from '@/components/creator/CreatorMembershipTab';
import { CreatorRegisteringBanner } from '@/components/creator/CreatorRegisteringBanner';
import { format } from '@/lib/format';

export default function CreatorHubPage() {
    const router = useRouter();
    const currentAccount = useCurrentAccount();
    const { creator, serviceObjectId, isLoading } = useCreator(currentAccount?.address || null);
    const {
        isChecking,
        isRegistering,
        error: registerError,
        register,
    } = useAutoRegister();
    const { posts, isLoading: postsLoading, refetch: refetchPosts } = useCreatorPosts(serviceObjectId);
    const { withdrawFunds, isLoading: isWithdrawing, error: withdrawError, isSuccess: withdrawSuccess } = useWithdrawFunds();
    const { revenueMist, isLoading: revenueLoading, refetch: refetchRevenue } = useCreatorRevenue(serviceObjectId);
    const [activeTab, setActiveTab] = useState('posts');
    const [showAddTier, setShowAddTier] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const hasProfile = !!serviceObjectId && !!creator;

    const handleRegister = async (name: string, description: string) => {
        const result = await register(name, description);
        if (result) {
            setShowCreateForm(false);
            router.push(`/creator/${currentAccount?.address}`);
        }
        return result;
    };

    if (isChecking || isLoading) {
        return <CreatorProfileSkeleton />;
    }

    if (hasProfile && creator) {
        return (
            <div className="w-full pb-20">
                {isRegistering && <CreatorRegisteringBanner />}

                <CreatorHeader
                    creator={creator}
                    serviceObjectId={serviceObjectId}
                    isOwnProfile={true}
                    onAddTier={() => setShowAddTier(true)}
                    onCreatePost={() => setShowCreatePost(true)}
                />

                <div className="w-full max-w-6xl mx-auto px-6 lg:px-10">
                    {/* Stats bar + Revenue (design main, intégré sous le header) */}
                    <div className="grid grid-cols-3 gap-4 mb-6 mt-6">
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-center">
                            <div className="text-2xl font-black text-white">{posts.length}</div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Posts</div>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-center">
                            <div className="text-2xl font-black text-white">{creator.tiers.length}</div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Tiers</div>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-center">
                            <div className="text-2xl font-black text-white">{creator.totalSubscribers}</div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Subscribers</div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#3c3cf6]/20 bg-[#3c3cf6]/[0.03] p-5 mb-6">
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
                                className="h-11 px-6 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] hover:from-[#4f4ff8] hover:to-[#7c7ff9] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_30px_-5px_rgba(60,60,246,0.6)] active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 mt-8">
                        <div className="min-w-0">
                            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

                            <div className="min-h-[400px] mt-2">
                                {activeTab === 'posts' && (
                                    <CreatorPostsTab
                                        posts={posts}
                                        serviceObjectId={serviceObjectId || ''}
                                        isLoading={postsLoading}
                                        onCreatePost={() => setShowCreatePost(true)}
                                    />
                                )}

                                {activeTab === 'about' && <CreatorAboutTab creator={creator} />}

                                {activeTab === 'membership' && (
                                    <CreatorMembershipTab
                                        tiers={creator.tiers}
                                        serviceObjectId={serviceObjectId}
                                        onAddTier={() => setShowAddTier(true)}
                                    />
                                )}
                            </div>
                        </div>

                        <CreatorHubSidebar
                            creator={creator}
                            serviceObjectId={serviceObjectId}
                            onAboutClick={() => setActiveTab('about')}
                        />
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

    return (
        <NoCreatorProfile
            title="Pas de profil créateur"
            description="Crée un profil pour publier du contenu et gérer tes abonnés."
            buttonLabel="Créer mon profil"
            onButtonClick={() => setShowCreateForm(true)}
        >
            {showCreateForm && (
                <CreateProfileForm
                    onSubmit={handleRegister}
                    isLoading={isRegistering}
                    error={registerError}
                    onClose={() => setShowCreateForm(false)}
                />
            )}
        </NoCreatorProfile>
    );
}
