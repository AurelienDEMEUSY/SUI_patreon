'use client';

import { useState } from 'react';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import type { TopbarProps } from '@/types';

function truncateAddress(address: string, chars = 6): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function Topbar({ className = '' }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  return (
    <header className={`flex items-center justify-between gap-4 py-2 ${className}`}>
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">search</span>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#3c3cf6]/50 focus:border-[#3c3cf6]/50 backdrop-blur-xl transition-all"
            placeholder="Search for creators, art, music..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="glass-card size-12 flex items-center justify-center rounded-2xl relative text-white/70 hover:text-white hover:bg-white/10">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-3 right-3 size-2 bg-[#3c3cf6] rounded-full border-2 border-[#0a0a18]"></span>
        </button>
      </div>
    </header>
  );
}
