'use client';

import { Creator } from '@/types';

interface CreatorStatsProps {
    creator: Creator;
}

export function CreatorStats({ creator }: CreatorStatsProps) {
    return (
        <div className="flex gap-4 p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center min-w-[100px]">
                <span className="text-2xl font-black text-white">{creator.totalSubscribers}</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Subscribers</span>
            </div>
            <div className="px-6 py-3 rounded-xl hover:bg-white/5 transition-colors flex flex-col items-center min-w-[100px] cursor-default">
                <span className="text-2xl font-black text-white">{creator.totalContent}</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Posts</span>
            </div>
            <div className="px-6 py-3 rounded-xl hover:bg-white/5 transition-colors flex flex-col items-center min-w-[100px] cursor-default">
                <span className="text-2xl font-black text-white">{creator.tiers.length}</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Tiers</span>
            </div>
        </div>
    );
}
