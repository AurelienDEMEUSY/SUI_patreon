import type { Creator } from '@/types';

export interface CreatorHubSidebarProps {
    creator: Creator;
    serviceObjectId: string | null;
    onAboutClick: () => void;
}
