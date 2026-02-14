'use client';

import { useMemo } from 'react';
import { useAllCreators } from '@/hooks/useAllCreators';
import { useLatestPosts } from '@/hooks/useLatestPosts';
import type { Creator } from '@/types';
import type { LatestPostItem } from '@/hooks/useLatestPosts';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function matchQuery(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return normalize(text).includes(normalize(query));
}

/**
 * Search hook: filters creators and public posts by a query string.
 * - Creators: match on name, bio
 * - Articles: match on title, creator name
 */
export function useSearch(query: string | null) {
  const { creators, isLoading: creatorsLoading, error: creatorsError } = useAllCreators();
  const { posts, isLoading: postsLoading, error: postsError } = useLatestPosts(50, false);

  const filtered = useMemo(() => {
    const q = (query ?? '').trim();
    if (!q) {
      return { creatorResults: creators, postResults: posts };
    }

    const creatorResults: Creator[] = creators.filter(
      (c) =>
        matchQuery(c.name, q) ||
        matchQuery(c.bio, q) ||
        matchQuery(c.suinsName, q)
    );

    const postResults: LatestPostItem[] = posts.filter(
      (p) =>
        matchQuery(p.title, q) ||
        matchQuery(p.creatorName, q)
    );

    return { creatorResults, postResults };
  }, [query, creators, posts]);

  const isLoading = creatorsLoading || postsLoading;
  const error = creatorsError ?? postsError ?? null;

  return {
    ...filtered,
    isLoading,
    error,
  };
}
