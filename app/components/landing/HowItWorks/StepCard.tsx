'use client';

import { UserPlus, Layers, Coins, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { StepCardProps } from './HowItWorks.types';

const iconMap = {
  'user-plus': UserPlus,
  'layers': Layers,
  'coins': Coins,
};

export function StepCard({ step, isLast = false }: StepCardProps) {
  const Icon = iconMap[step.icon as keyof typeof iconMap] || UserPlus;

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <Card hover className="p-8 flex-1 w-full group relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3c3cf6]/0 to-[#3c3cf6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10">
          {/* Step number badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#3c3cf6]/20 border-2 border-[#3c3cf6]/40 mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="text-3xl font-bold gradient-text-alt">
              {step.number}
            </span>
          </div>

          {/* Icon */}
          <div className="mb-4">
            <Icon className="w-10 h-10 text-[#3c3cf6]" />
          </div>

          {/* Content */}
          <h3 className="text-2xl font-bold mb-3 text-white">
            {step.title}
          </h3>

          <p className="text-gray-400 leading-relaxed">
            {step.description}
          </p>
        </div>
      </Card>

      {/* Arrow connector - hidden on mobile, shown on desktop between cards */}
      {!isLast && (
        <div className="hidden md:block text-[#3c3cf6]/40">
          <ArrowRight className="w-8 h-8" />
        </div>
      )}
    </div>
  );
}
