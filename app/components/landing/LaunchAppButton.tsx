'use client';

import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LaunchAppButtonProps {
    className?: string;
}

export function LaunchAppButton({ className }: LaunchAppButtonProps) {
    const account = useCurrentAccount();
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (account) {
            router.push('/app');
        }
    }, [account, router]);

    const defaultClassName = "min-w-[200px] h-14 bg-[#3c3cf6] text-white font-bold rounded-xl text-lg shadow-[0_0_40px_-10px_rgba(60,60,246,0.5)] hover:shadow-[0_0_50px_-5px_rgba(60,60,246,0.6)] transition-all";
    const buttonClassName = className || defaultClassName;

    if (account) {
        return (
            <Link href="/app">
                <button className={buttonClassName}>
                    Launch App
                </button>
            </Link>
        );
    }

    return (
        <ConnectModal
            trigger={
                <button disabled={open} className={buttonClassName}>
                    Connect Wallet
                </button>
            }
            open={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
        />
    );
}
