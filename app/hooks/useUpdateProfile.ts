'use client';

import { useState, useCallback } from 'react';
import { useExecuteTransaction } from './useExecuteTransaction';
import { buildUpdateProfile } from '@/lib/contract';
import { uploadPublicImage } from '@/lib/walrus';

// ============================================================
// useUpdateProfile — Upload avatar to Walrus + update on-chain
// ============================================================

export interface UpdateProfileInput {
    name: string;
    description: string;
    /** New avatar file to upload to Walrus (optional — skip if unchanged) */
    avatarFile?: File | null;
    /** Current avatar blob ID on Walrus (kept if no new file) */
    currentAvatarBlobId?: string;
}

interface UseUpdateProfileResult {
    updateProfile: (serviceObjectId: string, input: UpdateProfileInput) => Promise<boolean>;
    isLoading: boolean;
    /** 'uploading' while pushing image to Walrus, 'signing' while executing TX */
    step: 'idle' | 'uploading' | 'signing';
    error: string | null;
}

/**
 * Hook that orchestrates:
 * 1. Upload new avatar image to Walrus (if provided)
 * 2. Build and execute `update_creator_profile` transaction
 */
export function useUpdateProfile(): UseUpdateProfileResult {
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'idle' | 'uploading' | 'signing'>('idle');
    const [error, setError] = useState<string | null>(null);
    const { executeTransaction } = useExecuteTransaction();

    const updateProfile = useCallback(
        async (serviceObjectId: string, input: UpdateProfileInput): Promise<boolean> => {
            setIsLoading(true);
            setError(null);

            try {
                // Step 1 — Upload avatar to Walrus if a new file is provided
                let avatarBlobId = input.currentAvatarBlobId || '';

                if (input.avatarFile) {
                    setStep('uploading');
                    avatarBlobId = await uploadPublicImage(input.avatarFile);
                }

                // Step 2 — Execute on-chain transaction
                setStep('signing');
                const tx = buildUpdateProfile(
                    serviceObjectId,
                    input.name,
                    input.description,
                    avatarBlobId,
                );

                await executeTransaction(tx);

                setStep('idle');
                return true;
            } catch (err) {
                console.error('[useUpdateProfile] error:', err);
                setError(err instanceof Error ? err.message : 'Failed to update profile');
                setStep('idle');
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [executeTransaction],
    );

    return { updateProfile, isLoading, step, error };
}
