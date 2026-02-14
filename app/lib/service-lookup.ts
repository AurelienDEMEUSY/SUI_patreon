import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { PACKAGE_ID } from './contract-constants';

type CreatorEvent = { creator?: string };
type SuiClient = SuiJsonRpcClient;

/**
 * Queries CreatorRegistered and CreatorDeleted events for a given address,
 * and returns the still-active Service object ID (if any).
 *
 * Returns `null` if the creator never registered or has since deleted their profile.
 */
export async function findActiveServiceId(
    suiClient: SuiClient,
    address: string,
): Promise<string | null> {
    const [registeredEvents, deletedEvents] = await Promise.all([
        suiClient.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::service::CreatorRegistered` },
            limit: 50,
        }),
        suiClient.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::service::CreatorDeleted` },
            limit: 50,
        }),
    ]);

    const myRegistrations = registeredEvents.data.filter(
        (e: { parsedJson: unknown }) => (e.parsedJson as CreatorEvent)?.creator === address,
    );
    const myDeletions = deletedEvents.data.filter(
        (e: { parsedJson: unknown }) => (e.parsedJson as CreatorEvent)?.creator === address,
    );

    // If deletions >= registrations, no active profile exists
    if (myRegistrations.length > 0 && myDeletions.length >= myRegistrations.length) {
        return null;
    }

    // Walk through registrations and find one whose Service object still exists
    for (const event of myRegistrations) {
        const txDetails = await suiClient.getTransactionBlock({
            digest: event.id.txDigest,
            options: { showObjectChanges: true },
        });

        const created = txDetails.objectChanges?.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => c.type === 'created' && c.objectType?.includes('::service::Service'),
        );

        if (created && 'objectId' in created) {
            const obj = await suiClient.getObject({
                id: created.objectId,
                options: { showContent: true },
            });

            if (obj.data?.content) {
                return created.objectId;
            }
        }
    }

    return null;
}

/**
 * Returns a Map of creator addresses whose profile has been deleted,
 * keyed by address with the deletion count as value.
 *
 * Used by `useAllCreators` to filter out deleted creators from the list.
 */
export async function getDeletedCreatorCounts(
    suiClient: SuiClient,
): Promise<{ deletionCounts: Map<string, number>; registrationCounts: Map<string, number> }> {
    const [registeredEvents, deletedEvents] = await Promise.all([
        suiClient.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::service::CreatorRegistered` },
            limit: 50,
        }),
        suiClient.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::service::CreatorDeleted` },
            limit: 50,
        }),
    ]);

    const registrationCounts = new Map<string, number>();
    for (const event of registeredEvents.data) {
        const addr = (event.parsedJson as CreatorEvent)?.creator;
        if (addr) registrationCounts.set(addr, (registrationCounts.get(addr) || 0) + 1);
    }

    const deletionCounts = new Map<string, number>();
    for (const event of deletedEvents.data) {
        const addr = (event.parsedJson as CreatorEvent)?.creator;
        if (addr) deletionCounts.set(addr, (deletionCounts.get(addr) || 0) + 1);
    }

    return { deletionCounts, registrationCounts };
}

/**
 * Returns true if the creator at `address` has been deleted
 * (i.e. deletion count >= registration count).
 */
export function isCreatorDeleted(
    address: string,
    registrationCounts: Map<string, number>,
    deletionCounts: Map<string, number>,
): boolean {
    const regCount = registrationCounts.get(address) || 0;
    const delCount = deletionCounts.get(address) || 0;
    return regCount > 0 && delCount >= regCount;
}
