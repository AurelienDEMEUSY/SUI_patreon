'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { DeleteCreatorModal } from '@/components/creator/DeleteCreatorModal';
import { useAutoRegister } from '@/hooks/useAutoRegister';
import { useCreator } from '@/hooks/useCreator';
import { useDeleteCreator } from '@/hooks/useDeleteCreator';

export default function SettingsPage() {
    const router = useRouter();
    const { serviceObjectId } = useAutoRegister();
    const { creator } = useCreator(null);
    const { deleteCreator, isLoading: isDeleting, error: deleteError } = useDeleteCreator();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteConfirm = useCallback(async () => {
        if (!serviceObjectId) return;

        const success = await deleteCreator(serviceObjectId);
        if (success) {
            setShowDeleteModal(false);
            // Redirect to home — useAutoRegister will detect the missing Service
            router.push('/app');
            router.refresh();
        }
    }, [serviceObjectId, deleteCreator, router]);

    return (
        <PageContainer maxWidth="max-w-4xl">
            <div className="space-y-8">
                <h1 className="text-3xl font-black text-white">Settings</h1>

                <div className="glass-panel rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Account</h2>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <p className="font-semibold">Profile</p>
                            <p className="text-sm text-gray-400">Manage your avatar and bio</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold transition-colors">Edit</button>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <p className="font-semibold">Wallet Connection</p>
                            <p className="text-sm text-gray-400">Connected via Sui Wallet</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold transition-colors">Manage</button>
                    </div>
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <p className="font-semibold">Notifications</p>
                            <p className="text-sm text-gray-400">Email and push preferences</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold transition-colors">Configure</button>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 opacity-75">
                    <h2 className="text-xl font-bold text-white mb-4">Privacy & Security</h2>
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <p className="font-semibold">End-to-End Encryption</p>
                            <p className="text-sm text-gray-400">Seal keys management</p>
                        </div>
                        <span className="text-emerald-400 text-sm font-bold">Active</span>
                    </div>
                </div>

                {/* Danger Zone — only shown if the user has a creator profile */}
                {serviceObjectId && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/3 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-red-400 text-xl">warning</span>
                            <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
                        </div>
                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="font-semibold text-white">Delete Creator Profile</p>
                                <p className="text-sm text-gray-400">
                                    Permanently destroy your on-chain Service object and remove your profile from the platform.
                                    This action cannot be undone.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="ml-4 shrink-0 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-xl text-sm font-bold transition-all duration-200"
                            >
                                Delete Profile
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center pt-4">
                    <button className="text-red-400 hover:text-red-300 text-sm font-bold transition-colors">
                        Log Out
                    </button>
                    <p className="mt-4 text-xs text-gray-600">Version 0.1.0-alpha</p>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <DeleteCreatorModal
                    creatorName={creator?.name || 'Creator'}
                    isLoading={isDeleting}
                    error={deleteError}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setShowDeleteModal(false)}
                />
            )}
        </PageContainer>
    );
}
