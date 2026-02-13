'use client';

import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import React, { useState } from 'react';

export function LaunchAppButton({ className, children }: { className?: string, children?: React.ReactNode }) {
    const account = useCurrentAccount();
    const [open, setOpen] = useState(false);

    const defaultClasses = "min-w-[200px] h-14 bg-[#3c3cf6] text-white font-bold rounded-xl text-lg shadow-[0_0_40px_-10px_rgba(60,60,246,0.5)] hover:shadow-[0_0_50px_-5px_rgba(60,60,246,0.6)] transition-all";
    const buttonClass = className || defaultClasses;

    if (account) {
        return (
            <Link href="/app">
                <button className={buttonClass}>
                    {children || "Launch App"}
                </button>
            </Link>
        );
    }

    return (
        <ConnectModal
            trigger={
                <button disabled={open} className={buttonClass}>
                    {children || "Connect Wallet"}
                </button>
            }
            open={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
        />
    );
}
