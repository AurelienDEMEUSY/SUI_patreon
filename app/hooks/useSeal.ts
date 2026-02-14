'use client';

import { useState, useCallback } from 'react';
import { SealClient, SessionKey } from '@mysten/seal';
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import {
    getSealClient,
    encryptContent,
    decryptContent,
    createSessionKey,
} from '@/lib/seal';
import { uploadEncryptedContent, downloadFromWalrus } from '@/lib/walrus';

// ============================================================
// useSealClient — provides the SealClient singleton
// ============================================================

export function useSealClient(): SealClient {
    const suiClient = useSuiClient();
    return getSealClient(suiClient);
}

// ============================================================
// useSessionKey — manages session key lifecycle
// ============================================================

interface UseSessionKeyResult {
    sessionKey: SessionKey | null;
    isLoading: boolean;
    error: string | null;
    createAndSign: () => Promise<SessionKey | null>;
}

export function useSessionKey(ttlMin: number = 10): UseSessionKeyResult {
    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const suiClient = useSuiClient();

    const createAndSign = useCallback(async (): Promise<SessionKey | null> => {
        if (!currentAccount) {
            setError('No wallet connected');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const sk = await createSessionKey(
                currentAccount.address,
                suiClient,
                ttlMin
            );

            const message = sk.getPersonalMessage();
            const { signature } = await signPersonalMessage({ message });
            sk.setPersonalMessageSignature(signature);

            setSessionKey(sk);
            return sk;
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Session key creation failed';
            setError(errMsg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [currentAccount, suiClient, ttlMin, signPersonalMessage]);

    return { sessionKey, isLoading, error, createAndSign };
}

// ============================================================
// useEncrypt — encrypt content and upload to Walrus
// ============================================================

interface EncryptResult {
    blobId: string;
    backupKey: Uint8Array;
}

interface UseEncryptResult {
    encrypt: (data: Uint8Array, serviceObjectId: string, postId: string | number) => Promise<EncryptResult>;
    isLoading: boolean;
    error: string | null;
}

export function useEncrypt(): UseEncryptResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const suiClient = useSuiClient();

    const encrypt = useCallback(
        async (data: Uint8Array, serviceObjectId: string, postId: string | number): Promise<EncryptResult> => {
            setIsLoading(true);
            setError(null);

            try {
                const { encryptedBytes, backupKey } = await encryptContent(
                    suiClient,
                    data,
                    serviceObjectId,
                    postId
                );

                const blobId = await uploadEncryptedContent(encryptedBytes);
                return { blobId, backupKey };
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Encryption failed';
                setError(errMsg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [suiClient]
    );

    return { encrypt, isLoading, error };
}

// ============================================================
// useDecrypt — download from Walrus and decrypt with Seal
// ============================================================

interface UseDecryptResult {
    decrypt: (blobId: string, serviceObjectId: string, postId: string | number) => Promise<Uint8Array>;
    isLoading: boolean;
    error: string | null;
}

export function useDecrypt(
    sessionKey: SessionKey | null,
    createAndSign: () => Promise<SessionKey | null>
): UseDecryptResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const suiClient = useSuiClient();

    const decrypt = useCallback(
        async (blobId: string, serviceObjectId: string, postId: string | number): Promise<Uint8Array> => {
            setIsLoading(true);
            setError(null);

            try {
                let sk = sessionKey;
                if (!sk) {
                    sk = await createAndSign();
                    if (!sk) {
                        throw new Error('Session key creation was cancelled');
                    }
                }

                const encryptedData = await downloadFromWalrus(blobId);
                const plaintext = await decryptContent(
                    suiClient,
                    encryptedData,
                    serviceObjectId,
                    postId,
                    sk
                );

                return plaintext;
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Decryption failed';
                setError(errMsg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [suiClient, sessionKey, createAndSign]
    );

    return { decrypt, isLoading, error };
}
