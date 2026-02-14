'use client';

import Link from 'next/link';
import { useAllCreators } from '@/hooks/useAllCreators';
import { format } from '@/lib/format';

export default function AppPage() {
  const { creators, isLoading, error } = useAllCreators();

  return (
    <>
      <section className="relative w-full aspect-[21/9] min-h-[300px] rounded-3xl overflow-hidden glass-panel group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3c3cf6]/30 via-[#0a0a18] to-purple-900/20"></div>
        <div className="relative h-full flex flex-col justify-center p-8 lg:p-12 max-w-2xl">
          <span className="bg-[#3c3cf6]/20 border border-[#3c3cf6]/40 text-[#3c3cf6] px-3 py-1 rounded-full text-xs font-bold w-fit mb-4">
            DECENTRALIZED CREATORS
          </span>
          <h1 className="text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Discover On-Chain Creators
          </h1>
          <p className="text-white/70 text-lg mb-8 line-clamp-2">
            Real creators registered on the Sui blockchain. Subscribe to their tiers, access exclusive encrypted content.
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Registered Creators</h3>
          <span className="text-white/40 text-sm font-medium">
            {isLoading ? 'Loading…' : `${creators.length} creator${creators.length === 1 ? '' : 's'} on-chain`}
          </span>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
                <div className="h-40 rounded-xl bg-white/[0.04] mb-4" />
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-full bg-white/[0.06]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 bg-white/[0.06] rounded" />
                    <div className="h-3 w-48 bg-white/[0.04] rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 text-red-300">
            <span className="material-symbols-outlined">error</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {!isLoading && !error && creators.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-gray-600">person_search</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">No creators yet</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Be the first! Connect your wallet and your creator profile will be created automatically.
            </p>
          </div>
        )}

        {!isLoading && creators.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <div key={creator.address} className="glass-card rounded-2xl overflow-hidden p-4 group">
                {/* Banner / gradient */}
                <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-[#3c3cf6]/20 via-purple-600/10 to-pink-500/10 flex items-center justify-center">
                  <span className="text-6xl font-black text-white/10 select-none">{creator.name.charAt(0)}</span>
                  {creator.tiers.length > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="backdrop-blur-md bg-[#3c3cf6]/80 px-2 py-1 rounded text-[10px] font-bold">
                        {creator.tiers.length} TIER{creator.tiers.length > 1 ? 'S' : ''}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-full border-2 border-white/10 bg-gradient-to-br from-[#3c3cf6]/30 to-purple-500/20 flex items-center justify-center text-xl font-bold shrink-0">
                    {creator.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold truncate">{creator.name}</h4>
                    <p className="text-xs text-white/50 mb-2 truncate">{creator.bio || 'On-chain creator'}</p>
                    <div className="flex gap-4 text-xs font-semibold text-white/70">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">description</span> {creator.totalContent} posts
                      </span>
                      {creator.tiers.length > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">workspace_premium</span>
                          from {format.mistToSui(Math.min(...creator.tiers.map((t) => t.priceInMist)))} SUI
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/30 mt-1.5 font-mono truncate">
                      {creator.address.slice(0, 8)}…{creator.address.slice(-6)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/creator/${creator.address}`}
                  className="block w-full text-center mt-4 py-3 rounded-xl bg-white/5 hover:bg-[#3c3cf6] border border-white/10 hover:border-[#3c3cf6] transition-all text-sm font-bold"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
          <p className="text-white/40 text-sm font-medium mb-1">Platform Stats</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black">{creators.length}</h2>
            <span className="text-white/60 text-sm font-bold mb-2">registered creators</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg">Fully On-Chain</h4>
            <p className="text-white/40 text-sm">All data comes from the Sui blockchain. No mock data.</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                Testnet Live
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="h-8"></div>
    </>
  );
}
