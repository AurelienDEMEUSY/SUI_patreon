'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useCreator } from '@/hooks/useCreator';
import { useAutoRegister } from '@/hooks/useAutoRegister';
import { useCreatorPosts } from '@/hooks/useCreatorPosts';
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
