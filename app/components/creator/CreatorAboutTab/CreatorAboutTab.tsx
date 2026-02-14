'use client';

import type { CreatorAboutTabProps } from './CreatorAboutTab.types';

export function CreatorAboutTab({ creator }: CreatorAboutTabProps) {
    return (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8">
            <h3 className="text-xl font-bold text-white mb-4">About {creator.name}</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line text-[15px]">
                {creator.bio}
            </p>
            <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1.5">Joined</span>
                    <span className="text-white font-medium text-sm">
                        {new Date(creator.createdAt * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
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
    );
}
