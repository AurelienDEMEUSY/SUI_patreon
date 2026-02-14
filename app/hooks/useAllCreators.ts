'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { INDEXER_API_URL } from '@/lib/contract-constants';
import { getCreators } from '@/lib/indexer-api';
import { queryAllCreators } from '@/lib/graphql/queries/creators';
import { parseServiceToCreator } from '@/lib/graphql/parsers';
import type { ServiceJson } from '@/lib/graphql/parsers';
import type { Creator } from '@/types';

/**
 * Fetches ALL active creators registered on the platform.
 * Uses indexer API when INDEXER_API_URL is set, otherwise GraphQL.
 *
 * Uses React Query for caching and deduplication.
 * Stale time: 30s — creators list doesn't change frequently.
 */
export function useAllCreators() {
    const { data: creators = [], isLoading, error } = useQuery({
        queryKey: ['allCreators'],
        queryFn: async (): Promise<Creator[]> => {
            if (INDEXER_API_URL) {
                console.log('[useAllCreators] Using indexer API');
                return getCreators();
            }
            console.log('[useAllCreators] Using GraphQL');
            const result = await queryAllCreators(50);
            const nodes = result.data?.objects?.nodes ?? [];

            return nodes
                .filter((n) => n.asMoveObject?.contents?.json)
                .map((n) =>
                    parseServiceToCreator(
                        n.address,
                        n.asMoveObject!.contents!.json as ServiceJson,
                    ),
                );
        },
        staleTime: 30_000,
        gcTime: 5 * 60_000,
    });

    return {
        creators,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch creators') : null,
    };
}

// ============================================================
// Paginated variant — infinite scroll for Explore page
// ============================================================

/**
 * Infinite-scroll variant of useAllCreators.
 * Uses cursor-based pagination from GraphQL when not using indexer.
 * With indexer: loads all creators (no server pagination yet).
 */
export function useAllCreatorsPaginated() {
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['allCreators', 'paginated'],
        queryFn: async ({ pageParam }) => {
            if (INDEXER_API_URL) {
                console.log('[useAllCreatorsPaginated] Using indexer API');
                const creators = await getCreators();
                return {
                    creators,
                    nextCursor: undefined as string | undefined,
                };
            }
            console.log('[useAllCreatorsPaginated] Using GraphQL');
            const result = await queryAllCreators(20, pageParam);
            const nodes = result.data?.objects?.nodes ?? [];
            const pageInfo = result.data?.objects?.pageInfo;

            return {
                creators: nodes
                    .filter((n) => n.asMoveObject?.contents?.json)
                    .map((n) =>
                        parseServiceToCreator(
                            n.address,
                            n.asMoveObject!.contents!.json as ServiceJson,
                        ),
                    ),
                nextCursor: pageInfo?.hasNextPage ? pageInfo.endCursor : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined as string | undefined,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
    });

    // Flatten all pages into a single creators array
    const creators = data?.pages.flatMap((p) => p.creators) ?? [];

    return {
        creators,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Failed to fetch creators') : null,
        fetchNextPage,
        hasNextPage: hasNextPage ?? false,
        isFetchingNextPage,
    };
}
