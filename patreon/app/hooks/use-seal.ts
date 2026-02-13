"use client";

import { useState, useCallback } from "react";
import { SealClient, SessionKey } from "@mysten/seal";
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";
import {
    getSealClient,
    encryptContent,
    decryptContent,
    createSessionKey,
} from "../lib/seal";
import { uploadEncryptedContent, downloadFromWalrus } from "../lib/walrus";

// ============================================================
// useSealClient — provides the SealClient singleton
// ============================================================

/**
 * React hook that provides the SealClient instance.
 * Uses the SuiClient from dApp kit.
 */
export function useSealClient(): SealClient {
    const suiClient = useSuiClient();
    return getSealClient(suiClient);
}

// ============================================================
// useSessionKey — manages session key lifecycle
// ============================================================

interface UseSessionKeyResult {
    /** The current session key (null if not yet created) */
    sessionKey: SessionKey | null;
    /** Whether a session key is being created/signed */
    isLoading: boolean;
    /** Error from session key creation */
    error: string | null;
    /** Create and sign a new session key */
    createAndSign: () => Promise<SessionKey | null>;
}

/**
 * React hook to manage Seal session keys.
 *
 * Session keys authorize the dApp to retrieve decryption keys
 * from Seal key servers for a limited time (default: 10 minutes).
 *
 * Usage:
 * ```tsx
 * const { sessionKey, createAndSign } = useSessionKey();
 * // Later, when user wants to decrypt:
 * const sk = await createAndSign(); // prompts wallet signature
 * ```
 */
export function useSessionKey(ttlMin: number = 10): UseSessionKeyResult {
    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const suiClient = useSuiClient();

    const createAndSign = useCallback(async (): Promise<SessionKey | null> => {
        if (!currentAccount) {
            setError("No wallet connected");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create the session key
            const sk = await createSessionKey(
                currentAccount.address,
                suiClient,
                ttlMin
            );

            // Get the personal message for the user to sign
            const message = sk.getPersonalMessage();

            // Sign with the user's wallet
            const { signature } = await signPersonalMessage({ message });
            sk.setPersonalMessageSignature(signature);

            setSessionKey(sk);
            return sk;
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Session key creation failed";
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
    /** Walrus blob ID of the encrypted data */
    blobId: string;
    /** Backup key for disaster recovery */
    backupKey: Uint8Array;
}

interface UseEncryptResult {
    /** Encrypt data and upload to Walrus */
    encrypt: (data: Uint8Array, serviceObjectId: string, postId: string | number) => Promise<EncryptResult>;
    /** Whether encryption is in progress */
    isLoading: boolean;
    /** Error from encryption */
    error: string | null;
}

/**
 * React hook to encrypt content with Seal and upload to Walrus.
 *
 * Usage:
 * ```tsx
 * const { encrypt } = useEncrypt();
 * const { blobId } = await encrypt(contentBytes, serviceObjectId, postId);
 * // Then call publish_post with the blobId
 * ```
 */
export function useEncrypt(): UseEncryptResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const suiClient = useSuiClient();

    const encrypt = useCallback(
        async (data: Uint8Array, serviceObjectId: string, postId: string | number): Promise<EncryptResult> => {
            setIsLoading(true);
            setError(null);

            try {
                // Step 1: Encrypt with Seal
                const { encryptedBytes, backupKey } = await encryptContent(
                    suiClient,
                    data,
                    serviceObjectId,
                    postId
                );

                // Step 2: Upload encrypted bytes to Walrus
                const blobId = await uploadEncryptedContent(encryptedBytes);

                return { blobId, backupKey };
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : "Encryption failed";
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
    /** Download and decrypt content */
    decrypt: (blobId: string, serviceObjectId: string, postId: string | number) => Promise<Uint8Array>;
    /** Whether decryption is in progress */
    isLoading: boolean;
    /** Error from decryption */
    error: string | null;
}

/**
 * React hook to download encrypted content from Walrus and decrypt with Seal.
 *
 * Requires an active session key. If no session key exists, it will
 * automatically prompt the user to create one.
 *
 * Usage:
 * ```tsx
 * const { sessionKey, createAndSign } = useSessionKey();
 * const { decrypt } = useDecrypt(sessionKey, createAndSign);
 * const plaintext = await decrypt(blobId, serviceObjectId, postId);
 * ```
 */
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
                // Ensure we have a session key
                let sk = sessionKey;
                if (!sk) {
                    sk = await createAndSign();
                    if (!sk) {
                        throw new Error("Session key creation was cancelled");
                    }
                }

                // Step 1: Download encrypted blob from Walrus
                const encryptedData = await downloadFromWalrus(blobId);

                // Step 2: Decrypt with Seal
                const plaintext = await decryptContent(
                    suiClient,
                    encryptedData,
                    serviceObjectId,
                    postId,
                    sk
                );

                return plaintext;
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : "Decryption failed";
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
