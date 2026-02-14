import type { Creator } from '@/types';

export interface TrendingCreatorsSectionProps {
  creators: Creator[];
  isLoading: boolean;
  error: string | null;
}
