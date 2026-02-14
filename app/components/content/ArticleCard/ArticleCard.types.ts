import type { LatestPostItem } from '@/hooks/useLatestPosts';

export interface ArticleCardProps {
    post: LatestPostItem;
    /** Optional short description (e.g. excerpt). Falls back to "Par {creatorName}" if not provided. */
    description?: string;
}
