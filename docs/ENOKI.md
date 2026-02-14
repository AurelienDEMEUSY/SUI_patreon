# Enoki — Sponsored Transactions (Gas Paid by the App)

This document describes the **Enoki** integration in the project for **sponsored transactions**: the user never pays gas; the application (via the Enoki API key) pays.

---

## Table of contents

1. [What is Enoki?](#1-what-is-enoki)
2. [Sponsored Flow Overview](#2-sponsored-flow-overview)
3. [Architecture in the Project](#3-architecture-in-the-project)
4. [Detailed Flow (Code)](#4-detailed-flow-code)
5. [Configuration](#5-configuration)
6. [Allowed Addresses](#6-allowed-addresses)
7. [Usage in the App](#7-usage-in-the-app)
8. [Troubleshooting](#8-troubleshooting)
9. [References](#9-references)

---

## 1. What is Enoki?

- **Enoki** (Mysten Labs) provides:
  - **ZkLogin**: sign-in with Google / Twitch / etc. and derivation of a SUI address.
  - **Sponsored transactions**: another address (the “sponsor”) pays gas on behalf of the user.

In this project, Enoki is used mainly for **gas sponsoring**: all on-chain actions (create profile, add tier, subscribe, publish post, etc.) go through a sponsored tx. The user signs the transaction but does not spend SUI on gas.

- **Official docs:** [docs.enoki.mystenlabs.com](https://docs.enoki.mystenlabs.com)
- **HTTP API:** [docs.enoki.mystenlabs.com/http-api/openapi](https://docs.enoki.mystenlabs.com/http-api/openapi)

---

## 2. Sponsored Flow Overview

1. **Frontend**: build the transaction **without** a gas block (`onlyTransactionKind: true`).
2. **Backend**: send this tx + the sender address to the Enoki **Sponsor** API. Enoki adds gas (paid by the account tied to your API key) and returns a full tx (bytes + digest).
3. **Frontend**: the user signs these bytes with their wallet (they sign as **sender**, not as gas payer).
4. **Backend**: send the signature + digest to the Enoki **Execute** API. Enoki submits the tx to the network; gas is debited from Enoki, not the user.

On-chain result: **sender** = user, **gas payer** = Enoki account.

---

## 3. Architecture in the Project

```
Frontend (app/)
├── enoki/sponsor/
│   ├── useSponsoredTransaction.ts   ← Main hook: sponsorAndExecute(tx)
│   ├── createEnokiClient.ts         ← Enoki client (server-side, execute)
│   └── index.ts
├── app/api/enoki/
│   ├── sponsor/route.ts             ← POST: receives tx + sender → calls Enoki sponsor
│   └── execute/route.ts             ← POST: receives digest + signature → Enoki execute
└── lib/
    ├── contract-constants.ts        ← ALLOWED_MOVE_CALL_TARGETS, ALLOWED_ADDRESSES
    └── contract.ts                  ← Tx builders (buildCreateProfile, buildSubscribe, …)
```

- **No user tx should be signed/executed outside this flow** for sponsored actions (no direct `signAndExecuteTransaction` with user gas).
- Tx builders in `lib/contract.ts` must **not** use `tx.gas`; gas is always added by Enoki.

---

## 4. Detailed Flow (Code)

### 4.1 Frontend — Building the tx

The transaction is built **without** gas:

```ts
const txBytes = await transaction.build({
  client,
  onlyTransactionKind: true,
});
const transactionKindBytes = toBase64(txBytes);
```

### 4.2 Frontend → Backend: Sponsor Request

`POST /api/enoki/sponsor` with e.g.:

```json
{
  "transactionKindBytes": "<base64>",
  "network": "testnet",
  "sender": "0x...",
  "extraAllowedAddresses": ["0x..."]
}
```

### 4.3 Backend → Enoki API: Sponsor

The route `app/api/enoki/sponsor/route.ts`:

- Reads `transactionKindBytes`, `sender`, `extraAllowedAddresses`.
- Calls `POST https://api.enoki.mystenlabs.com/v1/transaction-blocks/sponsor` with:
  - `transactionBlockKindBytes`
  - `sender`
  - `allowedMoveCallTargets` (from `contract-constants.ts`)
  - `allowedAddresses` = `ALLOWED_ADDRESSES` + `sender` + `extraAllowedAddresses`
- Enoki returns `bytes` (full tx with gas) and `digest`.

### 4.4 Frontend: Signature

The user signs the returned `bytes` (already “sponsored” tx):

```ts
const { signature } = await signTransaction({ transaction: bytes });
```

### 4.5 Frontend → Backend: Execute

`POST /api/enoki/execute` with `{ digest, signature }`. The route `execute/route.ts` calls the Enoki client:

```ts
await client.executeSponsoredTransaction({ digest, signature });
```

Enoki then submits the tx to the network; gas is debited from the Enoki account.

---

## 5. Configuration

### 5.1 Environment Variables

| Variable | Side | Description |
|----------|------|-------------|
| `ENOKI_PRIVATE_API_KEY` | Server | Enoki private API key (dashboard). **Never expose on the client.** |

The key is used in:

- `app/api/enoki/sponsor/route.ts` (HTTP call to Enoki sponsor API).
- `app/enoki/sponsor/createEnokiClient.ts` (client for `executeSponsoredTransaction`).

### 5.2 Enoki Dashboard — Allowed Move Call Targets

In the [Enoki portal](https://portal.enoki.mystenlabs.com), you configure **Allowed Move Call Targets**: only the listed Move functions can be sponsored.

For this project, the list must include at least the entry points actually called by the frontend via `sponsorAndExecute`:

- `service::create_creator_profile`
- `service::update_creator_profile`
- `service::delete_creator_profile`
- `service::add_subscription_tier`
- `service::remove_subscription_tier`
- `service::publish_post`
- `service::update_post`
- `service::set_post_visibility`
- `service::delete_post`
- `service::withdraw_creator_funds`
- `subscription::subscribe`

Format: `{PACKAGE_ID}::module::function` (e.g. `0x...::service::create_creator_profile`).

The list in code (`lib/contract-constants.ts` — `ALLOWED_MOVE_CALL_TARGETS`) is sent with every sponsor request; it should match the dashboard config (depending on Enoki mode, the dashboard may restrict or be the source of truth).

---

## 6. Allowed Addresses

Enoki only accepts transactions that use allowed objects/addresses. We send:

- **allowedAddresses** = `ALLOWED_ADDRESSES` (Platform, Clock, etc.) + **sender** + **extraAllowedAddresses**.

Important case: **Subscribe**. The tx uses the **user’s SUI coins** to pay for the tier. Those coin object IDs must be allowed, or Enoki rejects the tx. Hence:

- The frontend fetches the user’s coins (`getCoins`).
- It builds the tx passing those coins (not `tx.gas`).
- It calls `sponsorAndExecute(tx, { extraAllowedAddresses: [ ...coinIds ] })`.

The `/api/enoki/sponsor` route merges `extraAllowedAddresses` with the base addresses before calling the Enoki API.

---

## 7. Usage in the App

### Hook `useSponsoredTransaction`

```ts
import { useSponsoredTransaction } from "@/enoki/sponsor";

const { sponsorAndExecute, isPending, error } = useSponsoredTransaction();

// Tx without user coins (e.g. create profile, add tier)
await sponsorAndExecute(buildCreateProfile(name, description));

// Tx with user coins (e.g. subscribe)
const coins = await suiClient.getCoins({ owner: address, coinType: "0x2::sui::SUI" });
const tx = buildSubscribe(..., selectedCoins);
await sponsorAndExecute(tx, { extraAllowedAddresses: selectedCoins.map(c => c.coinObjectId) });
```

### Important Rules

1. **Never use `tx.gas`** in sponsored tx builders — gas is provided by Enoki.
2. If the tx spends objects owned by the user (coins, NFTs, etc.), pass their IDs in **extraAllowedAddresses**.
3. Any new Move entry point called via `sponsorAndExecute` must be added to `ALLOWED_MOVE_CALL_TARGETS` and, if required, to the “Allowed Move Call Targets” config in the Enoki dashboard.

---

## 8. Troubleshooting

| Issue | What to check |
|-------|----------------|
| `Sponsor failed (502)` / API error | Verify `ENOKI_PRIVATE_API_KEY`, quotas, and [Enoki status](https://status.enoki.mystenlabs.com). |
| Transaction rejected by Enoki | Ensure the called Move function is in Allowed Move Call Targets and all addresses/objects used are in `allowedAddresses` (including `extraAllowedAddresses` for coins). |
| “Insufficient gas” or gas-related error | Ensure no builder uses `tx.gas` and the tx is built with `onlyTransactionKind: true` before sending to sponsor. |
| Subscribe fails | Ensure the coin objects used for payment are passed in `extraAllowedAddresses`. |

---

## 9. References

- [Enoki — Documentation](https://docs.enoki.mystenlabs.com)
- [Enoki — HTTP API / OpenAPI](https://docs.enoki.mystenlabs.com/http-api/openapi)
- [Enoki — TS SDK examples](https://docs.enoki.mystenlabs.com/ts-sdk/examples)
- [SUI — Sponsored transactions](https://docs.sui.io/concepts/transactions/sponsored-transactions)
