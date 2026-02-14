'use client';

import { LANDING_STATS } from '@/constants';
import { cn } from '@/lib';
import type { StatsProps } from './Stats.types';

export function Stats({ className }: StatsProps) {
  return (
    <section className={cn('py-20 px-4', className)}>
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel p-12 md:p-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Join the Growing Community
            </h2>
            <p className="text-gray-400">
              Thousands of creators and supporters already trust DePatreon
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {LANDING_STATS.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="mb-2">
                  <span className="text-4xl md:text-5xl font-bold gradient-text-alt group-hover:scale-110 inline-block transition-transform duration-300">
                    {stat.value}
                  </span>
                  {stat.suffix && (
                    <span className="text-2xl md:text-3xl font-bold text-[#3c3cf6]">
                      {stat.suffix}
                    </span>
                  )}
                </div>
                <p className="text-sm md:text-base text-gray-400 uppercase tracking-wider font-semibold">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              * Mock data for demonstration purposes. Testnet statistics.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
