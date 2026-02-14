'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';

/**
 * Hook to read the accumulated revenue balance from a creator's Service object.
 * The revenue field is a Balance<SUI> stored on-chain.
 */
export function useCreatorRevenue(serviceObjectId: string | null) {
    const [revenueMist, setRevenueMist] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const suiClient = useSuiClient();

    const fetchRevenue = useCallback(async () => {
        if (!serviceObjectId) {
            setRevenueMist(0);
            return;
        }

        setIsLoading(true);
        try {
            const serviceObject = await suiClient.getObject({
                id: serviceObjectId,
                options: { showContent: true },
            });

            if (serviceObject.data?.content?.dataType === 'moveObject') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fields = (serviceObject.data.content as any).fields;
                // Balance<SUI> is stored as { fields: { value: "123" } } or just a number
                const revenueValue = fields?.revenue?.fields?.value
                    ?? fields?.revenue?.value
                    ?? fields?.revenue
                    ?? 0;
                setRevenueMist(Number(revenueValue));
            }
        } catch (err) {
            console.error('[useCreatorRevenue] fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [serviceObjectId, suiClient]);

    useEffect(() => {
        fetchRevenue();
    }, [fetchRevenue]);

    return { revenueMist, isLoading, refetch: fetchRevenue };
}
