'use client';

import type { CreatorHubSidebarProps } from './CreatorHubSidebar.types';

export function CreatorHubSidebar({ creator, serviceObjectId, onAboutClick }: CreatorHubSidebarProps) {
    return (
        <div className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                    <h4 className="font-bold text-white text-sm mb-2.5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-[#3c3cf6]">info</span>
                        About
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed mb-3">{creator.bio}</p>
                    <button
                        onClick={onAboutClick}
                        className="text-[#3c3cf6] text-xs font-bold hover:underline underline-offset-2"
                    >
                        Read more →
                    </button>
                </div>

                {serviceObjectId && (
                    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h4 className="font-bold text-white text-sm mb-2.5 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-[#3c3cf6]">token</span>
                            On-chain
                        </h4>
                        <div className="space-y-2">
                            <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Service ID</span>
                            <span className="text-gray-400 text-xs font-mono break-all">{serviceObjectId}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
