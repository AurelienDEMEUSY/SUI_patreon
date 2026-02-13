import { useState, useEffect } from 'react';
import { MOCK_CREATORS } from '@/constants';
import type { Creator } from '@/types';

// TODO: Remove this once real data fetching is implemented
const USE_MOCK = true;

export function useCreator(address: string | null) {
    const [creator, setCreator] = useState<Creator | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!address) return;
        setIsLoading(true);
        setError(null);

        const fetchData = async () => {
            // TODO: Fetch creator profile from SUI blockchain
            // const creatorProfile = await suiClient.getObject({ id: creatorObjectId });

            // TODO: Resolve SuiNS name
            // const suinsName = await suinsClient.getName(address);

            // TODO: Fetch avatar and banner from Walrus
            // const avatarUrl = await walrusClient.getBlob(creatorProfile.avatarBlobId);
            // const bannerUrl = await walrusClient.getBlob(creatorProfile.bannerBlobId);

            if (USE_MOCK) {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 300));
                const found = MOCK_CREATORS.find((c) => c.address === address) || null;
                setCreator(found);
                setIsLoading(false);
            } else {
                // TODO: Implement real service call integration here
                // setCreator({
                //   address,
                //   name: creatorProfile.name,
                //   bio: creatorProfile.bio,
                //   avatarBlobId: avatarUrl,
                //   bannerBlobId: bannerUrl,
                //   suinsName,
                //   ...
                // });
                setIsLoading(false);
            }
        };

        fetchData();
    }, [address]);

    return { creator, isLoading, error };
}
