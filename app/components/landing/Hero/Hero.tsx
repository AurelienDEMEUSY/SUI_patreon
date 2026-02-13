'use client';

import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { APP_CONFIG, ROUTES } from '@/constants';
import { cn } from '@/lib';
import type { HeroProps } from './Hero.types';

export function Hero({ className }: HeroProps) {
  return (
    <section className={cn('relative min-h-screen flex items-center justify-center px-4 py-20', className)}>
      <div className="glass-panel max-w-5xl mx-auto p-8 md:p-12 lg:p-16 text-center z-10">
        <Badge variant="primary" className="mb-6 animate-pulse">
          <Sparkles className="w-3 h-3 mr-1" />
          Powered by SUI Blockchain
        </Badge>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 gradient-text leading-tight">
          {APP_CONFIG.tagline.split('. ').map((line, i) => (
            <span key={i} className="block">
              {line}
              {i === 0 && '.'}
            </span>
          ))}
        </h1>

        <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          The first fully decentralized creator platform. Zero gas fees, encrypted content, and true ownership. Built on SUI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="primary" size="lg" href={ROUTES.FEED} icon={<ArrowRight className="w-5 h-5" />}>
            Launch App
          </Button>
          <Button variant="secondary" size="lg" href="#how-it-works">
            Learn More
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Testnet Live</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/20" />
          <span>Zero Gas Fees</span>
          <div className="hidden sm:block w-px h-4 bg-white/20" />
          <span>End-to-End Encrypted</span>
        </div>
      </div>
    </section>
  );
}
