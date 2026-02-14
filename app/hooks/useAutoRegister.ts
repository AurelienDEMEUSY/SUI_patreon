'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { buildCreateProfile } from '@/lib/contract';
import { findActiveServiceId } from '@/lib/service-lookup';
import { useSponsoredTransaction } from '@/enoki/sponsor';

/**
 * Auto-registration hook.
 *
 * On wallet connect, checks whether the user already has an active Service object on-chain.
 * - Found  → sets `serviceObjectId` (user is a creator).
 * - Not found → sets `needsRegistration = true` so the UI can show the create-profile form.
 *
 * The `register()` callback is invoked manually after the user fills in the form.
 * Uses sponsored transactions (Enoki) — zero gas for the user.
 */
export function useAutoRegister() {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { sponsorAndExecute } = useSponsoredTransaction();

    const [serviceObjectId, setServiceObjectId] = useState<string | null>(null);
    const [needsRegistration, setNeedsRegistration] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkedRef = useRef<string | null>(null);

    /**
     * Register as a creator on-chain with user-provided name & description.
     * Uses sponsorAndExecute so the user pays zero gas.
     */
    const register = useCallback(
        async (name: string, description: string): Promise<string | null> => {
            if (!currentAccount) return null;

            setIsRegistering(true);
            setError(null);

            try {
                const tx = buildCreateProfile(name, description);
                const result = await sponsorAndExecute(tx);

                const txResult = await suiClient.waitForTransaction({
                    digest: result.digest,
                    options: { showObjectChanges: true },
                });

                const created = txResult.objectChanges?.find(
                    (c) => c.type === 'created' && c.objectType?.includes('::service::Service'),
                );

                if (created && 'objectId' in created) {
                    setServiceObjectId(created.objectId);
                    setNeedsRegistration(false);
                    return created.objectId;
                }

                throw new Error('Service object not found in transaction result');
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Registration failed';

                // Handle race-condition: profile already exists on-chain
                if (message.includes('ECreatorAlreadyExists') || message.includes('MoveAbort')) {
                    const existingId = await findActiveServiceId(suiClient, currentAccount.address);
                    if (existingId) {
                        setServiceObjectId(existingId);
                        setNeedsRegistration(false);
                        return existingId;
                    }
                }

                setError(message);
                return null;
            } finally {
                setIsRegistering(false);
            }
        },
        [currentAccount, sponsorAndExecute, suiClient],
    );

    // Check on wallet connect — only detect, don't auto-create
    useEffect(() => {
        if (!currentAccount?.address) {
            setServiceObjectId(null);
            setNeedsRegistration(false);
            checkedRef.current = null;
            return;
        }

        if (checkedRef.current === currentAccount.address) return;
        checkedRef.current = currentAccount.address;

        const check = async () => {
            setIsChecking(true);
            setError(null);

            try {
                const existingId = await findActiveServiceId(suiClient, currentAccount.address);
                if (existingId) {
                    setServiceObjectId(existingId);
                    setNeedsRegistration(false);
                } else {
                    setNeedsRegistration(true);
                }
            } catch (err) {
                console.error('[useAutoRegister] check error:', err);
                setError(err instanceof Error ? err.message : 'Failed to check profile');
            } finally {
                setIsChecking(false);
            }
        };

        check();
    }, [currentAccount?.address, suiClient]);

    return {
        serviceObjectId,
        needsRegistration,
        isChecking,
        isRegistering,
        error,
        register,
    };
}
