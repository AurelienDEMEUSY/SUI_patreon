// ============================================================
// GraphQL Layer — Barrel Export
// ============================================================

// Client
export { getGraphQLClient } from './client';

// Fragments
export { ServiceContentFragment } from './fragments/service';

// Queries — Creators
export {
    queryAllCreators,
    queryCreatorByObjectId,
    queryCreatorRegisteredEvents,
    queryCreatorDeletedEvents,
    querySubscriberDynamicField,
    findActiveServiceIdGraphQL,
} from './queries/creators';

// Queries — Posts
export {
    queryServiceObject,
    queryPostPublishedEvents,
} from './queries/posts';

// Queries — Subscriptions
export {
    querySubscriptionPurchasedEvents,
    querySubscriptionRenewedEvents,
    querySubscriptionStatus,
    queryMultipleObjects,
} from './queries/subscriptions';

// Queries — Platform
export { queryPlatformStats } from './queries/platform';

// Parsers
export {
    parseServiceToCreator,
    parseServicePosts,
    getSubscribersTableId,
    getNextPostIdFromJson,
} from './parsers';
export type { ServiceJson } from './parsers';
