import type { EnokiNetwork } from "@mysten/enoki";
import { NextResponse } from "next/server";
import {
  ALLOWED_MOVE_CALL_TARGETS,
  ALLOWED_ADDRESSES,
} from "@/lib/contract-constants";

const ENOKI_API_BASE = "https://api.enoki.mystenlabs.com/v1";

export async function POST(request: Request) {
  let body: {
    transactionKindBytes: string;
    network?: string;
    sender: string;
    extraAllowedAddresses?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { transactionKindBytes, network, sender, extraAllowedAddresses } = body;
  if (!transactionKindBytes || !sender) {
    return NextResponse.json(
      { error: "transactionKindBytes and sender are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ENOKI_PRIVATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ENOKI_PRIVATE_API_KEY not configured" },
      { status: 500 }
    );
  }

  const targetNetwork = (network ?? "testnet") as EnokiNetwork;

  const requestBody = {
    network: targetNetwork,
    transactionBlockKindBytes: transactionKindBytes,
    sender,
    allowedMoveCallTargets: ALLOWED_MOVE_CALL_TARGETS,
    allowedAddresses: [
      ...ALLOWED_ADDRESSES,
      sender,
      ...(extraAllowedAddresses ?? []),
    ],
  };

  console.log("[sponsor] Requesting sponsored tx:", {
    network: targetNetwork,
    sender,
    transactionKindBytesLength: transactionKindBytes.length,
    allowedMoveCallTargets: ALLOWED_MOVE_CALL_TARGETS,
    allowedAddresses: requestBody.allowedAddresses,
  });

  try {
    const enokiRes = await fetch(`${ENOKI_API_BASE}/transaction-blocks/sponsor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const enokiData = await enokiRes.json();

    if (!enokiRes.ok) {
      console.error("[sponsor] Enoki API error:", {
        status: enokiRes.status,
        statusText: enokiRes.statusText,
        body: JSON.stringify(enokiData, null, 2),
      });
      return NextResponse.json(
        {
          error: enokiData?.message || enokiData?.error || `Enoki API error (${enokiRes.status})`,
          details: enokiData,
        },
        { status: 502 }
      );
    }

    const result = enokiData.data;
    console.log("[sponsor] Success:", { digest: result.digest });
    return NextResponse.json({ bytes: result.bytes, digest: result.digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sponsor failed";
    console.error("[sponsor] Fetch error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
