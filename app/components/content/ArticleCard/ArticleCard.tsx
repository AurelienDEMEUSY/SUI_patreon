'use client';

import Link from 'next/link';
import type { ArticleCardProps } from './ArticleCard.types';

const DEFAULT_IMAGE = '/image.png';
const DESCRIPTION_MAX_LENGTH = 80;

function truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen).trimEnd().replace(/\s+\S*$/, '') + '…';
}

export function ArticleCard({ post, description }: ArticleCardProps) {
    const href = `/creator/${post.creatorAddress}`;
    const shortDesc = description != null && description.length > 0
        ? truncate(description, DESCRIPTION_MAX_LENGTH)
        : `Par ${post.creatorName}`;

    return (
        <Link
            href={href}
            className="group flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
        >
            <div className="aspect-[4/3] w-full overflow-hidden bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={DEFAULT_IMAGE}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
            </div>
            <div className="p-4 flex flex-col gap-1.5">
                <h3 className="font-semibold text-white text-sm md:text-base line-clamp-2 group-hover:text-white/95">
                    {post.title || 'Sans titre'}
                </h3>
                <p className="text-xs text-white/50 line-clamp-2">
                    {shortDesc}
                </p>
            </div>
        </Link>
    );
}
