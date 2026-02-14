'use client';

import { useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { buildAddTier } from '@/lib/contract';
import { useSponsoredTransaction } from '@/enoki/sponsor';

interface AddTierFormProps {
    serviceObjectId: string;
    existingTierLevels: number[];
    onSuccess: () => void;
    onClose: () => void;
}

const DURATION_OPTIONS = [
    { label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
    { label: '30 days', ms: 30 * 24 * 60 * 60 * 1000 },
    { label: '90 days', ms: 90 * 24 * 60 * 60 * 1000 },
    { label: '365 days', ms: 365 * 24 * 60 * 60 * 1000 },
];

export function AddTierForm({ serviceObjectId, existingTierLevels, onSuccess, onClose }: AddTierFormProps) {
    const nextLevel = existingTierLevels.length > 0
        ? Math.max(...existingTierLevels) + 1
        : 1;

    const [name, setName] = useState('');
    const [tierLevel, setTierLevel] = useState(nextLevel);
    const [priceSui, setPriceSui] = useState('');
    const [durationMs, setDurationMs] = useState(DURATION_OPTIONS[1].ms); // 30 days default
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { sponsorAndExecute } = useSponsoredTransaction();
    const suiClient = useSuiClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const price = parseFloat(priceSui);
        if (isNaN(price) || price <= 0) {
            setError('Price must be greater than 0');
            return;
        }

        if (existingTierLevels.includes(tierLevel)) {
            setError(`Tier level ${tierLevel} already exists`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const priceInMist = Math.round(price * 1_000_000_000);
            const tx = buildAddTier(serviceObjectId, tierLevel, name.trim(), priceInMist, durationMs);

            const result = await sponsorAndExecute(tx);
            await suiClient.waitForTransaction({ digest: result.digest });

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create tier');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#3c3cf6]/50 via-purple-500/30 to-pink-500/20 p-[1px]">
                    <div className="w-full h-full rounded-3xl bg-[#0e0e1a]" />
                </div>

                <div className="relative p-8 md:p-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3c3cf6] to-purple-600 flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(60,60,246,0.5)]">
                        <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2">Create a Tier</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        Add a new subscription tier for your supporters. They&#39;ll pay in SUI to access your exclusive content.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                                    Tier Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Gold"
                                    required
                                    maxLength={30}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                                    Tier Level
                                </label>
                                <input
                                    type="number"
                                    value={tierLevel}
                                    onChange={(e) => setTierLevel(Number(e.target.value))}
                                    min={1}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all text-sm font-medium"
                                />
                                <p className="text-[10px] text-gray-600 mt-1">Higher level = more access</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                                    Price (SUI) *
                                </label>
                                <input
                                    type="number"
                                    value={priceSui}
                                    onChange={(e) => setPriceSui(e.target.value)}
                                    placeholder="e.g. 1.5"
                                    required
                                    min="0.001"
                                    step="0.001"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                                    Duration
                                </label>
                                <select
                                    value={durationMs}
                                    onChange={(e) => setDurationMs(Number(e.target.value))}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all text-sm font-medium appearance-none"
                                >
                                    {DURATION_OPTIONS.map((opt) => (
                                        <option key={opt.ms} value={opt.ms} className="bg-[#0e0e1a]">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 px-4 py-3 rounded-xl">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 h-12 bg-white/[0.05] text-white font-bold rounded-xl border border-white/10 hover:bg-white/[0.08] transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !name.trim() || !priceSui}
                                className="flex-1 h-12 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_30px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                        Creating…
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">add_circle</span>
                                        Create Tier
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
