'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import type { TopbarProps } from '@/types';

function truncateAddress(address: string, chars = 6): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function Topbar({ className = '' }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNotificationsOpen]);

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
        <div className="relative" ref={notificationsRef}>
          <button
            className="glass-card size-12 flex items-center justify-center rounded-2xl relative text-white/70 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-3 right-3 size-2 bg-[#3c3cf6] rounded-full border-2 border-[#0a0a18]"></span>
          </button>

          {/* Notifications Dropdown */}
          <div
            className={`absolute right-0 mt-2 w-80 glass-card rounded-2xl border border-white/10 shadow-xl overflow-hidden transition-all duration-300 origin-top-right ${
              isNotificationsOpen
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-white font-semibold">Notifications</h3>
            </div>

            {/* Empty State */}
            <div className="px-4 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/40 text-3xl">notifications_off</span>
                </div>
                <div>
                  <p className="text-white/70 font-medium">No notifications yet</p>
                  <p className="text-white/40 text-sm mt-1">We'll notify you when something arrives</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
