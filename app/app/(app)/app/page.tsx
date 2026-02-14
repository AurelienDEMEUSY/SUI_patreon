'use client';

import { useAllCreators } from '@/hooks/useAllCreators';
import { useLatestPost } from '@/hooks/useLatestPost';
import { PageContainer } from '@/components/layout/PageContainer';
import { FeaturedPostBanner } from '@/components/creator/FeaturedPostBanner';
import { TrendingCreatorsSection } from '@/components/creator/TrendingCreatorsSection';
import { LatestArticlesGrid } from '@/components/content/LatestArticlesGrid';

export default function AppPage() {
  const { creators, isLoading, error } = useAllCreators();
  const { post, isLoading: isBannerLoading, error: bannerError } = useLatestPost();

  return (
    <PageContainer>
      <FeaturedPostBanner post={post} isLoading={isBannerLoading} error={bannerError} />
      <TrendingCreatorsSection creators={creators} isLoading={isLoading} error={error} />
      <div className="mt-10">
        <LatestArticlesGrid limit={12} />
      </div>
    </PageContainer>
  );
}
