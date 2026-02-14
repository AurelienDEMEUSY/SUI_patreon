'use client';

import { useLatestPosts } from '@/hooks/useLatestPosts';
import { ArticleCard } from '../ArticleCard';
import { ArticleCardSkeleton } from './ArticleCardSkeleton';
import type { LatestArticlesGridProps } from './LatestArticlesGrid.types';

const SKELETON_COUNT = 6;

export function LatestArticlesGrid({ limit = 12 }: LatestArticlesGridProps) {
    const { posts, isLoading, error } = useLatestPosts(limit);

    return (
        <section>
            <h3 className="text-lg font-semibold text-white/90 mb-4">Public articles</h3>

            {error && (
                <p className="text-sm text-red-400/90 py-4">
                    Impossible de charger les articles. Réessaie plus tard.
                </p>
            )}

            {isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <ArticleCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {!isLoading && !error && posts.length === 0 && (
                <p className="text-sm text-white/50 py-6">Aucun article pour le moment.</p>
            )}

            {!isLoading && !error && posts.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {posts.map((post) => (
                        <ArticleCard
                            key={`${post.creatorAddress}-${post.postId}`}
                            post={post}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
