'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TrendingCreatorCard, TrendingCreatorCardSkeleton } from '../TrendingCreatorCard';
import { CreatorsEmptyState } from './CreatorsEmptyState';
import { CreatorsErrorState } from './CreatorsErrorState';
import type { TrendingCreatorsSectionProps } from './TrendingCreatorsSection.types';

const SLIDER_CLASS =
  'flex gap-4 overflow-x-auto pb-2 -mx-px snap-x snap-mandatory scroll-smooth no-scrollbar';

const SCROLL_OFFSET = 176; // card width (160) + gap (16)
const SCROLL_THRESHOLD = 2;

function getScrollState(el: HTMLDivElement | null) {
  if (!el) return { canScrollLeft: false, canScrollRight: false };
  const { scrollLeft, scrollWidth, clientWidth } = el;
  return {
    canScrollLeft: scrollLeft > SCROLL_THRESHOLD,
    canScrollRight: scrollLeft < scrollWidth - clientWidth - SCROLL_THRESHOLD,
  };
}

export function TrendingCreatorsSection({
  creators,
  isLoading,
  error,
}: TrendingCreatorsSectionProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: true });

  const updateScrollState = useCallback(() => {
    setScrollState((prev) => {
      const next = getScrollState(sliderRef.current);
      return prev.canScrollLeft !== next.canScrollLeft || prev.canScrollRight !== next.canScrollRight ? next : prev;
    });
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, isLoading, creators.length]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = sliderRef.current;
    if (!el) return;
    if (direction === 'left' && !scrollState.canScrollLeft) return;
    if (direction === 'right' && !scrollState.canScrollRight) return;
    const delta = direction === 'left' ? -SCROLL_OFFSET : SCROLL_OFFSET;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, [scrollState.canScrollLeft, scrollState.canScrollRight]);

  const showNav = isLoading || creators.length > 0;
  const btnBase = 'size-9 rounded-full flex items-center justify-center transition-all ';
  const btnActive = 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white cursor-pointer';
  const btnDisabled = 'bg-white/5 text-white/35 cursor-not-allowed opacity-50';

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white/90">Trending creators</h3>
        {showNav && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!scrollState.canScrollLeft}
              className={btnBase + (scrollState.canScrollLeft ? btnActive : btnDisabled)}
              aria-label="Précédent"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!scrollState.canScrollRight}
              className={btnBase + (scrollState.canScrollRight ? btnActive : btnDisabled)}
              aria-label="Suivant"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div ref={sliderRef} className={SLIDER_CLASS}>
          <div className="flex gap-4 shrink-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TrendingCreatorCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {error && <CreatorsErrorState message={error} />}

      {!isLoading && !error && creators.length === 0 && <CreatorsEmptyState />}

      {!isLoading && !error && creators.length > 0 && (
        <div ref={sliderRef} className={SLIDER_CLASS}>
          <div className="flex gap-4 shrink-0">
            {creators.map((creator) => (
              <TrendingCreatorCard key={creator.address} creator={creator} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
