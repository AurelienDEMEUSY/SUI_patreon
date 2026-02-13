import { NextResponse } from "next/server";
import { getEnokiServerClient } from "@/enoki/sponsor/createEnokiClient";

export async function POST(request: Request) {
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
    const client = getEnokiServerClient();
    await client.executeSponsoredTransaction({ digest, signature });
    return NextResponse.json({ digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execute failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
