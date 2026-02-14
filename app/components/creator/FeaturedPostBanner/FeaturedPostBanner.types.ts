import type { LatestPost } from '@/hooks/useLatestPost';

export interface FeaturedPostBannerProps {
    post: LatestPost | null;
    isLoading: boolean;
    error: string | null;
}
