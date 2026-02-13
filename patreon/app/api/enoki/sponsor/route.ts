import { EnokiClient } from "@mysten/enoki";
import type { EnokiNetwork } from "@mysten/enoki";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.ENOKI_PRIVATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ENOKI_PRIVATE_API_KEY is not set" },
      { status: 500 }
    );
  }

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
    const client = new EnokiClient({ apiKey });
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
