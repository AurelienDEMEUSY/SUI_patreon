import { graphql } from '@mysten/sui/graphql/schema';
import { getGraphQLClient } from '../client';
import { PACKAGE_ID } from '@/lib/contract-constants';

// ============================================================
// Query: Get all creator Service objects
// ============================================================

/**
 * Fetches all Service objects (creators) from the package.
 *
 * Uses the `objects` query filtered by the Service type.
 * This replaces the entire useAllCreators flow:
 *   queryEvents(CreatorRegistered) → getTransactionBlock → multiGetObjects
 *
 * Now: 1 single query.
 */
const ALL_CREATORS_QUERY = graphql(`
    query getAllCreators($serviceType: String!, $first: Int, $after: String) {
        objects(
            first: $first
            after: $after
            filter: {
                type: $serviceType
            }
        ) {
            nodes {
                address
                asMoveObject {
                    contents {
                        json
                        type {
                            repr
                        }
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
`);

export async function queryAllCreators(first: number = 50, after?: string) {
    const client = getGraphQLClient();
    const serviceType = `${PACKAGE_ID}::service::Service`;

    return client.query({
        query: ALL_CREATORS_QUERY,
        variables: {
            serviceType,
            first,
            after: after ?? null,
        },
    });
}

// ============================================================
// Query: Get a single creator by Service object ID
// ============================================================

/**
 * Fetches a single Service object by its object ID.
 *
 * This replaces: getObject({ id, options: { showContent: true } })
 */
const CREATOR_BY_OBJECT_ID_QUERY = graphql(`
    query getCreatorByObjectId($objectId: SuiAddress!) {
        object(address: $objectId) {
            address
            asMoveObject {
                contents {
                    json
                    type {
                        repr
                    }
                }
            }
        }
    }
`);

export async function queryCreatorByObjectId(objectId: string) {
    const client = getGraphQLClient();
    return client.query({
        query: CREATOR_BY_OBJECT_ID_QUERY,
        variables: { objectId },
    });
}

// ============================================================
// Query: Find creator Service ID via CreatorRegistered events
// ============================================================

/**
 * Queries CreatorRegistered events filtered by sender (creator address).
 *
 * This replaces: queryEvents({ MoveEventType: '...::CreatorRegistered' })
 *                + getTransactionBlock loop
 *
 * The GraphQL event query can return the transaction effects,
 * which include the created objects — no need for a second query.
 */
const CREATOR_EVENTS_QUERY = graphql(`
    query getCreatorEvents($eventType: String!, $first: Int, $after: String) {
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

export async function queryCreatorRegisteredEvents(first: number = 50, after?: string) {
    const client = getGraphQLClient();
    const eventType = `${PACKAGE_ID}::service::CreatorRegistered`;

    return client.query({
        query: CREATOR_EVENTS_QUERY,
        variables: {
            eventType,
            first,
            after: after ?? null,
        },
    });
}

export async function queryCreatorDeletedEvents(first: number = 50, after?: string) {
    const client = getGraphQLClient();
    const eventType = `${PACKAGE_ID}::service::CreatorDeleted`;

    return client.query({
        query: CREATOR_EVENTS_QUERY,
        variables: {
            eventType,
            first,
            after: after ?? null,
        },
    });
}

// ============================================================
// Query: Get creator's dynamic field (subscriber check)
// ============================================================

/**
 * Check if a user has a subscription entry in a Service's subscribers Table.
 *
 * This replaces: getDynamicFieldObject({ parentId, name: { type: 'address', value } })
 */
const DYNAMIC_FIELD_QUERY = graphql(`
    query getDynamicField($parentId: SuiAddress!, $fieldName: DynamicFieldName!) {
        object(address: $parentId) {
            dynamicField(name: $fieldName) {
                value {
                    ... on MoveValue {
                        json
                        type {
                            repr
                        }
                    }
                }
            }
        }
    }
`);

export async function querySubscriberDynamicField(
    subscribersTableId: string,
    subscriberAddress: string,
) {
    const client = getGraphQLClient();
    return client.query({
        query: DYNAMIC_FIELD_QUERY,
        variables: {
            parentId: subscribersTableId,
            fieldName: {
                type: 'address',
                bcs: subscriberAddress,
            },
        },
    });
}

// ============================================================
// Helper: Find active Service object ID for a creator address
// ============================================================

/**
 * GraphQL replacement for `findActiveServiceId` from service-lookup.ts.
 *
 * Queries all Service objects and finds the one owned by `creatorAddress`.
 * Since deleted objects don't appear in `objects(filter: { type })`,
 * no extra filtering is needed.
 *
 * @returns The Service object ID, or `null` if no profile exists.
 */
export async function findActiveServiceIdGraphQL(
    creatorAddress: string,
): Promise<string | null> {
    const result = await queryAllCreators(50);
    const nodes = result.data?.objects?.nodes ?? [];

    for (const node of nodes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = node.asMoveObject?.contents?.json as any;
        if (json?.creator === creatorAddress) {
            return node.address;
        }
    }

    return null;
}
