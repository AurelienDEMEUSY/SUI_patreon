"use client";

import {
  useCurrentAccount,
  useSignTransaction,
  useSuiClient,
  useSuiClientContext,
} from "@mysten/dapp-kit";
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

/**
 * Hook to sponsor and execute a transaction via Enoki.
 *
 * Uses the "sender" variant of the Enoki API:
 * - No JWT / zkLogin session required
 * - Works with any connected wallet (Enoki or standard)
 * - allowedMoveCallTargets & allowedAddresses are passed inline by the backend
 *
 * Flow:
 *   1. Build tx with onlyTransactionKind: true
 *   2. POST to /api/enoki/sponsor with { sender, transactionKindBytes, network }
 *   3. Sign the sponsored bytes with the user's wallet
 *   4. POST to /api/enoki/execute with { digest, signature }
 *
 * @see https://docs.enoki.mystenlabs.com/ts-sdk/examples
 */
export function useSponsoredTransaction(): UseSponsoredTransactionResult {
  const client = useSuiClient();
  const { network } = useSuiClientContext();
  const currentAccount = useCurrentAccount();
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

      if (!currentAccount) {
        throw new Error("No wallet connected.");
      }

      const sender = currentAccount.address;

      // 1. Build transaction kind bytes (no gas data)
      const txBytes = await transaction.build({
        client,
        onlyTransactionKind: true,
      });
      const transactionKindBytes = toBase64(txBytes);

      // 2. Sponsor via backend (sender variant — no JWT needed)
      const sponsorRes = await fetch("/api/enoki/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionKindBytes,
          network: targetNetwork,
          sender,
        }),
      });
      if (!sponsorRes.ok) {
        const data = await sponsorRes.json().catch(() => ({}));
        throw new Error(data.error ?? `Sponsor failed (${sponsorRes.status})`);
      }
      const { bytes, digest } = await sponsorRes.json();

      // 3. Sign the sponsored transaction bytes
      const { signature } = await signTransaction({
        transaction: bytes,
      });

      // 4. Execute via backend
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
    sponsorAndExecute: (
      transaction: Transaction,
      options?: SponsorAndExecuteOptions
    ) =>
      mutation.mutateAsync({
        transaction,
        networkOverride: options?.network,
      }),
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
