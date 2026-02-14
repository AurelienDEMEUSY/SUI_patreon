'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { queryKeys } from '@/constants/query-keys';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

async function fetchRevenue(suiClient: SuiJsonRpcClient, serviceObjectId: string): Promise<number> {
    const serviceObject = await suiClient.getObject({
        id: serviceObjectId,
        options: { showContent: true },
    });

    if (serviceObject.data?.content?.dataType === 'moveObject') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields = (serviceObject.data.content as any).fields;
        const revenueValue = fields?.revenue?.fields?.value
            ?? fields?.revenue?.value
            ?? fields?.revenue
            ?? 0;
        return Number(revenueValue);
    }

    return 0;
}

/**
 * Hook to read the accumulated revenue balance from a creator's Service object.
 * The revenue field is a Balance<SUI> stored on-chain.
 */
export function useCreatorRevenue(serviceObjectId: string | null) {
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.creatorRevenue(serviceObjectId ?? ''),
        queryFn: () => fetchRevenue(suiClient, serviceObjectId!),
        enabled: !!serviceObjectId,
        staleTime: 15_000,
    });

    const refetch = () => {
        if (serviceObjectId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.creatorRevenue(serviceObjectId) });
        }
    };

    return { revenueMist: data ?? 0, isLoading, refetch };
}
