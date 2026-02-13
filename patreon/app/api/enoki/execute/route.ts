import { EnokiClient } from "@mysten/enoki";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.ENOKI_PRIVATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ENOKI_PRIVATE_API_KEY is not set" },
      { status: 500 }
    );
  }

  let body: { digest: string; signature: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { digest, signature } = body;
  if (!digest || !signature) {
    return NextResponse.json(
      { error: "digest and signature are required" },
      { status: 400 }
    );
  }

  try {
    const client = new EnokiClient({ apiKey });
    await client.executeSponsoredTransaction({ digest, signature });
    return NextResponse.json({ digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execute failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
