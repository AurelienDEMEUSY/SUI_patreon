import type { SuiClient } from '@mysten/sui/client';

/** Optional pre-fetched Service object fields (to avoid a second getObject). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceFields = Record<string, any>;

/**
 * Returns the number of subscribers (length of the Seal whitelist / subscribers Table)
 * for a given Service object.
 *
 * The on-chain Service has a `subscribers: Table<address, Subscription>` used by Seal
 * for access control. This function reads its size either from the Table's `size` field
 * or by counting dynamic fields.
 *
 * @param existingFields - If you already have the Service object fields (e.g. from getObject),
 *   pass them here to avoid an extra RPC call.
 */
export async function getSubscriberCount(
    suiClient: SuiClient,
    serviceObjectId: string,
    existingFields?: ServiceFields | null,
): Promise<number> {
    let fields: ServiceFields | undefined = existingFields;

    if (fields === undefined || fields === null) {
        const serviceObj = await suiClient.getObject({
            id: serviceObjectId,
            options: { showContent: true },
        });

        if (serviceObj.data?.content?.dataType !== 'moveObject') {
            return 0;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fields = (serviceObj.data.content as any).fields;
    }

    const subscribers = fields?.subscribers;

    if (!subscribers) return 0;

    // Table has a `size` field (sui::table::Table)
    const size = subscribers?.fields?.size;
    if (typeof size === 'number' && Number.isInteger(size) && size >= 0) {
        return size;
    }
    if (typeof size === 'string') {
        const n = Number(size);
        if (!Number.isNaN(n) && n >= 0) return Math.floor(n);
    }

    // Fallback: count dynamic fields of the subscribers Table
    const subscribersTableId = subscribers?.fields?.id?.id;
    if (!subscribersTableId) return 0;

    const dynamicFields = await suiClient.getDynamicFields({
        parentId: subscribersTableId,
    });

    return dynamicFields.data.length;
}
