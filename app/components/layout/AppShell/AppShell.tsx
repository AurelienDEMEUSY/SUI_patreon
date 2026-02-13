'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const account = useCurrentAccount();
  const router = useRouter();

  useEffect(() => {
    if (!account) {
      router.push('/');
    }
  }, [account, router]);

  if (!account) return null;

  return (
    <>
      {/* Ambient Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      {/* Main Floating Layout Container */}
      <div className="flex h-screen w-full p-6 gap-6 overflow-hidden">
        <Sidebar className="shrink-0" />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <Topbar />
          {children}
        </main>
      </div>
    </>
  );
}
