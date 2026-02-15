# SuiNS — Human-Readable Names for Creators

This document describes the **SuiNS** integration in the project: every creator automatically receives a subname like `alice.patreon.sui` so they can be found by name instead of a raw `0x…` address.

---

## Table of contents

1. [What is SuiNS?](#1-what-is-suins)
2. [How It Works — Overview](#2-how-it-works--overview)
3. [Architecture in the Project](#3-architecture-in-the-project)
4. [Detailed Flow (Code)](#4-detailed-flow-code)
5. [Configuration](#5-configuration)
6. [Smart Contract Side](#6-smart-contract-side)
7. [Usage in the App](#7-usage-in-the-app)
8. [Troubleshooting](#8-troubleshooting)
9. [References](#9-references)

---

## 1. What is SuiNS?

- **SuiNS** (Sui Name Service) maps human-readable names to Sui addresses, similar to ENS on Ethereum.
- Names end in `.sui` (e.g. `alice.sui`).
- **Subnames** are children of a parent name (e.g. `alice.patreon.sui` is a subname of `patreon.sui`).
- In this project, we own the parent name **`patreon.sui`** and automatically create subnames for every creator who registers on the platform.

- **Official docs:** [docs.suins.io](https://docs.suins.io)
- **TS SDK:** [`@mysten/suins`](https://www.npmjs.com/package/@mysten/suins)

---

## 2. How It Works — Overview

1. **User registers** as a creator (profile creation via the sponsored Enoki flow).
2. **Backend (admin)** creates a **node subname** `<normalised-name>.patreon.sui` on SuiNS, signed by the admin wallet that owns `patreon.sui`. The resulting `SubDomainRegistration` NFT is transferred to the creator.
3. **Frontend (creator signs)** calls the Move function `set_suins_name` (via Enoki sponsored tx) to record the subname inside the on-chain `Service` object.
4. **Result**: the creator's profile displays their SuiNS name; the search bar can match on it.

> The subname creation is **non-blocking**: if it fails, the creator profile is still created — the SuiNS name can be retried later.

---

## 3. Architecture in the Project

```
Frontend (app/)
├── hooks/
│   └── useAutoRegister.ts       ← Calls /api/suins/create-subname then buildSetSuinsName
├── app/api/suins/
│   └── create-subname/route.ts  ← POST: admin creates node subname on SuiNS
├── lib/
│   ├── contract-constants.ts    ← SUINS_PARENT_NAME, SUINS_PARENT_NFT_ID
│   └── contract.ts              ← buildSetSuinsName(), buildRemoveSuinsName()
└── components/
    └── creator/                 ← Displays creator.suinsName in cards & about tabs
```

### Key roles

| Layer                             | Who signs                                       | What                                                              |
| --------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| API route (`create-subname`)      | **Admin wallet** (via `SUINS_ADMIN_SECRET_KEY`) | Creates the subname on SuiNS and transfers the NFT to the creator |
| Smart contract (`set_suins_name`) | **Creator** (via Enoki sponsored tx)            | Links the subname string to the on-chain `Service` object         |

---

## 4. Detailed Flow (Code)

### 4.1 Trigger — `useAutoRegister`

After a successful `create_creator_profile` transaction, the hook:

```ts
// Step 2: Create the node subname on SuiNS (server-side, admin signs)
const suinsRes = await fetch("/api/suins/create-subname", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ creatorAddress: currentAccount.address }),
});
```

If `suinsRes.ok`, it proceeds to link in the contract:

```ts
// Step 3: Record the subname in the contract (creator signs)
const setSuinsTx = buildSetSuinsName(newServiceId, suinsName);
await sponsorAndExecute(setSuinsTx);
```

### 4.2 API Route — `POST /api/suins/create-subname`

**Request body**: `{ creatorAddress: string }`

The route performs the following:

1. **Validate** that `creatorAddress` owns an active `Service` on the platform.
2. **Read** the creator's name from the `Service` object.
3. **Guard**: check the `Service` doesn't already have a `suins_name` set (HTTP 409 if it does).
4. **Normalise** the name: lowercase, trim, replace spaces with hyphens, strip non-alphanumeric characters.
5. **Check idempotency**: if the subname already exists on SuiNS (e.g. from a previous partial attempt), return success without re-creating it.
6. **Fetch parent NFT expiration** (node subnames must expire ≤ parent).
7. **Build + sign + execute** the creation transaction using `SuinsTransaction`:

```ts
const suinsTx = new SuinsTransaction(suinsClient, tx);

const subNameNft = suinsTx.createSubName({
  parentNft: SUINS_PARENT_NFT_ID,
  name: fullSubname, // e.g. "alice.patreon.sui"
  expirationTimestampMs: Number(parentExpirationMs),
  allowChildCreation: false,
  allowTimeExtension: true,
});

suinsTx.setTargetAddress({
  nft: subNameNft,
  address: creatorAddress,
  isSubname: true,
});
tx.transferObjects([subNameNft], tx.pure.address(creatorAddress));
```

8. **Return** `{ success, suinsName, normalisedName, txDigest }`.

### 4.3 Smart Contract — `set_suins_name` / `remove_suins_name`

After the API route creates the SuiNS subname, the **creator** signs (via Enoki) a call to:

- `service::set_suins_name(Service, Platform, suins_name)` — stores the name string in the `Service` on-chain object.
- `service::remove_suins_name(Service, Platform)` — clears it.

These functions must be called by the Service owner (`service.creator == sender`).

---

## 5. Configuration

### 5.1 Environment Variables

| Variable                 | Side   | Description                                                                                                           |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `SUINS_ADMIN_SECRET_KEY` | Server | Base64-encoded private key of the wallet owning `patreon.sui`. Used by the API route. **Never expose on the client.** |

The admin key is used exclusively in `app/api/suins/create-subname/route.ts`.

### 5.2 Constants (`lib/contract-constants.ts`)

| Constant              | Value           | Purpose                                                    |
| --------------------- | --------------- | ---------------------------------------------------------- |
| `SUINS_PARENT_NAME`   | `"patreon.sui"` | Parent name under which subnames are created               |
| `SUINS_PARENT_NFT_ID` | `0x91ea…`       | Object ID of the `SuinsRegistration` NFT for `patreon.sui` |

### 5.3 Enoki Allowed Move Call Targets

The following SuiNS-related entry points must appear in `ALLOWED_MOVE_CALL_TARGETS`:

- `service::set_suins_name`
- `service::remove_suins_name`

(They are already configured in `contract-constants.ts` as part of the general list, but ensure they also appear in the Enoki dashboard if required.)

---

## 6. Smart Contract Side

The `Service` Move struct contains an optional field:

```
suins_name: Option<String>
```

- `set_suins_name` asserts `service.creator == tx_context::sender()` and writes the name.
- `remove_suins_name` asserts ownership and sets it back to `option::none()`.

The subname itself is **not verified on-chain** — it is a plain string. The security model relies on the API route (which is the only entry point for creating subnames) being the source of truth, and the admin wallet being the only signer able to create children of `patreon.sui`.

---

## 7. Usage in the App

### Automatic assignment (registration)

No manual action is needed. When a user creates their creator profile, `useAutoRegister` handles the full flow:

1. `create_creator_profile` (sponsored tx)
2. `POST /api/suins/create-subname` (server-side admin call)
3. `set_suins_name` (sponsored tx, creator signs)

### Display

- **Creator cards** show `creator.suinsName` as a badge (e.g. `alice.patreon.sui`).
- **About tab** displays the SuiNS name.
- **Search** matches against `creator.suinsName`.

### Removal

Call `buildRemoveSuinsName(serviceObjectId)` via `sponsorAndExecute` to unlink the name from the Service. (The SuiNS NFT remains in the creator's wallet; only the Service field is cleared.)

---

## 8. Troubleshooting

| Issue                                            | What to check                                                                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUINS_ADMIN_SECRET_KEY is not set`              | Ensure the env var is defined in `.env.local`. It must be the base64 private key of the wallet owning `patreon.sui`.                               |
| `No active creator profile found` (403)          | The address has no on-chain `Service` object. The user must create a profile first.                                                                |
| `This creator already has a SuiNS name` (409)    | The `Service.suins_name` field is already set. Use `remove_suins_name` first if you want to reassign.                                              |
| `Creator name results in an empty subname` (422) | The creator's name contains only special characters that are stripped during normalisation.                                                        |
| Subname created but not shown                    | The SuiNS subname exists, but `set_suins_name` (Step 3) may have failed. Retry manually or check the console for `set_suins_name failed` warnings. |
| `Failed to read parent NFT object`               | The `SUINS_PARENT_NFT_ID` constant may be outdated. Verify the NFT still exists on-chain and is owned by the admin wallet.                         |

---

## 9. References

- [SuiNS — Documentation](https://docs.suins.io)
- [`@mysten/suins` — npm](https://www.npmjs.com/package/@mysten/suins)
- [SUI — Name Service](https://docs.sui.io/standards/suins)
- [Enoki integration (this project)](./ENOKI.md) — Sponsored transactions used for `set_suins_name`
