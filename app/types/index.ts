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

export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface Content {
    id: string;
    creatorAddress: string;
    title: string;
    description: string;
    contentType: ContentType;
    walrusBlobId: string;
    sealPolicyId: string;
    requiredTierId: string;
    isPublic: boolean;
    previewBlobId: string | null;
    createdAt: number;
    likesCount: number;
    commentsCount: number;
}

export interface Subscription {
    id: string;
    subscriberAddress: string;
    creatorAddress: string;
    tierId: string;
    startedAt: number;
    expiresAt: number;
    isActive: boolean;
    autoRenew: boolean;
}

export interface SidebarProps {
    className?: string;
}

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
