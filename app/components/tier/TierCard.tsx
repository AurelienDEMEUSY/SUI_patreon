'use client';

import { Tier } from '@/types';
import { format } from '@/lib/format';
import { useSubscribe } from '@/hooks/useSubscribe';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useState } from 'react';

interface TierCardProps {
    tier: Tier;
    serviceObjectId?: string | null;
    onSubscribe?: (tierId: string) => void;
}

export function TierCard({ tier, serviceObjectId, onSubscribe }: TierCardProps) {
    const isPopular = tier.order === 2;
    const currentAccount = useCurrentAccount();
    const { subscribe, isLoading: isSubscribing } = useSubscribe();
    const [subscribeSuccess, setSubscribeSuccess] = useState(false);
    const [subscribeError, setSubscribeError] = useState<string | null>(null);

    const handleSubscribe = async () => {
        setSubscribeError(null);
        setSubscribeSuccess(false);

        if (!currentAccount) {
            setSubscribeError('Please connect your wallet first');
            return;
        }

        if (!serviceObjectId) {
            setSubscribeError('Cannot subscribe — creator has no on-chain service.');
            return;
        }

        const tierLevel = tier.tierLevel;

        console.log('[Subscribe]', { serviceObjectId, tierLevel, priceInMist: tier.priceInMist });

        try {
            const success = await subscribe(
                serviceObjectId,
                tierLevel,
                tier.priceInMist
            );

            if (success) {
                setSubscribeSuccess(true);
                setTimeout(() => setSubscribeSuccess(false), 3000);
            } else {
                setSubscribeError('Subscription failed. Please try again.');
                setTimeout(() => setSubscribeError(null), 5000);
            }
        } catch (err) {
            console.error('[Subscribe] Error:', err);
            setSubscribeError(err instanceof Error ? err.message : 'Subscription failed');
            setTimeout(() => setSubscribeError(null), 5000);
        }
    };

    return (
        <div className={`tier-gradient-border group ${isPopular ? '!bg-gradient-to-br !from-[#3c3cf6]/30 !via-purple-500/20 !to-pink-500/10' : ''}`}>
            <div className="tier-inner p-6 md:p-7 flex flex-col gap-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-[#3c3cf6] transition-colors duration-300">
                            {tier.name}
                        </h3>
                        <div className="flex items-baseline gap-2 mt-2.5">
                            <span className="text-4xl font-black text-white">{format.mistToSui(tier.priceInMist)}</span>
                            <span className="text-sm font-bold text-[#3c3cf6] bg-[#3c3cf6]/10 px-2.5 py-0.5 rounded-full">SUI</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1 font-medium">per {tier.durationMs ? format.duration(tier.durationMs) : 'month'}</p>
                    </div>
                    {isPopular && (
                        <div className="bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-[0_0_20px_-5px_rgba(60,60,246,0.5)]">
                            ⭐ Popular
                        </div>
                    )}
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed">
                    {tier.description}
                </p>

                {/* Benefits */}
                <ul className="space-y-3 flex-1">
                    {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
                            <span className="material-symbols-outlined text-[#3c3cf6] text-base mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            <span>{benefit}</span>
                        </li>
                    ))}
                </ul>

                {/* Subscriber Count */}
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                    <span className="material-symbols-outlined text-sm">group</span>
                    {tier.subscriberCount.toLocaleString()} subscribers
                </div>

                {/* Success Message */}
                {subscribeSuccess && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-3 py-2 rounded-lg">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Subscribed successfully!
                    </div>
                )}

                {/* Error Message */}
                {subscribeError && (
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 px-3 py-2 rounded-lg">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {subscribeError}
                    </div>
                )}

                {/* Subscribe Button */}
                <button
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className={`w-full h-12 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${isPopular
                        ? 'bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white shadow-[0_0_30px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)]'
                        : 'bg-white/[0.05] hover:bg-[#3c3cf6] text-white border border-white/10 hover:border-transparent hover:shadow-[0_0_30px_-5px_rgba(60,60,246,0.4)]'
                        }`}
                >
                    {isSubscribing ? (
                        <>
                            <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                            Processing...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">loyalty</span>
                            Subscribe
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
