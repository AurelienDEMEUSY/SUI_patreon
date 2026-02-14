import type { OnChainPost } from '@/types/post.types';

export interface CreatorPostsTabProps {
    posts: OnChainPost[];
    serviceObjectId: string;
    isLoading?: boolean;
    onCreatePost: () => void;
}
