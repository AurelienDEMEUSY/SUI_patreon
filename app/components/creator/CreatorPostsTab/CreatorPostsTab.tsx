'use client';

import { PostFeed } from '@/components/post/PostFeed';
import type { CreatorPostsTabProps } from './CreatorPostsTab.types';

const DASHED_BUTTON_CLASS =
    'w-full mb-6 py-4 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#3c3cf6]/40 bg-white/[0.02] hover:bg-[#3c3cf6]/5 transition-all flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-[#3c3cf6] group';

export function CreatorPostsTab({ posts, serviceObjectId, isLoading, onCreatePost }: CreatorPostsTabProps) {
    return (
        <div>
            <button type="button" onClick={onCreatePost} className={DASHED_BUTTON_CLASS}>
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">edit_note</span>
                Create a new post
            </button>
            <PostFeed
                posts={posts}
                serviceObjectId={serviceObjectId}
                isOwnProfile={true}
                isLoading={isLoading}
            />
        </div>
    );
}
