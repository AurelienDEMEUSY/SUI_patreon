'use client';

import { Creator } from '@/types';
import Image from 'next/image';

interface CreatorHeaderProps {
    creator: Creator;
}

export function CreatorHeader({ creator }: CreatorHeaderProps) {
    return (
        <div className="relative mb-20">
            {/* Banner */}
            <div className="w-full h-64 md:h-80 relative overflow-hidden rounded-b-[3rem]">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <img
                    src={creator.bannerBlobId || "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop"}
                    alt={`${creator.name} banner`}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Profile Info Overlay */}
            <div className="absolute -bottom-16 left-0 right-0 px-6 md:px-12 flex flex-col md:flex-row items-end md:items-end gap-6 z-20">
                {/* Avatar */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-br from-[#3c3cf6] to-purple-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-black bg-black">
                        <img
                            src={creator.avatarBlobId || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"}
                            alt={creator.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Text Info */}
                <div className="flex-1 mb-2">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{creator.name}</h1>
                        <span className="material-symbols-outlined text-[#3c3cf6] filled text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                        {creator.bio}
                    </p>
                    {creator.suinsName && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-[#3c3cf6] animate-pulse"></span>
                            <span className="text-sm font-mono text-[#3c3cf6]">{creator.suinsName}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mb-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none h-12 px-6 bg-[#3c3cf6] hover:bg-[#3c3cf6]/90 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(60,60,246,0.5)] active:scale-95 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">favorite</span>
                        Follow
                    </button>
                    <button className="h-12 w-12 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined">share</span>
                    </button>
                    <button className="h-12 w-12 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
