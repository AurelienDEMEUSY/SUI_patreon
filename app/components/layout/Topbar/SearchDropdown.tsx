'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { usePostContent } from '@/hooks/usePostContent';
import { Avatar } from '@/components/ui/Avatar';
import type { Creator } from '@/types';
import type { LatestPostItem } from '@/hooks/useLatestPosts';

const MAX_CREATORS = 5;
const MAX_ARTICLES = 5;

interface SearchDropdownProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectItem?: () => void;
}

function CreatorRow({ creator, onClick }: { creator: Creator; onClick?: () => void }) {
  return (
    <Link
      href={`/creator/${creator.address}`}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left"
    >
      <Avatar size="sm" src={creator.avatarBlobId} alt={creator.name} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">{creator.name}</p>
        <p className="text-xs text-white/50 truncate">{creator.bio || 'Créateur'}</p>
      </div>
    </Link>
  );
}

/**
 * Affiche un article si l'utilisateur y a accès : public (requiredTier === 0)
 * ou déverrouillé après signature (abo actif).
 */
function ArticleRow({ post, onClick }: { post: LatestPostItem; onClick?: () => void }) {
  const { isUnlocked, unlock } = usePostContent(
    post.serviceObjectId,
    post.onChainPost
  );
  const isPublic = post.onChainPost.requiredTier === 0;
  const hasAccess = isPublic || isUnlocked;

  useEffect(() => {
    if (!isPublic && !isUnlocked) {
      unlock();
    }
  }, [isPublic, isUnlocked, unlock]);

  if (!hasAccess) return null;

  return (
    <Link
      href={`/creator/${post.creatorAddress}`}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">{post.title || 'Sans titre'}</p>
        <p className="text-xs text-white/50 truncate">Par {post.creatorName}</p>
      </div>
    </Link>
  );
}

function CreatorSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-3.5 w-24 rounded bg-white/10" />
        <div className="h-3 w-32 rounded bg-white/5" />
      </div>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
      <div className="flex-1 space-y-1">
        <div className="h-3.5 w-28 rounded bg-white/10" />
        <div className="h-3 w-20 rounded bg-white/5" />
      </div>
    </div>
  );
}

export function SearchDropdown({ query, isOpen, onClose, onSelectItem }: SearchDropdownProps) {
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const { creatorResults, postResults, isLoading, error } = useSearch(hasQuery ? trimmed : null);

  const showCreators = hasQuery && (creatorResults.length > 0 || isLoading);
  const showArticles = hasQuery && (postResults.length > 0 || isLoading);
  const showEmpty = hasQuery && !isLoading && creatorResults.length === 0 && postResults.length === 0;
  const showHint = !hasQuery;

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-[#0f0f1a]/95 backdrop-blur-xl shadow-xl z-50 overflow-hidden max-h-[min(70vh,400px)] flex flex-col">
      <div className="overflow-y-auto custom-scrollbar p-2">
        {showHint && (
          <p className="px-3 py-4 text-sm text-white/40 text-center">
            Tapez pour rechercher un créateur ou un article…
          </p>
        )}

        {error && (
          <p className="px-3 py-4 text-sm text-red-400/90 text-center">
            Impossible de charger les résultats.
          </p>
        )}

        {showEmpty && !error && (
          <p className="px-3 py-4 text-sm text-white/50 text-center">
            Aucun créateur ni article trouvé.
          </p>
        )}

        {showCreators && (
          <section className="mb-2">
            <p className="px-3 py-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#3c3cf6] text-sm">person</span>
              Créateurs
            </p>
            {isLoading ? (
              <div className="space-y-0.5">
                {Array.from({ length: 3 }, (_, i) => (
                  <CreatorSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-0.5">
                {creatorResults.slice(0, MAX_CREATORS).map((creator) => (
                  <CreatorRow
                    key={creator.address}
                    creator={creator}
                    onClick={onSelectItem}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {showArticles && (
          <section>
            <p className="px-3 py-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#3c3cf6] text-sm">article</span>
              Articles
            </p>
            {isLoading ? (
              <div className="space-y-0.5">
                {Array.from({ length: 3 }, (_, i) => (
                  <ArticleSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-0.5">
                {postResults.slice(0, MAX_ARTICLES).map((post) => (
                  <ArticleRow
                    key={`${post.creatorAddress}-${post.postId}`}
                    post={post}
                    onClick={onSelectItem}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
