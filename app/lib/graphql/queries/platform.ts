import { graphql } from '@mysten/sui/graphql/schema';
import { getGraphQLClient } from '../client';
import { PLATFORM_ID } from '@/lib/contract-constants';

// ============================================================
// Query: Platform Stats
// ============================================================

/**
 * Fetches the shared Platform object containing global stats.
 *
 * The Platform object is created during contract initialization
 * and stores aggregate data (total creators, total subscriptions, etc.).
 */
const PLATFORM_STATS_QUERY = graphql(`
    query getPlatformStats($platformId: SuiAddress!) {
        object(address: $platformId) {
            asMoveObject {
                contents {
                    json
                }
            }
        }
    }
`);

export async function queryPlatformStats() {
    const client = getGraphQLClient();
    return client.query({
        query: PLATFORM_STATS_QUERY,
        variables: { platformId: PLATFORM_ID },
    });
}
