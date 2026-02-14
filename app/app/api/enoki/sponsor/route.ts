import type { EnokiNetwork } from "@mysten/enoki";
import { NextResponse } from "next/server";
import { getEnokiServerClient } from "@/enoki/sponsor/createEnokiClient";

/**
 * When using JWT (zkLogin), allowedMoveCallTargets and allowedAddresses
 * must be configured in the Enoki Portal, not passed in the API call.
 * See docs/ENOKI_PORTAL_SETUP.md for the allowlist.
 */
export async function POST(request: Request) {
  let body: { transactionKindBytes: string; network?: string; jwt: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { transactionKindBytes, network, jwt } = body;
  if (!transactionKindBytes || !jwt) {
    return NextResponse.json(
      { error: "transactionKindBytes and jwt are required" },
      { status: 400 }
    );
  }

  try {
    const client = getEnokiServerClient();
    const result = await client.createSponsoredTransaction({
      network: (network ?? "testnet") as EnokiNetwork,
      transactionKindBytes,
      jwt,
    });
    return NextResponse.json({ bytes: result.bytes, digest: result.digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sponsor failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
