'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import { LaunchAppButton } from './LaunchAppButton';

export function NavbarButtons() {
    const account = useCurrentAccount();

    return (
        <div className="flex items-center gap-4">
            {!account && (
                <Link href="/login" className="text-sm font-medium hover:text-white transition-colors px-4">
                    Sign In
                </Link>
            )}
            <LaunchAppButton className="bg-[#3c3cf6] hover:bg-[#3c3cf6]/90 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all active:scale-95" />
        </div>
    );
}
