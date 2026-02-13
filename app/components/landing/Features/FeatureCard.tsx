'use client';

import { LockKeyhole, Zap, ShieldCheck, UserCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { FeatureCardProps } from './Features.types';

const iconMap = {
  'lock-keyhole': LockKeyhole,
  'zap': Zap,
  'shield-check': ShieldCheck,
  'user-circle': UserCircle,
};

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = iconMap[feature.icon as keyof typeof iconMap] || ShieldCheck;

  return (
    <Card hover className="p-6 group">
      <div className="flex flex-col items-center text-center h-full">
        <div className="mb-4 p-4 rounded-2xl glass-panel group-hover:bg-[#3c3cf6]/20 transition-all duration-300">
          <Icon className="w-8 h-8 text-[#3c3cf6]" />
        </div>

        <h3 className="text-xl font-bold mb-3 text-white group-hover:gradient-text-alt transition-all duration-300">
          {feature.title}
        </h3>

        <p className="text-gray-400 text-sm leading-relaxed">
          {feature.description}
        </p>
      </div>
    </Card>
  );
}
