'use client';

import { Content } from '@/types';
import { format } from '@/lib/format';
import { cn } from '@/lib/cn';

interface ContentCardProps {
    content: Content;
    onClick?: () => void;
}

export function ContentCard({ content, onClick }: ContentCardProps) {
    const isLocked = !content.isPublic && !content.previewBlobId; // Simplified logic, assumes true access check happens elsewhere or via hook

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
            className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors cursor-pointer"
        >
            {/* Media Preview / Cover */}
            <div className="aspect-video relative bg-white/5 flex items-center justify-center overflow-hidden">
                {content.previewBlobId ? (
                    <img
                        src={content.previewBlobId}
                        alt={content.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-white/20">
                        <span className="material-symbols-outlined text-4xl">{renderIcon()}</span>
                    </div>
                )}

                {/* Overlay for Type */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">{renderIcon()}</span>
                    {content.contentType}
                </div>

                {/* Lock Overlay */}
                {!content.isPublic && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="bg-[#3c3cf6] rounded-full p-4 shadow-[0_0_30px_-5px_rgba(60,60,246,0.6)]">
                            <span className="material-symbols-outlined text-white text-2xl">lock</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Info */}
            <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">{format.date(content.createdAt)}</span>
                    {!content.isPublic && (
                        <span className="text-xs text-[#3c3cf6] font-bold uppercase tracking-wider">Subscribers Only</span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#3c3cf6] transition-colors">
                    {content.title}
                </h3>

                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {content.description}
                </p>

                <div className="flex items-center gap-4 text-gray-500 text-xs font-bold border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                        {content.likesCount}
                    </div>
                    <div className="flex items-center gap-1 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                        {content.commentsCount}
                    </div>
                </div>
            </div>
        </div>
    );
}
