'use client';

import Link from 'next/link';
import type { TrendingCreatorCardProps } from './TrendingCreatorCard.types';

export function TrendingCreatorCard({ creator }: TrendingCreatorCardProps) {
  return (
    <Link
      href={`/creator/${creator.address}`}
      className="w-[160px] shrink-0 flex flex-col rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden group snap-center"
    >
      <div className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center p-4 transition-transform duration-300 ease-out group-hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/image.png"
          alt=""
          className="w-full h-full object-contain"
        />
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
