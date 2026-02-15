# Walrus — Decentralized Blob Storage

This document describes the **Walrus** integration in the project: all post content (text, images) and profile images (avatars, banners) are stored on Walrus, a decentralized blob-storage layer built on SUI.

---

## Table of contents

1. [What is Walrus?](#1-what-is-walrus)
2. [How It Is Used — Overview](#2-how-it-is-used--overview)
3. [Architecture in the Project](#3-architecture-in-the-project)
4. [Detailed Flow (Code)](#4-detailed-flow-code)
5. [Configuration](#5-configuration)
6. [Binary Data Blob Format](#6-binary-data-blob-format)
7. [Usage in the App](#7-usage-in-the-app)
8. [Troubleshooting](#8-troubleshooting)
9. [References](#9-references)

---

## 1. What is Walrus?

- **Walrus** is a decentralized blob storage protocol on Sui.
- Blobs are addressed by a content-derived **blobId** (content-addressable).
- Data is replicated across storage nodes and can be fetched from any aggregator.
- In this project, Walrus stores **two kinds** of data:
  - **Encrypted blobs** — post content (text + images) encrypted with Seal before upload.
  - **Public blobs** — profile images (avatars, banners) and public posts sent in the clear.

- **Official docs:** [docs.walrus.site](https://docs.walrus.site)

---

## 2. How It Is Used — Overview

### Post content (encrypted)

1. Post text + images are serialized into two blobs (metadata JSON + binary image pack).
2. Both blobs are encrypted with **Seal** (see [SEAL.md](./SEAL.md)).
3. The encrypted bytes are uploaded to Walrus via the **Publisher** API (`PUT`).
4. The resulting `blobId`s are stored on-chain in the `Service` object via `publish_post`.
5. To read: download raw bytes from the **Aggregator** → decrypt with Seal → parse.

### Profile images (public)

1. Avatar/banner image files are uploaded to Walrus **without** encryption.
2. The `blobId` is stored on-chain (in `Service.avatar_blob_id` / `Service.banner_blob_id`).
3. To display: build an aggregator URL from the `blobId` or download the raw bytes.

---

## 3. Architecture in the Project

```
Frontend (app/)
├── lib/
│   ├── walrus.ts                ← uploadToWalrus(), downloadFromWalrus(), uploadPublicImage()
│   ├── post-service.ts          ← packImages(), unpackImages(), serializeMetadata()
│   └── contract.ts              ← buildPublishPost() — stores blobIds on-chain
├── hooks/
│   ├── usePublishPost.ts        ← Full pipeline: validate → encrypt → upload → TX
│   ├── usePostContent.ts        ← Download → decrypt → parse for viewing
│   └── useCreatorBlobUrl.ts     ← Resolve profile image blobId → displayable URL
└── components/
    └── ...                      ← Displays resolved blob URLs
```

---

## 4. Detailed Flow (Code)

### 4.1 Upload — `uploadToWalrus`

```ts
const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`;

const response = await fetch(url, {
  method: "PUT",
  headers: { "Content-Type": "application/octet-stream" },
  body: data,
});
```

Returns either `newlyCreated.blobObject.blobId` or `alreadyCertified.blobId` (idempotent).

### 4.2 Download — `downloadFromWalrus`

```ts
const url = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
const response = await fetch(url);
return new Uint8Array(await response.arrayBuffer());
```

Returns raw bytes — still encrypted for gated posts, plain bytes for public content.

### 4.3 Public Image Upload

`uploadPublicImage(file: File)` reads the file as `Uint8Array` and calls `uploadToWalrus` directly (no encryption). Used for avatars and banners.

### 4.4 Public Image URL

`getWalrusImageUrl(blobId)` returns `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}` for direct `<img src>` use.

---

## 5. Configuration

### 5.1 Constants (`lib/contract-constants.ts`)

| Constant                | Value (testnet)                                  | Purpose                                       |
| ----------------------- | ------------------------------------------------ | --------------------------------------------- |
| `WALRUS_PUBLISHER_URL`  | `https://publisher.walrus-testnet.walrus.space`  | Upload endpoint                               |
| `WALRUS_AGGREGATOR_URL` | `https://aggregator.walrus-testnet.walrus.space` | Download endpoint                             |
| `WALRUS_EPOCHS`         | `5`                                              | Storage duration (1 epoch ≈ 1 day on testnet) |

> **No API key or secret is needed.** Walrus uploads are permissionless on testnet.

---

## 6. Binary Data Blob Format

Images are packed into a single binary blob before encryption:

```
[4 bytes: image count (u32 LE)]
For each image:
  [4 bytes: header JSON length (u32 LE)]
  [N bytes: header JSON → { index, mimeType, fileName, size, width?, height?, alt? }]
  [4 bytes: image data length (u32 LE)]
  [M bytes: raw image bytes]
```

- **Pack**: `packImages()` in `lib/post-service.ts`
- **Unpack**: `unpackImages()` in `lib/post-service.ts` — creates Object URLs for display (caller must call `revokeImageUrls()` on unmount).

The **metadata blob** is a simple JSON:

```json
{ "version": 1, "text": "...", "images": [{ "index": 0, "mimeType": "image/jpeg", ... }] }
```

Serialized via `serializeMetadata()` and parsed via `deserializeMetadata()`.

---

## 7. Usage in the App

### Publishing a post (`usePublishPost`)

The hook orchestrates the full pipeline with progress tracking:

1. **Validate** inputs (title, text, images).
2. **Pack** images into binary blob.
3. **Get** `next_post_id` from chain (needed for Seal identity).
4. If `requiredTier > 0`: **encrypt** both blobs with Seal → `uploadEncryptedContent`.
5. If `requiredTier === 0`: **upload** both blobs directly (no encryption).
6. **Execute** `publish_post` transaction with the two `blobId`s.

### Viewing a post (`usePostContent`)

- **Public posts** (`requiredTier === 0`): auto-loads on mount — `downloadFromWalrus` → `deserializeMetadata` / `unpackImages`.
- **Encrypted posts** (`requiredTier > 0`): waits for `unlock()` — downloads then decrypts with Seal.
- **Creator's own posts**: auto-unlocked (creators always have access).

### Profile images (`useCreatorBlobUrl`)

Resolves a `blobId` to a displayable URL:

1. If already an HTTP URL → use as-is.
2. Download from Walrus.
3. If raw image bytes (JPEG/PNG/WebP magic) → Object URL.
4. If encrypted → decrypt with Seal (postId = 0 for profile blobs) → Object URL.

---

## 8. Troubleshooting

| Issue                               | What to check                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Walrus upload failed (4xx/5xx)`    | Check `WALRUS_PUBLISHER_URL` is correct for your network (testnet vs mainnet). Verify the publisher node is reachable. |
| `Walrus download failed`            | Verify `WALRUS_AGGREGATOR_URL`. If blob was uploaded with few epochs, it may have expired.                             |
| `Unexpected Walrus response format` | The Walrus API response doesn't contain `newlyCreated` or `alreadyCertified`. Check for API changes.                   |
| Images not displaying               | Ensure `unpackImages` Object URLs are not revoked prematurely. Check console for download errors.                      |
| Large uploads failing               | Total upload is capped at `MAX_TOTAL_UPLOAD_BYTES`. Individual images at `MAX_IMAGE_SIZE_BYTES`.                       |

---

## 9. References

- [Walrus — Documentation](https://docs.walrus.site)
- [Walrus — Testnet Publisher](https://publisher.walrus-testnet.walrus.space)
- [Walrus — Testnet Aggregator](https://aggregator.walrus-testnet.walrus.space)
- [Seal integration (this project)](./SEAL.md) — Encryption layer used before Walrus upload
- [Enoki integration (this project)](./ENOKI.md) — Sponsored transactions for `publish_post`
