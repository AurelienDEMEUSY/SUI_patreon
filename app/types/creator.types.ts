export interface Creator {
  address: string;
  name: string;
  bio: string;
  avatarBlobId: string | null;
  bannerBlobId: string | null;
  suinsName: string | null;
  totalSubscribers: number;
  totalContent: number;
  tiers: Tier[];
  createdAt: number;
  serviceObjectId?: string;
}

export interface Tier {
  id: string;
  creatorAddress: string;
  name: string;
  description: string;
  priceInMist: number;
  sealPolicyId: string;
  benefits: string[];
  subscriberCount: number;
  order: number;
}

export interface CreatorCardProps {
  creator: Creator;
  showStats?: boolean;
  className?: string;
}

export interface CreatorHeaderProps {
  creator: Creator;
  className?: string;
}
