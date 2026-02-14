'use client';

import Link from 'next/link';
import { useCreatorBlobUrl } from '@/hooks/useCreatorBlobUrl';
import type { TrendingCreatorCardProps } from './TrendingCreatorCard.types';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop';

export function TrendingCreatorCard({ creator }: TrendingCreatorCardProps) {
  const { url: avatarUrl, isLoading: avatarLoading } = useCreatorBlobUrl(
    creator.avatarBlobId,
    creator.serviceObjectId ?? undefined
  );

  return (
    <Link
      href={`/creator/${creator.address}`}
      className="w-[160px] shrink-0 flex flex-col rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden group snap-center"
    >
      <div className="w-full aspect-square overflow-hidden bg-white/[0.04] flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105">
        {avatarLoading ? (
          <div className="w-full h-full bg-white/[0.06] animate-pulse" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl || DEFAULT_AVATAR}
            alt={creator.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-3 flex flex-col items-center justify-start">
        <h4 className="font-semibold text-sm truncate w-full text-left">{creator.name}</h4>
        <p className="text-[11px] text-white/50 truncate w-full text-left mt-0.5">
          {creator.totalContent} posts
        </p>
      </div>
    </Link>
  );
}
