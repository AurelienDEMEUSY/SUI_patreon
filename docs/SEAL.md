# Seal — On-Chain Access-Controlled Encryption

This document describes the **Seal** integration in the project: post content is encrypted so that only subscribers with a sufficient tier can decrypt it, enforced by a Move smart contract on-chain.

---

## Table of contents

1. [What is Seal?](#1-what-is-seal)
2. [How It Works — Overview](#2-how-it-works--overview)
3. [Architecture in the Project](#3-architecture-in-the-project)
4. [Detailed Flow (Code)](#4-detailed-flow-code)
5. [Configuration](#5-configuration)
6. [Smart Contract — `seal_approve`](#6-smart-contract--seal_approve)
7. [Usage in the App](#7-usage-in-the-app)
8. [Troubleshooting](#8-troubleshooting)
9. [References](#9-references)

---

## 1. What is Seal?

- **Seal** (Mysten Labs) is a threshold-encryption system built on Sui.
- Content is encrypted client-side. To decrypt, the user obtains key shares from **key servers** that only release their shares if a Move function on-chain approves the request.
- In this project, Seal gates **post content** to subscribers: only users with an active subscription at or above the post's `requiredTier` can decrypt.

- **Official docs:** [docs.seal.mystenlabs.com](https://docs.seal.mystenlabs.com)
- **TS SDK:** [`@mysten/seal`](https://www.npmjs.com/package/@mysten/seal)

---

## 2. How It Works — Overview

### Encryption (creator publishes)

1. Build a **Seal identity** from `ServiceObjectId + PostId`.
2. Call `sealClient.encrypt({ threshold, packageId, id, data })`.
3. Upload the encrypted bytes to **Walrus** (see [WALRUS.md](./WALRUS.md)).
4. Store the Walrus `blobId` on-chain via `publish_post`.

### Decryption (subscriber reads)

1. Create a **session key** — a temporary keypair signed by the user's wallet.
2. Build a **decryption PTB** that calls `seal_approve` on-chain.
3. Call `sealClient.decrypt({ data, sessionKey, txBytes })`.
4. Key servers dry-run the PTB to verify the user has access (the Move function checks the subscription tier), then release key shares.
5. The SDK reconstructs the decryption key and returns plaintext.

> The content **never touches any server**. Encryption/decryption happen entirely client-side. Key servers only verify access — they never see the content.

---

## 3. Architecture in the Project

```
Frontend (app/)
├── lib/
│   ├── seal.ts                  ← Core: getSealClient, encryptContent, decryptContent,
│   │                               buildSealId, buildDecryptionTx, createSessionKey
│   ├── walrus.ts                ← Stores/retrieves encrypted blobs
│   └── contract-constants.ts    ← SEAL_KEY_SERVER_OBJECT_IDS, SEAL_THRESHOLD
├── hooks/
│   ├── useSeal.ts               ← React hooks: useSealClient, useSessionKey,
│   │                               useEncrypt, useDecrypt
│   ├── usePublishPost.ts        ← Encrypt → upload → TX pipeline
│   ├── usePostContent.ts        ← Download → decrypt → display pipeline
│   └── useCreatorBlobUrl.ts     ← Decrypt profile images (postId = 0)
└── Move contract
    └── service::seal_approve    ← On-chain access check (tier verification)
```

---

## 4. Detailed Flow (Code)

### 4.1 Seal Identity — `buildSealId`

Each encrypted blob is tied to a unique identity derived from the `Service` object and post:

```ts
// [ServiceAddress (32 bytes)] + [PostId (8 bytes, u64 LE)]
const serviceBytes = bcs.Address.serialize(serviceAddr).toBytes();
const postBytes = bcs.u64().serialize(postId).toBytes();
// → concatenated hex string
```

Special case: **profile images** (avatar, banner) use `postId = 0`.

### 4.2 Encryption — `encryptContent`

```ts
const sealClient = getSealClient(suiClient);
const id = buildSealId(serviceObjectId, postId);

const result = await sealClient.encrypt({
  threshold: SEAL_THRESHOLD, // 2
  packageId: PACKAGE_ID,
  id, // hex identity
  data, // raw bytes to encrypt
});
// result.encryptedObject → encrypted bytes for Walrus
// result.key             → backup decryption key
```

### 4.3 Session Key — `createSessionKey`

Before decrypting, the user creates a short-lived session key:

```ts
const sessionKey = await SessionKey.create({
  address: suiAddress,
  packageId: PACKAGE_ID,
  ttlMin: 10, // valid for 10 minutes
  suiClient,
});

// User must sign a personal message to activate the session key
const message = sessionKey.getPersonalMessage();
const { signature } = await signPersonalMessage({ message });
sessionKey.setPersonalMessageSignature(signature);
```

### 4.4 Decryption PTB — `buildDecryptionTx`

The key servers dry-run this transaction to verify access:

```ts
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::service::seal_approve`,
  arguments: [
    tx.pure.vector("u8", idBytes), // Seal identity
    tx.object(serviceObjectId), // Service object
    tx.object("0x6"), // Clock
  ],
});
const txBytes = await tx.build({
  client: suiClient,
  onlyTransactionKind: true,
});
```

### 4.5 Decryption — `decryptContent`

```ts
const sealClient = getSealClient(suiClient);
const txBytes = await buildDecryptionTx(serviceObjectId, postId, suiClient);

const decryptedBytes = await sealClient.decrypt({
  data: encryptedData, // downloaded from Walrus
  sessionKey, // signed session key
  txBytes, // PTB for access verification
});
```

If the session key is expired or stale, `useDecrypt` automatically retries with a fresh one.

---

## 5. Configuration

### 5.1 Constants (`lib/contract-constants.ts`)

| Constant                     | Value                    | Purpose                                   |
| ---------------------------- | ------------------------ | ----------------------------------------- |
| `SEAL_KEY_SERVER_OBJECT_IDS` | `["0x73d0…", "0xf5d1…"]` | Testnet key server object IDs             |
| `SEAL_THRESHOLD`             | `2`                      | Minimum key servers needed for decryption |

### 5.2 Enoki Allowed Move Call Targets

The `seal_approve` entry point must appear in `ALLOWED_MOVE_CALL_TARGETS`:

- `service::seal_approve`

(Already configured in `contract-constants.ts`.)

### 5.3 SealClient Options

```ts
new SealClient({
  suiClient,
  serverConfigs: SEAL_KEY_SERVER_OBJECT_IDS.map((id) => ({
    objectId: id,
    weight: 1,
  })),
  verifyKeyServers: false, // skip TLS verification on testnet
});
```

---

## 6. Smart Contract — `seal_approve`

The Move function `service::seal_approve` is the on-chain access gate:

- **Called by**: Seal key servers (dry-run, not an actual transaction).
- **Takes**: the Seal identity bytes, the `Service` object, and the `Clock`.
- **Checks**: the requesting address holds an active `Subscription` for this Service with `tier >= post.required_tier` (or is the creator themselves).
- **If access denied**: the Move call aborts (`ENoAccess`), key servers refuse to release shares.

This ensures **only the blockchain enforces access control** — no backend API is involved.

---

## 7. Usage in the App

### React Hooks

| Hook                                    | Purpose                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `useSealClient()`                       | Returns the SealClient singleton                                        |
| `useSessionKey(ttlMin?)`                | Manages session key creation + wallet signature                         |
| `useEncrypt()`                          | `encrypt(data, serviceId, postId)` → encrypts + uploads to Walrus       |
| `useDecrypt(sessionKey, createAndSign)` | `decrypt(blobId, serviceId, postId)` → downloads from Walrus + decrypts |

### Publishing (encryption)

In `usePublishPost`, for gated posts (`requiredTier > 0`):

```ts
// Encrypt metadata
const { encryptedBytes } = await encryptContent(
  suiClient,
  metadataBytes,
  serviceObjectId,
  postId,
);
const metadataBlobId = await uploadEncryptedContent(encryptedBytes);

// Encrypt images
const { encryptedBytes: encryptedData } = await encryptContent(
  suiClient,
  dataBlob,
  serviceObjectId,
  postId,
);
const dataBlobId = await uploadEncryptedContent(encryptedData);
```

For public posts (`requiredTier === 0`), data is uploaded to Walrus **without** Seal encryption.

### Viewing (decryption)

In `usePostContent`:

```ts
// Downloads from Walrus → decrypts via Seal
const decryptedMeta = await decrypt(
  post.metadataBlobId,
  serviceObjectId,
  post.postId,
);
const parsedMetadata = deserializeMetadata(decryptedMeta);
```

Access errors (`ENoAccess`) show a user-friendly message: _"You need an active subscription to view this content."_

### Profile images

`useCreatorBlobUrl` downloads from Walrus and attempts raw display first. If the bytes don't match image magic bytes (JPEG/PNG/WebP), it falls back to Seal decryption with `postId = 0`.

---

## 8. Troubleshooting

| Issue                                  | What to check                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Decryption failed` / key server error | Verify `SEAL_KEY_SERVER_OBJECT_IDS` are valid on your network. Check [Seal status](https://docs.seal.mystenlabs.com).     |
| `ENoAccess` / access denied            | The user doesn't have an active subscription with sufficient tier. Or the subscription has expired (Clock check).         |
| `InvalidUserSignature`                 | Session key expired or stale. The hook auto-retries, but check `ttlMin` if it happens frequently.                         |
| `Session key creation was cancelled`   | The user rejected the personal message signature in their wallet.                                                         |
| Encryption works but decryption fails  | Ensure the same `PACKAGE_ID` is used for both encrypt and decrypt. The Seal identity must match exactly.                  |
| Profile images show as broken          | The blob may be encrypted (older upload). `useCreatorBlobUrl` auto-detects and decrypts, but needs an active session key. |

---

## 9. References

- [Seal — Documentation](https://docs.seal.mystenlabs.com)
- [`@mysten/seal` — npm](https://www.npmjs.com/package/@mysten/seal)
- [SUI — Threshold encryption](https://docs.sui.io/concepts/cryptography)
- [Walrus integration (this project)](./WALRUS.md) — Storage layer for encrypted blobs
- [Enoki integration (this project)](./ENOKI.md) — Sponsored transactions for `publish_post`
