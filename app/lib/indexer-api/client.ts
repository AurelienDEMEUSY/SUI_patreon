/**
 * Indexer REST API client.
 * Used when INDEXER_API_URL is set — avoids GraphQL calls for indexed data.
 */

import { INDEXER_API_URL } from '@/lib/contract-constants';
import { getWalrusImageUrl } from '@/lib/walrus';
import type { Creator } from '@/types';
import type { OnChainPost } from '@/types/post.types';

// ============================================================
// API response types (snake_case from indexer)
// ============================================================

interface CreatorRow {
    service_object_id: string;
    creator_address: string;
    name: string;
    description: string;
    avatar_blob_id: string | null;
    suins_name: string | null;
    total_subscribers: number;
    total_posts: number;
}

interface PostRow {
    postId: number;
    title: string;
    metadataBlobId: string | null;
    dataBlobId: string | null;
    requiredTier: number;
    createdAtMs: number;
}

/** Subscription row from indexer (camelCase) */
export interface IndexerSubscriptionRow {
    subscriberAddress: string;
    serviceObjectId: string;
    tierLevel: number;
    expiresAtMs: number;
}


interface SubscriptionCheckResponse {
    tierLevel: number;
    expiresAtMs: number;
}

// ============================================================
// Helpers
// ============================================================

function baseUrl(): string {
    const url = INDEXER_API_URL;
    if (!url) throw new Error('INDEXER_API_URL is not configured');
    return url.replace(/\/$/, '');
}

function mapCreatorRowToCreator(row: CreatorRow): Creator {
    return {
        address: row.creator_address,
        name: row.name,
        bio: row.description,
        avatarBlobId: row.avatar_blob_id ? getWalrusImageUrl(row.avatar_blob_id) : null,
        bannerBlobId: null,
        suinsName: row.suins_name ?? null,
        totalSubscribers: row.total_subscribers,
        totalContent: row.total_posts,
        tiers: [],
        createdAt: Math.floor(Date.now() / 1000),
        serviceObjectId: row.service_object_id,
    };
}

function mapPostRowToOnChainPost(row: PostRow, serviceObjectId: string): OnChainPost {
    return {
        postId: row.postId,
        title: row.title,
        metadataBlobId: row.metadataBlobId ?? '',
        dataBlobId: row.dataBlobId ?? '',
        requiredTier: row.requiredTier,
        createdAtMs: row.createdAtMs,
    };
}

// ============================================================
// API functions
// ============================================================

/**
 * Fetch all creators from the indexer.
 */
export async function getCreators(creatorAddress?: string): Promise<Creator[]> {
    const url = creatorAddress
        ? `${baseUrl()}/creators?creator_address=${encodeURIComponent(creatorAddress)}`
        : `${baseUrl()}/creators`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Indexer API error: ${res.status} ${res.statusText}`);
    const rows: CreatorRow[] = await res.json();
    return rows.map(mapCreatorRowToCreator);
}

/**
 * Fetch a single creator by service_object_id.
 */
export async function getCreator(serviceObjectId: string): Promise<Creator | null> {
    const res = await fetch(`${baseUrl()}/creators/${encodeURIComponent(serviceObjectId)}`);
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Indexer API error: ${res.status} ${res.statusText}`);
    }
    const row: CreatorRow | null = await res.json();
    return row ? mapCreatorRowToCreator(row) : null;
}

/**
 * Fetch posts for a creator (by service_object_id).
 */
export async function getCreatorPosts(serviceObjectId: string): Promise<OnChainPost[]> {
    const res = await fetch(
        `${baseUrl()}/creators/${encodeURIComponent(serviceObjectId)}/posts`,
    );
    if (!res.ok) throw new Error(`Indexer API error: ${res.status} ${res.statusText}`);
    const rows: PostRow[] = await res.json();
    return rows.map((r) => mapPostRowToOnChainPost(r, serviceObjectId));
}

/**
 * Fetch subscriptions for a subscriber.
 */
export async function getMySubscriptions(
    subscriberAddress: string,
): Promise<IndexerSubscriptionRow[]> {
    const res = await fetch(
        `${baseUrl()}/subscriptions?subscriber=${encodeURIComponent(subscriberAddress)}`,
    );
    if (!res.ok) throw new Error(`Indexer API error: ${res.status} ${res.statusText}`);
    return res.json();
}

/**
 * Check subscription status for a subscriber + service.
 */
export async function getSubscriptionStatus(
    subscriberAddress: string,
    serviceObjectId: string,
): Promise<SubscriptionCheckResponse | null> {
    const url = `${baseUrl()}/subscriptions/check?subscriber=${encodeURIComponent(subscriberAddress)}&service_id=${encodeURIComponent(serviceObjectId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Indexer API error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data;
}
