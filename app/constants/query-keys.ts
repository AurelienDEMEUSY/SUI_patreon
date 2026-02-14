/**
 * Centralized React Query key factory.
 * Every query & mutation must reference keys from here
 * so invalidation is always consistent.
 */
export const queryKeys = {
    // ── Creator ──
    creator: (address: string) => ['creator', address] as const,
    allCreators: () => ['allCreators'] as const,

    // ── Posts ──
    creatorPosts: (serviceObjectId: string) => ['creatorPosts', serviceObjectId] as const,
    latestPosts: (limit: number, publicOnly: boolean) => ['latestPosts', limit, publicOnly] as const,
    latestPost: () => ['latestPost'] as const,

    // ── Subscriptions ──
    subscriptionStatus: (serviceObjectId: string, address: string) =>
        ['subscriptionStatus', serviceObjectId, address] as const,
    mySubscriptions: (address: string) => ['mySubscriptions', address] as const,

    // ── Revenue ──
    creatorRevenue: (serviceObjectId: string) => ['creatorRevenue', serviceObjectId] as const,
} as const;
