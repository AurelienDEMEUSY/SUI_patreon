// Barrel export all shared types
export * from './creator.types';
export * from './common.types';
export * from './landing.types';
export * from './navigation.types';

// Re-export from ui.types only what doesn't conflict with common.types
export type { AvatarProps, BadgeProps } from './ui.types';

// Types that don't have a dedicated file yet
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

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
