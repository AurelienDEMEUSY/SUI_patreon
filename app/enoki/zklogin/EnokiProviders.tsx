"use client";

import {
  createNetworkConfig,
  SuiClientProvider,
  useSuiClientContext,
  WalletProvider,
} from "@mysten/dapp-kit";
import { isEnokiNetwork, registerEnokiWallets } from "@mysten/enoki";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import "@mysten/dapp-kit/dist/index.css";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" },
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" },
  devnet: { url: getJsonRpcFullnodeUrl("devnet"), network: "devnet" },
});

function RegisterEnokiWallets({ children }: { children: React.ReactNode }) {
  const { client, network } = useSuiClientContext();
  const apiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const ok = isEnokiNetwork(network) && !!apiKey && !!googleClientId;
      console.log("[Enoki]", ok ? "Enregistrement des wallets (Google…)" : "Skip:", { network, hasApiKey: !!apiKey, hasGoogleClientId: !!googleClientId });
    }
    if (!isEnokiNetwork(network) || !apiKey || !googleClientId) return;

    const { unregister } = registerEnokiWallets({
      apiKey,
      providers: {
        google: {
          clientId: googleClientId,
          redirectUrl: window.location.origin,
        },
      },
      client,
      network,
    });

    return unregister;
  }, [client, network, apiKey, googleClientId]);

  return <>{children}</>;
}

export function EnokiProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const defaultNetwork =
    (process.env.NEXT_PUBLIC_SUI_NETWORK as "testnet" | "mainnet" | "devnet") ??
    "testnet";

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={defaultNetwork}
      >
        <RegisterEnokiWallets>
          <WalletProvider autoConnect>{children}</WalletProvider>
        </RegisterEnokiWallets>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
