'use client';

export function ArticleCardSkeleton() {
    return (
        <div className="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden animate-pulse">
            <div className="aspect-[4/3] w-full bg-white/10" />
            <div className="p-4 flex flex-col gap-2">
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/5 mt-1" />
            </div>
        </div>
    );
}
