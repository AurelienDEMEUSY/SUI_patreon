'use client';

import Link from 'next/link';
import { format } from '@/lib/format';
import type { TrendingCreatorCardProps } from './TrendingCreatorCard.types';

export function TrendingCreatorCard({ creator }: TrendingCreatorCardProps) {
  return (
    <Link
      href={`/creator/${creator.address}`}
      className="w-[160px] shrink-0 flex flex-col rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden group snap-center"
    >
      <div className="w-full aspect-square overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-[#3c3cf6]/25 via-purple-600/15 to-pink-500/10 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110">
          <span className="text-4xl font-black text-white/20 select-none">
            {creator.name.charAt(0)}
          </span>
        </div>
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
