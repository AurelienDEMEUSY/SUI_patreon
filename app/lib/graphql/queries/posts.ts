import { graphql } from '@mysten/sui/graphql/schema';
import { getGraphQLClient } from '../client';
import { PACKAGE_ID } from '@/lib/contract-constants';

// ============================================================
// Query: Get a single Service object (for posts)
// ============================================================

/**
 * Fetch a Service object by ID — used to get posts array.
 *
 * This is the same as queryCreatorByObjectId but can be used
 * independently for the posts use case.
 *
 * Note: Posts are stored inside the Service object as a vector,
 * so we always get all posts when we fetch the Service.
 * Pagination happens client-side unless we migrate to a
 * custom indexer (Phase 6).
 */
const SERVICE_OBJECT_QUERY = graphql(`
    query getServiceObject($objectId: SuiAddress!) {
        object(address: $objectId) {
            address
            asMoveObject {
                contents {
                    json
                }
            }
        }
    }
`);

export async function queryServiceObject(serviceObjectId: string) {
    const client = getGraphQLClient();
    return client.query({
        query: SERVICE_OBJECT_QUERY,
        variables: { objectId: serviceObjectId },
    });
}

// ============================================================
// Query: PostPublished events (for cross-creator feeds)
// ============================================================

/**
 * Fetches PostPublished events across all creators.
 *
 * Useful for building a global feed — query recent PostPublished events,
 * then batch-fetch the corresponding Service objects.
 *
 * Note: We use a variable for eventType because gql.tada (graphql())
 * requires static template strings — template interpolation is not supported.
 */
const POST_PUBLISHED_EVENTS_QUERY = graphql(`
    query getPostPublishedEvents($eventType: String!, $first: Int, $after: String) {
        events(
            first: $first
            after: $after
            filter: {
                eventType: $eventType
            }
        ) {
            nodes {
                json
                timestamp
                sender {
                    address
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
`);

export async function queryPostPublishedEvents(first: number = 20, after?: string) {
    const client = getGraphQLClient();
    const eventType = `${PACKAGE_ID}::service::PostPublished`;

    return client.query({
        query: POST_PUBLISHED_EVENTS_QUERY,
        variables: {
            eventType,
            first,
            after: after ?? null,
        },
    });
}
