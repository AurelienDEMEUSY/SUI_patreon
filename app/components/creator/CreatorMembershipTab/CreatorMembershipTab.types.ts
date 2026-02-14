import type { Tier } from '@/types';

export interface CreatorMembershipTabProps {
    tiers: Tier[];
    serviceObjectId: string | null;
    onAddTier: () => void;
}
