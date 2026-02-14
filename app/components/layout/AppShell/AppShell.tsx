'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';
import { CreateProfileForm } from '@/components/creator/CreateProfileForm';
import { useAutoRegister } from '@/hooks/useAutoRegister';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const account = useCurrentAccount();
  const router = useRouter();
  const { serviceObjectId, isRegistering, error: registerError, register } = useAutoRegister();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!account) {
      router.push('/');
    }
  }, [account, router]);

  if (!account) return null;

  const handleRegister = async (name: string, description: string) => {
    const result = await register(name, description);
    if (result) {
      setShowCreateForm(false);
    }
    return result;
  };

  return (
    <>
      {/* Ambient Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      {/* Create Profile Modal — only shown when user clicks the button */}
      {showCreateForm && (
        <CreateProfileForm
          onSubmit={handleRegister}
          isLoading={isRegistering}
          error={registerError}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Main Floating Layout Container */}
      <div className="flex h-screen w-full p-6 gap-6 overflow-hidden">
        <Sidebar
          className="shrink-0"
          isCreator={!!serviceObjectId}
          onBecomeCreator={() => setShowCreateForm(true)}
        />

        {/* Main Content Area: Topbar fixe, seul le contenu scroll */}
        <main className="flex-1 flex flex-col gap-6 min-h-0 min-w-0">
          <Topbar className="shrink-0" />
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
