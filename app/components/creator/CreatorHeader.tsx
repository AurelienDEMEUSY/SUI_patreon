'use client';

import { Creator } from '@/types';

interface CreatorHeaderProps {
    creator: Creator;
}

export function CreatorHeader({ creator }: CreatorHeaderProps) {
    return (
        <div className="relative mb-6">
            {/* Banner — Cinematic */}
            <div className="w-full h-56 md:h-72 lg:h-80 relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#3c3cf6]/20 via-transparent to-purple-600/15 z-10" />
                <img
                    src={creator.bannerBlobId || "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop"}
                    alt={`${creator.name} banner`}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Profile Section — Overlapping Banner */}
            <div className="relative -mt-24 px-6 md:px-10 z-20">
                <div className="flex flex-col md:flex-row md:items-end gap-5">
                    {/* Avatar with Glow Ring */}
                    <div className="shrink-0">
                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden profile-glow-ring bg-black">
                            <img
                                src={creator.avatarBlobId || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"}
                                alt={creator.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Info + Actions */}
                    <div className="flex-1 flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-1">
                        {/* Text Info */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight truncate">
                                    {creator.name}
                                </h1>
                                <span
                                    className="material-symbols-outlined text-[#3c3cf6] text-xl md:text-2xl shrink-0"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    verified
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm md:text-base max-w-xl leading-relaxed line-clamp-2 mb-2">
                                {creator.bio}
                            </p>
                            {creator.suinsName && (
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#3c3cf6]/10 rounded-full border border-[#3c3cf6]/20">
                                    <span className="w-2 h-2 rounded-full bg-[#3c3cf6] animate-pulse" />
                                    <span className="text-sm font-semibold text-[#3c3cf6]">{creator.suinsName}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2.5 shrink-0">
                            <button className="h-11 px-7 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] hover:from-[#4f4ff8] hover:to-[#7c7ff9] text-white font-bold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(60,60,246,0.5)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.7)] active:scale-95 flex items-center justify-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>loyalty</span>
                                Subscribe
                            </button>
                            <button className="h-11 px-5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm active:scale-95">
                                <span className="material-symbols-outlined text-lg">favorite</span>
                                Follow
                            </button>
                            <button className="h-11 w-11 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center active:scale-95">
                                <span className="material-symbols-outlined text-lg">share</span>
                            </button>
                            <button className="h-11 w-11 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center active:scale-95">
                                <span className="material-symbols-outlined text-lg">more_horiz</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
