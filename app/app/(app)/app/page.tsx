'use client';

import { useAllCreators } from '@/hooks/useAllCreators';
import { PageContainer } from '@/components/layout/PageContainer';
import { TrendingCreatorsSection } from '@/components/creator/TrendingCreatorsSection';

export default function AppPage() {
  const { creators, isLoading, error } = useAllCreators();

  return (
    <PageContainer>
      <TrendingCreatorsSection creators={creators} isLoading={isLoading} error={error} />
    </PageContainer>
  );
}
