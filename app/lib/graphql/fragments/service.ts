import { graphql } from '@mysten/sui/graphql/schema';

/**
 * Fragment for the Service Move object fields.
 *
 * This maps to contract::service::Service on-chain.
 * Used by all creator-related queries.
 */
export const ServiceContentFragment = graphql(`
    fragment ServiceContent on MoveObject {
        address
        contents {
            json
            type {
                repr
            }
        }
    }
`);
