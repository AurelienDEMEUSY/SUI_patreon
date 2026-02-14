'use client';

export function CreatorsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-gray-600">person_search</span>
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">No creators yet</h3>
      <p className="text-gray-500 text-sm max-w-xs">
        Be the first! Connect your wallet and your creator profile will be created automatically.
      </p>
    </div>
  );
}
