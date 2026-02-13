"use client";

import {
  useConnectWallet,
  useCurrentAccount,
  useDisconnectWallet,
  useWallets,
} from "@mysten/dapp-kit";
import type { EnokiWallet } from "@mysten/enoki";
import { isEnokiWallet } from "@mysten/enoki";
import type { AuthProvider } from "@mysten/enoki";

export type ZkLoginButtonProps = {
  className?: string;
  connectedClassName?: string;
  disconnectLabel?: string;
};

const PROVIDER_LABELS: Partial<Record<AuthProvider, string>> = {
  google: "Sign in with Google",
  facebook: "Sign in with Facebook",
  twitch: "Sign in with Twitch",
};

function truncateAddress(address: string, chars = 6): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function ZkLoginButton({
  className,
  connectedClassName,
  disconnectLabel = "Disconnect",
}: ZkLoginButtonProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();

  const enokiWallets = wallets.filter(isEnokiWallet) as EnokiWallet[];
  const walletsByProvider = enokiWallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWallet>(),
  );

  if (currentAccount) {
    return (
      <div className={connectedClassName} data-state="connected">
        <span className="font-mono text-sm">
          {truncateAddress(currentAccount.address)}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="ml-2 rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          {disconnectLabel}
        </button>
      </div>
    );
  }

  const hasAnyEnoki = enokiWallets.length > 0;

  return (
    <div className={className} data-state="disconnected">
      {hasAnyEnoki ? (
        (["google", "facebook", "twitch"] as const).map((provider) => {
          const wallet = walletsByProvider.get(provider);
          const label = PROVIDER_LABELS[provider];
          if (!wallet || !label) return null;
          return (
            <button
              key={provider}
              type="button"
              onClick={() => connect({ wallet })}
              className="rounded-full border border-black/[.08] bg-white px-5 py-2.5 text-base font-medium transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              {label}
            </button>
          );
        })
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          zkLogin non disponible. Vérifiez NEXT_PUBLIC_ENOKI_API_KEY et
          NEXT_PUBLIC_GOOGLE_CLIENT_ID dans .env puis redémarrez le serveur.
        </p>
      )}
    </div>
  );
}
