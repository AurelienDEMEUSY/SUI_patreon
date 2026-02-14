'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { PageContainer } from '@/components/layout';
import { useCreator } from '@/hooks/useCreator';
import { useCreatorPosts } from '@/hooks/useCreatorPosts';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { PostFeed } from '@/components/post/PostFeed';

export default function CreatorHubPage() {
    const currentAccount = useCurrentAccount();
    const { creator, serviceObjectId } = useCreator(currentAccount?.address || null);
    const { posts, isLoading: postsLoading, refetch: refetchPosts } = useCreatorPosts(serviceObjectId);
    const [showCreatePost, setShowCreatePost] = useState(false);

    const hasProfile = !!serviceObjectId;

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
                {hasProfile && (
                    <button
                        onClick={() => setShowCreatePost(true)}
                        className="h-11 px-6 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] active:scale-95 flex items-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                        New Post
                    </button>
                )}
            </div>

            {!hasProfile ? (
                /* No profile yet */
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#3c3cf6] to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#3c3cf6]/20">
                        <span className="material-symbols-outlined text-3xl text-white">auto_awesome</span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Become a Creator</h2>
                    <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                        Start earning with your content. Setup tiers, upload posts, and build your community on the decentralized web.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                        <div className="glass-card p-6 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-emerald-400">payments</span>
                            </div>
                            <h3 className="font-bold text-lg mb-1">Set Up Earnings</h3>
                            <p className="text-xs text-gray-400">Configure subscription tiers and payout methods.</p>
                        </div>

                        <div className="glass-card p-6 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-blue-400">cloud_upload</span>
                            </div>
                            <h3 className="font-bold text-lg mb-1">Manage Content</h3>
                            <p className="text-xs text-gray-400">Upload videos, images, and text posts.</p>
                        </div>
                    </div>

                    <button className="mt-8 px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-xl shadow-white/10">
                        Start Creating Now
                    </button>
                </div>
            ) : (
                /* Has profile — show posts */
                <div>
                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
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
                </div>
            )}

            {/* Create Post Modal */}
            {showCreatePost && serviceObjectId && creator && (
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
