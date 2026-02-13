import { EnokiClient } from "@mysten/enoki";

let clientInstance: EnokiClient | null = null;

/**
 * Returns a singleton EnokiClient for server-side use (sponsored transactions).
 * Uses ENOKI_PRIVATE_API_KEY — must only be called from API routes / server code.
 */
export function getEnokiServerClient(): EnokiClient {
  const apiKey = process.env.ENOKI_PRIVATE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ENOKI_PRIVATE_API_KEY is not set. Add it to your .env.local."
    );
  }
  if (!clientInstance) {
    clientInstance = new EnokiClient({ apiKey });
  }
  return clientInstance;
}
