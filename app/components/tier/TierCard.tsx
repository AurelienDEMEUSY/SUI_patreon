'use client';

import { Tier } from '@/types';
import { format } from '@/lib/format';

interface TierCardProps {
    tier: Tier;
    onSubscribe?: (tierId: string) => void;
}

export function TierCard({ tier, onSubscribe }: TierCardProps) {
    return (
        <div className="relative p-1 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 group hover:border-[#3c3cf6]/50 transition-colors">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl rounded-[1.4rem] p-6 h-full flex flex-col items-start gap-4">
                {/* Header */}
                <div className="flex justify-between w-full">
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-[#3c3cf6] transition-colors">{tier.name}</h3>
                        <p className="text-3xl font-black text-white mt-2">
                            {format.mistToSui(tier.priceInMist)} <span className="text-sm font-bold text-gray-500">SUI</span>
                        </p>
                        <p className="text-gray-400 text-xs mt-1">per month</p>
                    </div>
                    {tier.order === 2 && (
                        <div className="bg-[#3c3cf6] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full h-fit">
                            Most Popular
                        </div>
                    )}
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed min-h-[40px]">
                    {tier.description}
                </p>

                {/* Benefits */}
                <ul className="space-y-3 my-4 flex-1">
                    {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
                            <span className="material-symbols-outlined text-[#3c3cf6] text-lg">check_circle</span>
                            <span>{benefit}</span>
                        </li>
                    ))}
                </ul>

                {/* Action */}
                <button
                    onClick={() => onSubscribe?.(tier.id)}
                    className="w-full h-12 bg-white/5 hover:bg-[#3c3cf6] hover:text-white text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_-5px_rgba(60,60,246,0.6)]"
                >
                    Subscribe
                </button>
            </div>
        </div>
    );
}
