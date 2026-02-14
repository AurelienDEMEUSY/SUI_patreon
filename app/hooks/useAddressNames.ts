'use client';

import { useState, useEffect, useRef } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/lib/contract-constants';

// ============================================================
// useAddressNames — resolve addresses to creator names
// ============================================================

/**
 * Cache of address -> display name, shared across all instances.
 * Falls back to abbreviated address if no creator profile found.
 */
const nameCache = new Map<string, string>();

function abbreviate(addr: string): string {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Resolves a list of addresses to their on-chain creator names.
 * Returns a map of address -> display name.
 */
export function useAddressNames(addresses: string[]): Record<string, string> {
    const [names, setNames] = useState<Record<string, string>>({});
    const suiClient = useSuiClient();
    const prevAddressesRef = useRef<string>('');

    useEffect(() => {
        const unique = [...new Set(addresses)].filter(Boolean);
        const key = unique.sort().join(',');

        // Skip if addresses haven't changed
        if (key === prevAddressesRef.current) return;
        prevAddressesRef.current = key;

        if (unique.length === 0) {
            setNames({});
            return;
        }

        // Build initial names from cache
        const initial: Record<string, string> = {};
        const toResolve: string[] = [];
        for (const addr of unique) {
            if (nameCache.has(addr)) {
                initial[addr] = nameCache.get(addr)!;
            } else {
                initial[addr] = abbreviate(addr);
                toResolve.push(addr);
            }
        }
        setNames(initial);

        if (toResolve.length === 0) return;

        let cancelled = false;

        const resolve = async () => {
            try {
                // Query CreatorRegistered events to find creator names
                const events = await suiClient.queryEvents({
                    query: { MoveEventType: `${PACKAGE_ID}::service::CreatorRegistered` },
                    limit: 50,
                });

                if (cancelled) return;

                const resolved: Record<string, string> = {};
                for (const event of events.data) {
                    const parsed = event.parsedJson as { creator?: string; name?: string };
                    if (parsed?.creator && parsed?.name && toResolve.includes(parsed.creator)) {
                        resolved[parsed.creator] = parsed.name;
                        nameCache.set(parsed.creator, parsed.name);
                    }
                }

                // Cache abbreviations for addresses that aren't creators
                for (const addr of toResolve) {
                    if (!resolved[addr]) {
                        nameCache.set(addr, abbreviate(addr));
                    }
                }

                if (!cancelled) {
                    setNames((prev) => ({ ...prev, ...resolved }));
                }
            } catch (err) {
                console.error('[useAddressNames] resolve error:', err);
            }
        };

        resolve();

        return () => { cancelled = true; };
    }, [addresses, suiClient]);

    return names;
}
