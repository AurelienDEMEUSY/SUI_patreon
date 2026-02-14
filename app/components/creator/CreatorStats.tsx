'use client';

import { Creator } from '@/types';

interface CreatorStatsProps {
    creator: Creator;
}

function formatNumber(num: number): string {
    if (num >= 10_000) return `${(num / 1000).toFixed(0)}k`;
    if (num >= 1_000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
}

export function CreatorStats({ creator }: CreatorStatsProps) {
    const stats = [
        { value: creator.totalSubscribers, label: 'Subscribers', icon: 'group' },
        { value: creator.totalContent, label: 'Posts', icon: 'grid_view' },
        { value: creator.tiers.length, label: 'Tiers', icon: 'workspace_premium' },
    ];

    return (
        <div className="flex gap-3">
            {stats.map((stat) => (
                <div key={stat.label} className="stat-card px-5 py-4 flex flex-col items-center min-w-[100px] flex-1 group cursor-default">
                    <span className="material-symbols-outlined text-[#3c3cf6] text-lg mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">{stat.icon}</span>
                    <span className="text-2xl md:text-3xl font-black text-white tracking-tight">{formatNumber(stat.value)}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">{stat.label}</span>
                </div>
            ))}
        </div>
    );
}
