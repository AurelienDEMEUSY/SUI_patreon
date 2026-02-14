'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { buildCreateProfile } from '@/lib/contract';
import { PACKAGE_ID } from '@/lib/contract-constants';

/**
 * Auto-registration hook:
 * When a wallet connects, checks if the user already has a Service object on-chain.
 * If NOT found, sets `needsRegistration = true` so the UI can show a form.
 * The `register()` function is called manually after the user fills the form.
 */
export function useAutoRegister() {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    const [serviceObjectId, setServiceObjectId] = useState<string | null>(null);
    const [needsRegistration, setNeedsRegistration] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkedRef = useRef<string | null>(null);

    /**
     * Query on-chain to find a Service object owned by this creator.
     * After finding the object ID from events, validates that the object
     * still exists on-chain (it may have been destroyed via delete_creator_profile).
     */
    const findExistingService = useCallback(async (address: string): Promise<string | null> => {
        try {
            // First, check if this creator has been deleted — if the most recent
            // relevant event is CreatorDeleted, we know there's no active Service.
            const deletedEvents = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::service::CreatorDeleted`,
                },
                limit: 50,
            });

            const registeredEvents = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::service::CreatorRegistered`,
                },
                limit: 50,
            });

            // Find all registration and deletion events for this address
            const myRegistrations = registeredEvents.data.filter(
                (e) => (e.parsedJson as { creator?: string })?.creator === address
            );
            const myDeletions = deletedEvents.data.filter(
                (e) => (e.parsedJson as { creator?: string })?.creator === address
            );

            // If there are as many (or more) deletions as registrations, no active profile
            if (myRegistrations.length > 0 && myDeletions.length >= myRegistrations.length) {
                return null;
            }

            // Find the Service object ID from the most recent registration event
            for (const event of myRegistrations) {
                const txDigest = event.id.txDigest;
                const txDetails = await suiClient.getTransactionBlock({
                    digest: txDigest,
                    options: { showObjectChanges: true },
                });

                const serviceObj = txDetails.objectChanges?.find(
                    (change) =>
                        change.type === 'created' &&
                        change.objectType?.includes('::service::Service')
                );

                if (serviceObj && 'objectId' in serviceObj) {
                    const objectId = serviceObj.objectId;

                    // Validate the object still exists on-chain
                    const objectResponse = await suiClient.getObject({
                        id: objectId,
                        options: { showContent: true },
                    });

                    if (objectResponse.data?.content) {
                        return objectId;
                    }
                    // Object was destroyed — continue checking other events
                    // (in case the user re-registered after deleting)
                }
            }

            return null;
        } catch (err) {
            console.error('Error finding existing service:', err);
            return null;
        }
    }, [suiClient]);

    /**
     * Register as a creator on-chain with user-provided name & description.
     */
    const register = useCallback(async (name: string, description: string): Promise<string | null> => {
        if (!currentAccount) return null;

        setIsRegistering(true);
        setError(null);

        try {
            const tx = buildCreateProfile(name, description);

            const result = await signAndExecute({
                transaction: tx,
            });

            const txResult = await suiClient.waitForTransaction({
                digest: result.digest,
                options: { showObjectChanges: true },
            });

            const serviceObj = txResult.objectChanges?.find(
                (change) =>
                    change.type === 'created' &&
                    change.objectType?.includes('::service::Service')
            );

            if (serviceObj && 'objectId' in serviceObj) {
                const id = serviceObj.objectId;
                setServiceObjectId(id);
                setNeedsRegistration(false);
                return id;
            }

            throw new Error('Service object not found in transaction result');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            if (message.includes('ECreatorAlreadyExists') || message.includes('MoveAbort')) {
                const existingId = await findExistingService(currentAccount.address);
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
    }, [currentAccount, signAndExecute, suiClient, findExistingService]);

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

        const checkExisting = async () => {
            setIsChecking(true);
            setError(null);

            try {
                const existingId = await findExistingService(currentAccount.address);
                if (existingId) {
                    setServiceObjectId(existingId);
                    setNeedsRegistration(false);
                } else {
                    setNeedsRegistration(true);
                }
            } catch (err) {
                console.error('Check error:', err);
                setError(err instanceof Error ? err.message : 'Failed to check profile');
            } finally {
                setIsChecking(false);
            }
        };

        checkExisting();
    }, [currentAccount?.address, findExistingService]);

    return {
        serviceObjectId,
        needsRegistration,
        isChecking,
        isRegistering,
        error,
        register,
    };
}
