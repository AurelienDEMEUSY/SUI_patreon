import type { EnokiNetwork } from "@mysten/enoki";
import { NextResponse } from "next/server";
import { getEnokiServerClient } from "@/enoki/sponsor/createEnokiClient";
import {
  ALLOWED_MOVE_CALL_TARGETS,
  ALLOWED_ADDRESSES,
} from "@/lib/contract-constants";

/**
 * Sponsor a transaction using the "sender" variant of the Enoki API.
 *
 * Unlike the JWT variant, this passes `sender` (the user's address) and
 * `allowedMoveCallTargets` / `allowedAddresses` inline — no Portal config
 * or paid plan credits required for testnet.
 *
 * @see https://docs.enoki.mystenlabs.com/ts-sdk/examples
 */
export async function POST(request: Request) {
  let body: {
    transactionKindBytes: string;
    network?: string;
    sender: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { transactionKindBytes, network, sender } = body;
  if (!transactionKindBytes || !sender) {
    return NextResponse.json(
      { error: "transactionKindBytes and sender are required" },
      { status: 400 }
    );
  }

  try {
    const client = getEnokiServerClient();
    const targetNetwork = (network ?? "testnet") as EnokiNetwork;

    console.log("[sponsor] Requesting sponsored tx:", {
      network: targetNetwork,
      sender,
      transactionKindBytesLength: transactionKindBytes.length,
    });

    const result = await client.createSponsoredTransaction({
      network: targetNetwork,
      transactionKindBytes,
      sender,
      allowedMoveCallTargets: ALLOWED_MOVE_CALL_TARGETS,
      allowedAddresses: [...ALLOWED_ADDRESSES, sender],
    });

    console.log("[sponsor] Success:", { digest: result.digest });
    return NextResponse.json({ bytes: result.bytes, digest: result.digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sponsor failed";
    console.error("[sponsor] ERROR:", message);
    if (err instanceof Error) {
      console.error("[sponsor] Stack:", err.stack);
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
