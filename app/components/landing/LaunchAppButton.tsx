'use client';

import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useState } from 'react';

export function LaunchAppButton() {
    const account = useCurrentAccount();
    const [open, setOpen] = useState(false);

    if (account) {
        return (
            <Link href="/app">
                <button className="min-w-[200px] h-14 bg-[#3c3cf6] text-white font-bold rounded-xl text-lg shadow-[0_0_40px_-10px_rgba(60,60,246,0.5)] hover:shadow-[0_0_50px_-5px_rgba(60,60,246,0.6)] transition-all">
                    Launch App
                </button>
            </Link>
        );
    }

    return (
        <ConnectModal
            trigger={
                <button disabled={open} className="min-w-[200px] h-14 bg-[#3c3cf6] text-white font-bold rounded-xl text-lg shadow-[0_0_40px_-10px_rgba(60,60,246,0.5)] hover:shadow-[0_0_50px_-5px_rgba(60,60,246,0.6)] transition-all">
                    Connect Wallet
                </button>
            }
            open={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
        />
    );
}
