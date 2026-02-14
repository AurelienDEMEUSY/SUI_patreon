'use client';

import type { OnChainPost } from '@/types/post.types';
import { PostCard } from './PostCard';

// ============================================================
// PostFeed — list of posts from a creator
// ============================================================

interface PostFeedProps {
    posts: OnChainPost[];
    serviceObjectId: string;
    isOwnProfile?: boolean;
    isLoading?: boolean;
}

export function PostFeed({ posts, serviceObjectId, isOwnProfile, isLoading }: PostFeedProps) {
    if (isLoading) {
        return (
            <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="content-card-premium rounded-2xl p-5 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-3 w-24 bg-white/[0.06] rounded" />
                            <div className="h-4 w-16 bg-white/[0.06] rounded-full" />
                        </div>
                        <div className="h-5 w-3/4 bg-white/[0.06] rounded mb-3" />
                        <div className="h-3 w-full bg-white/[0.04] rounded mb-2" />
                        <div className="h-3 w-5/6 bg-white/[0.04] rounded mb-4" />
                        <div className="aspect-[16/9] bg-white/[0.03] rounded-xl" />
                    </div>
                ))}
            </div>
        );
    }

    if (!posts || posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06]">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-gray-600">post_add</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1.5">No posts yet</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                    {isOwnProfile
                        ? 'Create your first post to share content with your subscribers!'
                        : "This creator hasn't posted anything yet. Check back later!"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {posts.map((post) => (
                <PostCard
                    key={post.postId}
                    post={post}
                    serviceObjectId={serviceObjectId}
                    isOwnProfile={isOwnProfile}
                />
            ))}
        </div>
    );
}
