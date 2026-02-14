'use client';

/**
 * Skeleton loading state for creator profile / creator hub.
 * Matches the layout: full-width banner + overlapping card with avatar and lines.
 */
export function CreatorProfileSkeleton() {
    return (
        <div className="w-full pb-20">
            <div className="w-full h-36 md:h-44 lg:h-52 bg-white/[0.03] animate-pulse rounded-b-2xl" />
            <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 -mt-20 relative z-10">
                <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 p-6 flex gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-white/[0.06] animate-pulse shrink-0" />
                    <div className="flex-1 space-y-4">
                        <div className="h-6 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
                        <div className="h-4 w-full max-w-sm bg-white/[0.04] rounded animate-pulse" />
                        <div className="flex gap-6 pt-2">
                            <span className="h-4 w-20 bg-white/[0.05] rounded animate-pulse" />
                            <span className="h-4 w-16 bg-white/[0.05] rounded animate-pulse" />
                            <span className="h-4 w-14 bg-white/[0.05] rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
