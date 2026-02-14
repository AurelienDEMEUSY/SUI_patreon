'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ZkLoginButton } from '@/enoki/zklogin';

export default function LoginPage() {
  const account = useCurrentAccount();
  const router = useRouter();

  useEffect(() => {
    if (account) {
      router.replace('/app');
    }
  }, [account, router]);

  return (
    <div className="bg-black min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] glow-indigo rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] glow-violet rounded-full" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] glow-indigo opacity-50 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 justify-center mb-12">
          <div className="w-10 h-10 flex items-center justify-center bg-[#3c3cf6] rounded-xl">
            <span className="material-symbols-outlined text-white text-2xl">star</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">DePatreon</span>
        </Link>

        {/* Login Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8">
          <h1 className="text-3xl font-black text-white text-center mb-2">
            Welcome back
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Sign in to access your creator dashboard and subscriptions.
          </p>

          {/* ZkLogin Buttons */}
          <ZkLoginButton
            className="flex flex-col gap-3"
            connectedClassName="flex flex-col items-center gap-3"
          />

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              By signing in, you agree to our Terms of Service. Your wallet is
              derived from your social login via ZkLogin — no seed phrase needed.
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
