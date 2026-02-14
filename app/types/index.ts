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
    tierLevel: number;
    durationMs: number;
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
    isCreator?: boolean;
    onBecomeCreator?: () => void;
}

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface CreatorCardProps {
    creator: Creator;
    showStats?: boolean;
    className?: string;
}

export interface Feature {
    icon: string;
    title: string;
    description: string;
}

export interface Step {
    number: number;
    title: string;
    description: string;
    icon: string;
}

export interface Stat {
    label: string;
    value: string;
    suffix?: string;
}

export interface FooterLink {
    label: string;
    href: string;
    external?: boolean;
}

export interface FooterSection {
    title: string;
    links: FooterLink[];
}

export interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: string;
    requiresAuth?: boolean;
    badge?: number;
}

export interface SidebarItemProps {
    item: NavItem;
    isActive: boolean;
    onClick?: () => void;
}

export interface TopbarProps {
    className?: string;
}

export interface PageContainerProps {
    children: React.ReactNode;
    /**
     * Maximum width constraint
     * @default 'max-w-7xl'
     */
    maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
    /**
     * Remove horizontal padding (useful if child has custom padding)
     * @default false
     */
    noPadding?: boolean;
    /**
     * Additional Tailwind classes
     */
    className?: string;
}

export interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    fallbackIcon?: string;
}

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export interface CreatorHeaderProps {
    creator: Creator;
    serviceObjectId?: string | null;
    className?: string;
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type CardVariant = 'glass' | 'solid' | 'bordered';
export type BlurAmount = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'default' | 'primary' | 'success';
export type BadgeSize = 'sm' | 'md';
