import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { SUI_GRAPHQL_URL, SUI_NETWORK } from '@/lib/contract-constants';

/**
 * Singleton SuiGraphQLClient for all GraphQL queries.
 *
 * Uses the SUI GraphQL RPC Beta endpoint.
 * All queries in the app must go through this client.
 */
let _client: SuiGraphQLClient | null = null;

export function getGraphQLClient(): SuiGraphQLClient {
    if (!_client) {
        _client = new SuiGraphQLClient({
            url: SUI_GRAPHQL_URL,
            network: SUI_NETWORK,
        });
    }
    return _client;
}
