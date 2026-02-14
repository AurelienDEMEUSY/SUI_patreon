import { graphql } from '@mysten/sui/graphql/schema';
import { getGraphQLClient } from '../client';
import { PACKAGE_ID } from '@/lib/contract-constants';

// ============================================================
// Query: SubscriptionPurchased events for a specific subscriber
// ============================================================

/**
 * Find all SubscriptionPurchased events sent by a specific address.
 *
 * This replaces the queryEvents + manual filter in useMySubscriptions.
 */
const SUBSCRIPTION_EVENTS_QUERY = graphql(`
    query getSubscriptionEvents(
        $eventType: String!
        $senderAddress: SuiAddress
        $first: Int
        $after: String
    ) {
        events(
            first: $first
            after: $after
            filter: {
                eventType: $eventType
                sender: $senderAddress
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

export async function querySubscriptionPurchasedEvents(
    senderAddress?: string,
    first: number = 50,
    after?: string,
) {
    const client = getGraphQLClient();
    return client.query({
        query: SUBSCRIPTION_EVENTS_QUERY,
        variables: {
            eventType: `${PACKAGE_ID}::subscription::SubscriptionPurchased`,
            senderAddress: senderAddress ?? null,
            first,
            after: after ?? null,
        },
    });
}

export async function querySubscriptionRenewedEvents(
    senderAddress?: string,
    first: number = 50,
    after?: string,
) {
    const client = getGraphQLClient();
    return client.query({
        query: SUBSCRIPTION_EVENTS_QUERY,
        variables: {
            eventType: `${PACKAGE_ID}::subscription::SubscriptionRenewed`,
            senderAddress: senderAddress ?? null,
            first,
            after: after ?? null,
        },
    });
}

// ============================================================
// Query: Check subscription via dynamic field
// ============================================================

/**
 * Check if a specific address has an active subscription
 * in a creator's Service subscribers Table.
 *
 * Uses dynamic field lookup on the Table object via DynamicFieldName input.
 */
const SUBSCRIPTION_STATUS_QUERY = graphql(`
    query getSubscriptionStatus(
        $subscribersTableId: SuiAddress!
        $fieldName: DynamicFieldName!
    ) {
        object(address: $subscribersTableId) {
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

export async function querySubscriptionStatus(
    subscribersTableId: string,
    subscriberAddress: string,
) {
    const client = getGraphQLClient();
    return client.query({
        query: SUBSCRIPTION_STATUS_QUERY,
        variables: {
            subscribersTableId,
            fieldName: {
                type: 'address',
                bcs: subscriberAddress,
            },
        },
    });
}

// ============================================================
// Query: Batch fetch multiple Service objects (for subscribed creators)
// ============================================================

/**
 * Batch fetch multiple objects by their IDs.
 *
 * This replaces: suiClient.multiGetObjects({ ids, options: { showContent: true } })
 *
 * Note: GraphQL doesn't have a native "multiGet" — we use objectConnection
 * filtered by a list of IDs, or make parallel queries.
 */
const MULTI_OBJECTS_QUERY = graphql(`
    query getMultipleObjects($ids: [SuiAddress!]!) {
        objects(filter: { objectIds: $ids }) {
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
        }
    }
`);

export async function queryMultipleObjects(objectIds: string[]) {
    const client = getGraphQLClient();
    return client.query({
        query: MULTI_OBJECTS_QUERY,
        variables: { ids: objectIds },
    });
}
