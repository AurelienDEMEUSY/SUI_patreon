'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { buildCreateProfile, buildSetSuinsName } from '@/lib/contract';
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
                // Step 1: Create the profile on-chain
                const tx = buildCreateProfile(name, description);
                const result = await sponsorAndExecute(tx);

                const txResult = await suiClient.waitForTransaction({
                    digest: result.digest,
                    options: { showObjectChanges: true },
                });

                const created = txResult.objectChanges?.find(
                    (c) => c.type === 'created' && c.objectType?.includes('::service::Service'),
                );

                if (!created || !('objectId' in created)) {
                    throw new Error('Service object not found in transaction result');
                }

                const newServiceId = created.objectId;
                setServiceObjectId(newServiceId);
                setNeedsRegistration(false);

                // Step 2: Create the leaf subname on SuiNS (server-side, admin signs)
                try {
                    const suinsRes = await fetch('/api/suins/create-subname', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ creatorAddress: currentAccount.address }),
                    });

                    if (suinsRes.ok) {
                        const { suinsName } = await suinsRes.json();

                        // Step 3: Record the subname in the contract (creator signs)
                        if (suinsName) {
                            try {
                                const setSuinsTx = buildSetSuinsName(newServiceId, suinsName);
                                const suinsResult = await sponsorAndExecute(setSuinsTx);
                                await suiClient.waitForTransaction({ digest: suinsResult.digest });
                            } catch (suinsErr) {
                                // Non-blocking: leaf exists on SuiNS even if contract link fails
                                console.warn('[useAutoRegister] set_suins_name failed:', suinsErr);
                            }
                        }
                    } else {
                        const errBody = await suinsRes.json().catch(() => ({}));
                        console.warn('[useAutoRegister] create-subname API error:', errBody.error);
                    }
                } catch (suinsErr) {
                    // Non-blocking: profile creation succeeded regardless
                    console.warn('[useAutoRegister] SuiNS subname creation skipped:', suinsErr);
                }

                return newServiceId;
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

    // On wallet connect: detect existing profile (don't auto-create)
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
