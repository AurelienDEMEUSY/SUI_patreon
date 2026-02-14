'use client';

import { TierCard } from '@/components/tier/TierCard';
import type { CreatorMembershipTabProps } from './CreatorMembershipTab.types';

const DASHED_BUTTON_CLASS =
    'w-full py-4 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#3c3cf6]/40 bg-white/[0.02] hover:bg-[#3c3cf6]/5 transition-all flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-[#3c3cf6] group';

export function CreatorMembershipTab({ tiers, serviceObjectId, onAddTier }: CreatorMembershipTabProps) {
    return (
        <div className="grid grid-cols-1 gap-5">
            <button type="button" onClick={onAddTier} className={DASHED_BUTTON_CLASS}>
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">add_circle</span>
                Add a new tier
            </button>

            {tiers.length > 0 ? (
                tiers.map((tier) => (
                    <TierCard
                        key={tier.id}
                        tier={tier}
                        serviceObjectId={serviceObjectId}
                    />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06]">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl text-gray-600">workspace_premium</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1.5">No membership tiers</h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                        Create your first tier so supporters can subscribe!
                    </p>
                    <button
                        type="button"
                        onClick={onAddTier}
                        className="mt-6 h-11 px-7 bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] active:scale-95 flex items-center justify-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        Create First Tier
                    </button>
                </div>
            )}
        </div>
    );
}
