'use client';

import { useState } from 'react';

interface DeleteCreatorModalProps {
    /** The creator's display name — user must type it to confirm */
    creatorName: string;
    /** Whether the delete operation is in progress */
    isLoading: boolean;
    /** Error message to display */
    error: string | null;
    /** Called when the user confirms deletion */
    onConfirm: () => void;
    /** Called when the user cancels */
    onClose: () => void;
}

export function DeleteCreatorModal({
    creatorName,
    isLoading,
    error,
    onConfirm,
    onClose,
}: DeleteCreatorModalProps) {
    const [confirmText, setConfirmText] = useState('');

    const isConfirmed = confirmText.trim().toLowerCase() === creatorName.trim().toLowerCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden">
                {/* Gradient border effect — red for danger */}
                <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-red-500/50 via-red-600/30 to-orange-500/20 p-px">
                    <div className="w-full h-full rounded-3xl bg-[#0e0e1a]" />
                </div>

                <div className="relative p-8 md:p-10">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-red-500 to-red-700 flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)]">
                        <span
                            className="material-symbols-outlined text-3xl text-white"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            warning
                        </span>
                    </div>

                    {/* Header */}
                    <h2 className="text-2xl font-black text-white mb-2">Delete Creator Profile</h2>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        This action is <span className="text-red-400 font-bold">permanent and irreversible</span>.
                        Your on-chain Service object will be destroyed, your profile will be removed from the platform,
                        and all your tiers and posts metadata will be deleted.
                    </p>

                    {/* Info cards */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                            <span className="material-symbols-outlined text-emerald-400 text-lg mt-0.5">account_balance_wallet</span>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Any remaining <span className="text-white font-semibold">revenue balance</span> will be transferred back to your wallet.
                            </p>
                        </div>
                        <div className="flex items-start gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                            <span className="material-symbols-outlined text-amber-400 text-lg mt-0.5">group_off</span>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                You must have <span className="text-white font-semibold">no active subscribers</span>. If you do, wait for their subscriptions to expire first.
                            </p>
                        </div>
                    </div>

                    {/* Confirmation input */}
                    <div className="mb-5">
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                            Type <span className="text-red-400">{creatorName}</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={creatorName}
                            disabled={isLoading}
                            className="w-full bg-white/4 border border-red-500/20 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm font-medium"
                        />
                    </div>

                    {/* Error display */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 px-4 py-3 rounded-xl mb-5">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 h-13 bg-white/5 hover:bg-white/8 text-white font-bold rounded-xl transition-all duration-300 text-sm py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading || !isConfirmed}
                            className="flex-1 h-13 bg-linear-to-r from-red-600 to-red-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-[0_0_30px_-5px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_-5px_rgba(239,68,68,0.6)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-3.5"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                    Deleting…
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                                    Delete Forever
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-600 text-center leading-relaxed mt-4">
                        This will send a transaction to the Sui testnet to destroy your Service object permanently.
                    </p>
                </div>
            </div>
        </div>
    );
}
