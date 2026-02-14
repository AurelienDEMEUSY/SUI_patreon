'use client';

import { Content } from '@/types';
import { ContentCard } from './ContentCard';

interface ContentFeedProps {
    content: Content[];
}

export function ContentFeed({ content }: ContentFeedProps) {
    if (!content || content.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06]">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-gray-600">post_add</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1.5">No posts yet</h3>
                <p className="text-gray-500 text-sm max-w-xs">This creator hasn&apos;t posted anything yet. Check back later!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {content.map((item) => (
                <ContentCard key={item.id} content={item} />
            ))}
        </div>
    );
}
