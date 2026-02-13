'use client';

import { Content } from '@/types';
import { ContentCard } from './ContentCard';

interface ContentFeedProps {
    content: Content[];
}

export function ContentFeed({ content }: ContentFeedProps) {
    if (!content || content.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white/5 border border-dashed border-white/10">
                <span className="material-symbols-outlined text-4xl text-gray-500 mb-2">post_add</span>
                <h3 className="text-lg font-bold text-white mb-1">No posts yet</h3>
                <p className="text-gray-400 text-sm">This creator hasn't posted anything yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
                <ContentCard key={item.id} content={item} />
            ))}
        </div>
    );
}
