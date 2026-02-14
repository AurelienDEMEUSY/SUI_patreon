'use client';

import { useState } from 'react';
import type { DecryptedImage } from '@/types/post.types';

// ============================================================
// PostImageGallery — displays decrypted images
// ============================================================

interface PostImageGalleryProps {
    images: DecryptedImage[];
}

export function PostImageGallery({ images }: PostImageGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (images.length === 0) return null;

    const gridClass =
        images.length === 1
            ? 'grid-cols-1'
            : images.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2 sm:grid-cols-3';

    return (
        <>
            {/* Image Grid */}
            <div className={`grid ${gridClass} gap-2 rounded-xl overflow-hidden`}>
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        className={`relative cursor-pointer group overflow-hidden ${images.length === 1 ? '' : 'aspect-square'
                            } ${images.length === 3 && idx === 0 ? 'row-span-2 aspect-auto' : ''}`}
                        onClick={() => setLightboxIndex(idx)}
                    >
                        <img
                            src={img.url}
                            alt={img.meta.alt || `Image ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Close */}
                    <button
                        onClick={() => setLightboxIndex(null)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                    >
                        <span className="material-symbols-outlined text-white text-xl">close</span>
                    </button>

                    {/* Navigation */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0));
                                }}
                                className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                            >
                                <span className="material-symbols-outlined text-white">chevron_left</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
                                }}
                                className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                            >
                                <span className="material-symbols-outlined text-white">chevron_right</span>
                            </button>
                        </>
                    )}

                    {/* Image */}
                    <img
                        src={images[lightboxIndex].url}
                        alt={images[lightboxIndex].meta.alt || 'Image'}
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Counter */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60 font-medium bg-black/40 px-3 py-1 rounded-full">
                            {lightboxIndex + 1} / {images.length}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
