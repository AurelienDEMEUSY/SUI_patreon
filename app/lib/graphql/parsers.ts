import type { Creator, Tier } from '@/types';
import type { OnChainPost } from '@/types/post.types';
import { getWalrusImageUrl } from '@/lib/walrus';

// ============================================================
// ServiceJson — Shape of a Service object from GraphQL `contents.json`
// ============================================================

/**
 * Common shape of a Service object from GraphQL `contents.json`.
 *
 * This is the JSON representation of the on-chain Move struct.
 * Unlike JSON-RPC which wraps fields in `{ fields: ... }`, GraphQL
 * `contents.json` returns a flat JSON structure.
 */
export interface ServiceJson {
    id: { id: string };
    creator: string;
    name: string;
    description: string;
    avatar_blob_id: string;
    tiers: Array<{
        tier_level: string;
        name: string;
        price: string;
        duration_ms: string;
    }>;
    posts: Array<{
        post_id: string;
        title: string;
        metadata_blob_id: string;
        data_blob_id: string;
        required_tier: string;
        created_at_ms: string;
    }>;
    next_post_id: string;
    subscribers: { id: { id: string } };
    revenue: string;
    suins_name: string | null;
}

// ============================================================
// Parsers — GraphQL responses → App types
// ============================================================

/**
 * Parse a GraphQL Service object node into our Creator type.
 *
 * @param objectAddress - The object's on-chain address (= serviceObjectId)
 * @param json - The `contents.json` field from the GraphQL response
 */
export function parseServiceToCreator(
    objectAddress: string,
    json: ServiceJson,
): Creator {
    const tiers: Tier[] = (json.tiers || []).map((t, index) => ({
        id: `${objectAddress}_tier_${t.tier_level}`,
        creatorAddress: json.creator,
        name: t.name || '',
        description: '',
        priceInMist: Number(t.price || 0),
        sealPolicyId: objectAddress,
        benefits: [],
        subscriberCount: 0,
        order: Number(t.tier_level || index + 1),
        tierLevel: Number(t.tier_level || index + 1),
        durationMs: Number(t.duration_ms || 0),
    }));

    return {
        address: json.creator,
        name: json.name || 'Creator',
        bio: json.description || '',
        avatarBlobId: json.avatar_blob_id
            ? getWalrusImageUrl(json.avatar_blob_id)
            : null,
        bannerBlobId: null,
        suinsName: json.suins_name ?? null,
        totalSubscribers: 0,
        totalContent: (json.posts || []).length,
        tiers,
        createdAt: Math.floor(Date.now() / 1000),
        serviceObjectId: objectAddress,
    };
}

/**
 * Parse a GraphQL Service object's posts into OnChainPost[].
 */
export function parseServicePosts(
    serviceObjectId: string,
    json: ServiceJson,
): OnChainPost[] {
    return (json.posts || []).map((p) => ({
        postId: Number(p.post_id),
        title: p.title,
        metadataBlobId: p.metadata_blob_id,
        dataBlobId: p.data_blob_id,
        requiredTier: Number(p.required_tier),
        createdAtMs: Number(p.created_at_ms),
    }));
}

/**
 * Extract the subscribers Table object ID from Service JSON.
 */
export function getSubscribersTableId(json: ServiceJson): string {
    return json.subscribers?.id?.id ?? '';
}

/**
 * Extract next_post_id from Service JSON.
 */
export function getNextPostIdFromJson(json: ServiceJson): number {
    return Number(json.next_post_id || 0);
}
