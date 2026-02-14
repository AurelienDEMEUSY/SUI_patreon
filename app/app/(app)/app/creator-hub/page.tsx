'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useAutoRegister } from '@/hooks/useAutoRegister';
import { CreateProfileForm } from '@/components/creator/CreateProfileForm';
import { PageContainer } from '@/components/layout';

export default function CreatorHubPage() {
    const router = useRouter();
    const currentAccount = useCurrentAccount();
    const {
        serviceObjectId,
        needsRegistration,
        isChecking,
        isRegistering,
        error: registerError,
        register,
    } = useAutoRegister();
    const [showCreateForm, setShowCreateForm] = useState(false);

    const handleRegister = async (name: string, description: string) => {
        const result = await register(name, description);
        if (result) {
            setShowCreateForm(false);
            router.push(`/creator/${currentAccount?.address}`);
        }
        return result;
    };

    // Loading state
    if (isChecking) {
        return (
            <PageContainer maxWidth="max-w-4xl">
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <span className="material-symbols-outlined text-4xl text-[#3c3cf6] animate-spin mb-4">progress_activity</span>
                    <p className="text-white/50 text-sm font-medium">Checking your creator profile…</p>
                </div>
            </PageContainer>
        );
    }

    // Has a profile → show link to their creator page
    if (serviceObjectId && currentAccount?.address) {
        return (
            <PageContainer maxWidth="max-w-4xl">
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                        <span className="material-symbols-outlined text-3xl text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">You&apos;re a Creator!</h1>
                    <p className="text-gray-400 max-w-md mb-8">
                        Your creator profile is live on-chain. Manage your tiers, publish content, and grow your community.
                    </p>
                    <button
                        onClick={() => router.push(`/creator/${currentAccount.address}`)}
                        className="px-8 py-4 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] transition-all active:scale-95"
                    >
                        Go to My Profile
                    </button>
                </div>
            </PageContainer>
        );
    }

    // No profile → empty state
    return (
        <PageContainer maxWidth="max-w-4xl">
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-6 border border-white/[0.06]">
                    <span className="material-symbols-outlined text-3xl text-gray-500">person_off</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-2">No Creator Profile</h1>
                <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                    You don&apos;t have a creator profile yet. Create one to start publishing content, setting up subscription tiers, and earning from your community.
                </p>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-8 py-4 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] transition-all active:scale-95 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Create My Profile
                </button>
            </div>

            {showCreateForm && (
                <CreateProfileForm
                    onSubmit={handleRegister}
                    isLoading={isRegistering}
                    error={registerError}
                    onClose={() => setShowCreateForm(false)}
                />
            )}
        </PageContainer>
    );
}
