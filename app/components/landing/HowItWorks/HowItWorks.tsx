'use client';

import { LANDING_STEPS } from '@/constants';
import { cn } from '@/lib';
import { StepCard } from './StepCard';
import type { HowItWorksProps } from './HowItWorks.types';

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <section id="how-it-works" className={cn('py-20 px-4', className)}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Get started in minutes. No crypto experience required.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-stretch">
          {LANDING_STEPS.map((step, index) => (
            <StepCard
              key={step.number}
              step={step}
              isLast={index === LANDING_STEPS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
