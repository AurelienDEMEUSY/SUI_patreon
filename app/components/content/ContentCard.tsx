'use client';

import { Content } from '@/types';
import { format } from '@/lib/format';

interface ContentCardProps {
    content: Content;
    onClick?: () => void;
}

export function ContentCard({ content, onClick }: ContentCardProps) {
    const renderIcon = () => {
        switch (content.contentType) {
            case 'video': return 'play_circle';
            case 'audio': return 'headphones';
            case 'image': return 'image';
            case 'file': return 'description';
            default: return 'article';
        }
    };

    return (
        <div
            onClick={onClick}
            className="group relative content-card-premium rounded-2xl overflow-hidden cursor-pointer"
        >
            {/* Media Preview */}
            <div className="aspect-[16/10] relative bg-white/[0.02] flex items-center justify-center overflow-hidden">
                {content.previewBlobId ? (
                    <img
                        src={content.previewBlobId}
                        alt={content.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3 text-white/[0.12]">
                        <span className="material-symbols-outlined text-5xl">{renderIcon()}</span>
                    </div>
                )}

                {/* Content Type Badge */}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-xl px-3 py-1 rounded-full text-[10px] font-bold text-white/80 uppercase tracking-widest flex items-center gap-1.5 border border-white/[0.08]">
                    <span className="material-symbols-outlined text-xs">{renderIcon()}</span>
                    {content.contentType}
                </div>

                {/* Lock Overlay */}
                {!content.isPublic && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] flex items-center justify-center">
                        <div className="bg-gradient-to-br from-[#3c3cf6] to-[#6366f1] rounded-2xl p-3.5 shadow-[0_0_40px_-5px_rgba(60,60,246,0.5)]">
                            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Info */}
            <div className="p-5">
                <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] text-gray-500 font-medium">{format.date(content.createdAt)}</span>
                    {!content.isPublic && (
                        <span className="text-[10px] text-[#3c3cf6] font-bold uppercase tracking-widest bg-[#3c3cf6]/10 px-2.5 py-0.5 rounded-full">
                            Subscribers
                        </span>
                    )}
                </div>

                <h3 className="text-base font-bold text-white mb-1.5 line-clamp-2 group-hover:text-[#3c3cf6] transition-colors duration-300">
                    {content.title}
                </h3>

                <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {content.description}
                </p>

                {/* Footer */}
                <div className="flex items-center gap-5 text-gray-600 text-xs font-semibold pt-3.5 border-t border-white/[0.05]">
                    <div className="flex items-center gap-1.5 hover:text-[#3c3cf6] transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                        {content.likesCount}
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-[#3c3cf6] transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                        {content.commentsCount}
                    </div>
                </div>
            </div>
        </div>
    );
}
