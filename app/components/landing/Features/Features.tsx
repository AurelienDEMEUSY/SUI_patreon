'use client';

import { LANDING_FEATURES } from '@/constants';
import { cn } from '@/lib';
import { FeatureCard } from './FeatureCard';
import type { FeaturesProps } from './Features.types';

export function Features({ className }: FeaturesProps) {
  return (
    <section className={cn('py-20 px-4', className)}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Why DePatreon?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Built from the ground up for creators who value freedom, security, and true ownership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {LANDING_FEATURES.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
