import { EnokiClient } from "@mysten/enoki";

let clientInstance: EnokiClient | null = null;

/**
 * Returns a singleton EnokiClient instance for client-side use (e.g. sponsored transactions with zkLogin JWT).
 * Uses NEXT_PUBLIC_ENOKI_API_KEY from the environment.
 */
export function getEnokiClient(): EnokiClient {
  const apiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_ENOKI_API_KEY is not set. Add it to your .env.local."
    );
  }
  if (!clientInstance) {
    clientInstance = new EnokiClient({ apiKey });
  }
  return clientInstance;
}
