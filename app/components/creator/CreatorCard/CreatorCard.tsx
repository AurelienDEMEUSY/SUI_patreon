'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { CreatorCardProps } from '@/types';

export function CreatorCard({ creator, showStats = true, className = '' }: CreatorCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <Link href={`/creator/${creator.address}`}>
      <div className={`glass-card p-5 cursor-pointer group ${className}`}>
        <div className="flex items-start gap-4">
          <Avatar size="lg" src={creator.avatarBlobId} alt={creator.name} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-white font-bold text-base truncate group-hover:text-[#3c3cf6] transition-colors">
                {creator.name}
              </h3>
              {creator.suinsName && (
                <Badge variant="primary" size="sm">
                  {creator.suinsName}
                </Badge>
              )}
            </div>

            <p className="text-gray-400 text-sm line-clamp-2 mb-3">
              {creator.bio}
            </p>

            {showStats && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="material-symbols-outlined text-base">group</span>
                  <span className="font-medium">{formatNumber(creator.totalSubscribers)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="material-symbols-outlined text-base">video_library</span>
                  <span className="font-medium">{creator.totalContent}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
