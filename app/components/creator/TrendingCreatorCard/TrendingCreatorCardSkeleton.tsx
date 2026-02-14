'use client';

export function TrendingCreatorCardSkeleton() {
  return (
    <div className="w-[160px] shrink-0 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col animate-pulse snap-center">
      <div className="w-full aspect-square bg-white/[0.06]" />
      <div className="p-3 flex flex-col items-center justify-center">
        <div className="h-4 w-20 bg-white/[0.06] rounded mb-1.5 mx-auto" />
        <div className="h-3 w-14 bg-white/[0.04] rounded mx-auto" />
      </div>
    </div>
  );
}
