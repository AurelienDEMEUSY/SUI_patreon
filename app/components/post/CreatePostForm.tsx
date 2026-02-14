'use client';

import { useState, useRef, useCallback } from 'react';
import type { PostImageUpload } from '@/types/post.types';
import {
    MAX_IMAGES_PER_POST,
    MAX_IMAGE_SIZE_BYTES,
    SUPPORTED_IMAGE_TYPES,
    MAX_TITLE_LENGTH,
    MAX_TEXT_LENGTH,
} from '@/types/post.types';
import type { SupportedImageType } from '@/types/post.types';
import type { Tier } from '@/types';
import { usePublishPost } from '@/hooks/usePublishPost';
import { format } from '@/lib/format';

// ============================================================
// CreatePostForm
// ============================================================

interface CreatePostFormProps {
    serviceObjectId: string;
    tiers: Tier[];
    onSuccess?: () => void;
    onClose: () => void;
}

export function CreatePostForm({ serviceObjectId, tiers, onSuccess, onClose }: CreatePostFormProps) {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [images, setImages] = useState<PostImageUpload[]>([]);
    const [requiredTier, setRequiredTier] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { publishPost, progress, isPublishing, error, reset } = usePublishPost(serviceObjectId);

    const sortedTiers = [{ tierLevel: 0, name: 'Public (Free)' }, ...tiers.map(t => ({ tierLevel: t.tierLevel, name: t.name }))].sort((a, b) => a.tierLevel - b.tierLevel);

    // ── Image handling ──

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: PostImageUpload[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (images.length + newImages.length >= MAX_IMAGES_PER_POST) break;

            if (!SUPPORTED_IMAGE_TYPES.includes(file.type as SupportedImageType)) continue;
            if (file.size > MAX_IMAGE_SIZE_BYTES) continue;

            newImages.push({
                file,
                previewUrl: URL.createObjectURL(file),
            });
        }

        setImages((prev) => [...prev, ...newImages]);

        // Reset input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [images.length]);

    const removeImage = useCallback((index: number) => {
        setImages((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].previewUrl);
            updated.splice(index, 1);
            return updated;
        });
    }, []);

    // ── Submit ──

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPublishing) return;

        const postId = await publishPost(title, text, images, requiredTier);

        if (postId !== null) {
            // Cleanup preview URLs
            images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
            setTimeout(() => {
                onSuccess?.();
            }, 1500);
        }
    };

    const canSubmit = title.trim().length > 0 && (text.trim().length > 0 || images.length > 0) && !isPublishing;

    const isDone = progress.step === 'done';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={!isPublishing ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3c3cf6]">edit_note</span>
                        Create Post
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isPublishing}
                        className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.15em] text-gray-500 font-bold mb-2">
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={MAX_TITLE_LENGTH}
                            placeholder="What's this post about?"
                            disabled={isPublishing}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all disabled:opacity-50"
                        />
                        <div className="text-right text-[10px] text-gray-600 mt-1">{title.length}/{MAX_TITLE_LENGTH}</div>
                    </div>

                    {/* Text Content */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.15em] text-gray-500 font-bold mb-2">
                            Content
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            maxLength={MAX_TEXT_LENGTH}
                            placeholder="Write your post content here..."
                            rows={6}
                            disabled={isPublishing}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all resize-none disabled:opacity-50"
                        />
                        <div className="text-right text-[10px] text-gray-600 mt-1">{text.length.toLocaleString()}/{MAX_TEXT_LENGTH.toLocaleString()}</div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.15em] text-gray-500 font-bold mb-2">
                            Images ({images.length}/{MAX_IMAGES_PER_POST})
                        </label>

                        {/* Preview Grid */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.04] group">
                                        <img
                                            src={img.previewUrl}
                                            alt={`Upload ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            disabled={isPublishing}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-white text-sm">close</span>
                                        </button>
                                        <div className="absolute bottom-1.5 left-1.5 text-[9px] text-white/70 bg-black/60 px-1.5 py-0.5 rounded">
                                            {(img.file.size / 1024 / 1024).toFixed(1)}MB
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        {images.length < MAX_IMAGES_PER_POST && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isPublishing}
                                className="w-full py-4 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-[#3c3cf6]/40 bg-white/[0.02] hover:bg-[#3c3cf6]/5 transition-all flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[#3c3cf6] disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                                Add images
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={SUPPORTED_IMAGE_TYPES.join(',')}
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Tier Selector */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.15em] text-gray-500 font-bold mb-2">
                            Access Level
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {sortedTiers.map((tier) => (
                                <button
                                    key={tier.tierLevel}
                                    type="button"
                                    onClick={() => setRequiredTier(tier.tierLevel)}
                                    disabled={isPublishing}
                                    className={`
                                        px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                                        ${requiredTier === tier.tierLevel
                                            ? 'bg-[#3c3cf6]/20 border border-[#3c3cf6]/50 text-[#3c3cf6]'
                                            : 'bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:border-white/[0.12]'
                                        }
                                        disabled:opacity-50
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {tier.tierLevel === 0 ? 'public' : 'lock'}
                                        </span>
                                        <span className="truncate">{tier.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {requiredTier > 0 && (
                            <p className="text-[11px] text-amber-400/80 mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">info</span>
                                Content will be encrypted with SEAL — only subscribers with Tier {requiredTier}+ can decrypt
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <span className="material-symbols-outlined text-red-400 text-lg mt-0.5">error</span>
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Progress */}
                    {isPublishing && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#3c3cf6] animate-spin text-lg">progress_activity</span>
                                <span className="text-sm text-white font-medium">{progress.message}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress.percent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Success */}
                    {isDone && (
                        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                            <span className="material-symbols-outlined text-emerald-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            <span className="text-sm text-emerald-300 font-medium">Post published successfully!</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPublishing}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] hover:shadow-[0_0_30px_-5px_rgba(60,60,246,0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">publish</span>
                            {isPublishing ? 'Publishing...' : 'Publish Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
