"use client";

import {
  useCurrentWallet,
  useSignTransaction,
  useSuiClient,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { getSession, isEnokiWallet } from "@mysten/enoki";
import type { EnokiNetwork } from "@mysten/enoki";
import type { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";
import { useMutation } from "@tanstack/react-query";

export type SponsorAndExecuteOptions = {
  network?: EnokiNetwork;
};

export type UseSponsoredTransactionResult = {
  sponsorAndExecute: (
    transaction: Transaction,
    options?: SponsorAndExecuteOptions
  ) => Promise<{ digest: string }>;
  isPending: boolean;
  error: Error | null;
};

export function useSponsoredTransaction(): UseSponsoredTransactionResult {
  const client = useSuiClient();
  const { network } = useSuiClientContext();
  const currentWallet = useCurrentWallet();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const mutation = useMutation({
    mutationFn: async ({
      transaction,
      networkOverride,
    }: {
      transaction: Transaction;
      networkOverride?: EnokiNetwork;
    }) => {
      const targetNetwork = (networkOverride ?? network) as EnokiNetwork;

      const wallet = currentWallet?.currentWallet ?? null;
      if (!wallet) {
        throw new Error("No wallet connected.");
      }
      if (!isEnokiWallet(wallet)) {
        throw new Error(
          "Sponsored transactions require an Enoki (zkLogin) wallet. Connect with Sign in with Google (or another Enoki provider) first."
        );
      }

      const session = await getSession(wallet, {
        network: targetNetwork,
      });
      const jwt = session?.jwt;
      if (!jwt) {
        throw new Error(
          "No active zkLogin session. Please sign in again with your Enoki wallet."
        );
      }

      const txBytes = await transaction.build({
        client,
        onlyTransactionKind: true,
      });
      const transactionKindBytes = toBase64(txBytes);

      const sponsorRes = await fetch("/api/enoki/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionKindBytes,
          network: targetNetwork,
          jwt,
        }),
      });
      if (!sponsorRes.ok) {
        const data = await sponsorRes.json().catch(() => ({}));
        throw new Error(data.error ?? `Sponsor failed (${sponsorRes.status})`);
      }
      const { bytes, digest } = await sponsorRes.json();

      const { signature } = await signTransaction({
        transaction: bytes,
      });

      const executeRes = await fetch("/api/enoki/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digest, signature }),
      });
      if (!executeRes.ok) {
        const data = await executeRes.json().catch(() => ({}));
        throw new Error(data.error ?? `Execute failed (${executeRes.status})`);
      }

      return { digest };
    },
  });

  return {
    sponsorAndExecute: (transaction: Transaction, options?: SponsorAndExecuteOptions) =>
      mutation.mutateAsync({
        transaction,
        networkOverride: options?.network,
      }),
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
