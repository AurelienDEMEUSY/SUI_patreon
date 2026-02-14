'use client';

import { useState } from 'react';

interface CreateProfileFormProps {
    onSubmit: (name: string, description: string) => Promise<string | null>;
    isLoading: boolean;
    error: string | null;
    onClose?: () => void;
}

export function CreateProfileForm({ onSubmit, isLoading, error, onClose }: CreateProfileFormProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await onSubmit(name.trim(), description.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden">
                {/* Gradient border effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#3c3cf6]/50 via-purple-500/30 to-pink-500/20 p-[1px]">
                    <div className="w-full h-full rounded-3xl bg-[#0e0e1a]" />
                </div>

                <div className="relative p-8 md:p-10">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3c3cf6] to-purple-600 flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(60,60,246,0.5)]">
                        <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                    </div>

                    {/* Header */}
                    <h2 className="text-2xl font-black text-white mb-2">Create Your Profile</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        Set up your creator profile on the Sui blockchain. This will be visible to all subscribers.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                                Creator Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Ethereal Arts Studio"
                                required
                                maxLength={50}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all text-sm font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell your future subscribers about yourself and your content..."
                                rows={3}
                                maxLength={200}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all text-sm font-medium resize-none"
                            />
                            <span className="text-[10px] text-gray-600 mt-1 block text-right">{description.length}/200</span>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 px-4 py-3 rounded-xl">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="w-full h-13 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-[0_0_30px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-3.5"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                    Creating on-chain…
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                                    Create Profile on Sui
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                            This will create a transaction on the Sui testnet. You&apos;ll need to approve it in your wallet.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
