# CLAUDE.md — DePatreon (Decentralized Patreon on SUI)

## 📌 Project Overview

**DePatreon** is a fully decentralized creator platform inspired by Patreon, built on the **SUI blockchain**. Creators publish content behind subscription tiers; subscribers unlock content via on-chain access control. All data is stored on-chain via Walrus, encrypted via Seal, and identities are resolved through SuiNS. The UX is Web2-grade thanks to ZkLogin (social login) and Enoki (sponsored transactions — zero gas fees for users).

**Network: SUI Testnet**

---

## 👥 Team & Ownership (4 devs)

| Role | Scope |
|---|---|
| **Dev 1 — Smart Contracts (Move)** | All `.move` modules, on-chain logic, object model, Seal policies |
| **Dev 2 — Frontend Core** | Next.js app shell, routing, layouts, UI components, HeroUI integration |
| **Dev 3 — Blockchain Integration** | SUI SDK, ZkLogin, Enoki, Walrus, Seal, SuiNS — all `services/` layer |
| **Dev 4 — Features & Polish** | Creator dashboard, subscriber flows, content rendering, responsive, tests |

> Each dev MUST read and respect the modularity rules below. No cross-boundary code without discussion.

---

## 🏗️ Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Blockchain | **SUI** (Move lang) | Testnet — `sui testnet` |
| Frontend Framework | **Next.js 14+** (App Router) | TypeScript strict mode |
| Styling | **Tailwind CSS 3+** | Custom theme tokens |
| UI Library | **HeroUI** | `npx heroui-cli@latest init -t app` |
| State Management | **Zustand** | Lightweight, modular stores |
| Blockchain SDK | **@mysten/sui** | Official SUI TypeScript SDK |
| Auth | **ZkLogin** (via Enoki) | Google, Twitch, Facebook, Apple |
| Gas Sponsoring | **Enoki** (Sponsored Txs) | Users never pay gas |
| Storage | **Walrus** | Decentralized blob storage |
| Encryption | **Seal** | On-chain access-control encryption |
| Name Resolution | **SuiNS** | Address → human-readable name |
| Package Manager | **pnpm** | Mandatory for all devs |

---

## 📁 Project Structure

```
depatreon/
├── CLAUDE.md                          # ← THIS FILE — project bible
├── README.md
│
├── contracts/                         # ══════ MOVE SMART CONTRACTS ══════
│   ├── sources/
│   │   ├── creator.move               # TODO MOVE — Creator profile object
│   │   ├── subscription.move          # TODO MOVE — Subscription tiers & logic
│   │   ├── content.move               # TODO MOVE — Content metadata (Walrus blob IDs)
│   │   ├── access_policy.move         # TODO MOVE — Seal access policies
│   │   └── payment.move               # TODO MOVE — SUI payment & revenue split
│   ├── tests/
│   │   ├── creator_tests.move         # TODO MOVE
│   │   ├── subscription_tests.move    # TODO MOVE
│   │   └── content_tests.move         # TODO MOVE
│   ├── Move.toml
│   └── README.md                      # Contract-specific docs
│
├── frontend/                          # ══════ NEXT.JS APPLICATION ══════
│   ├── public/
│   │   ├── images/
│   │   └── fonts/
│   │
│   ├── src/
│   │   ├── app/                       # ── Next.js App Router ──
│   │   │   ├── layout.tsx             # Root layout (providers wrap here)
│   │   │   ├── page.tsx               # Landing / Home
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── callback/
│   │   │   │       └── page.tsx       # ZkLogin OAuth callback
│   │   │   ├── (app)/                 # Authenticated layout group
│   │   │   │   ├── layout.tsx         # App shell (sidebar, topbar)
│   │   │   │   ├── feed/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── explore/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── creator/
│   │   │   │   │   ├── [address]/
│   │   │   │   │   │   └── page.tsx   # Public creator profile
│   │   │   │   │   └── dashboard/
│   │   │   │   │       └── page.tsx   # Creator's own dashboard
│   │   │   │   ├── content/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx   # Single content view
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   └── not-found.tsx
│   │   │
│   │   ├── components/                # ── UI Components ──
│   │   │   ├── ui/                    # Atomic / generic
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Button.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Card/
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Card.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Modal/
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Modal.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Avatar/
│   │   │   │   │   ├── Avatar.tsx
│   │   │   │   │   ├── Avatar.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Badge/
│   │   │   │   │   └── ...
│   │   │   │   ├── Skeleton/
│   │   │   │   │   └── ...
│   │   │   │   └── index.ts           # Barrel export all ui components
│   │   │   │
│   │   │   ├── layout/                # Layout components
│   │   │   │   ├── Sidebar/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── SidebarItem.tsx
│   │   │   │   │   ├── Sidebar.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Topbar/
│   │   │   │   │   ├── Topbar.tsx
│   │   │   │   │   ├── Topbar.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Footer/
│   │   │   │   │   └── ...
│   │   │   │   └── PageContainer/
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── creator/               # Creator-specific components
│   │   │   │   ├── CreatorCard/
│   │   │   │   │   ├── CreatorCard.tsx
│   │   │   │   │   ├── CreatorCard.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── CreatorHeader/
│   │   │   │   │   ├── CreatorHeader.tsx
│   │   │   │   │   ├── CreatorHeader.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── CreatorStats/
│   │   │   │   │   └── ...
│   │   │   │   ├── TierCard/
│   │   │   │   │   ├── TierCard.tsx
│   │   │   │   │   ├── TierCard.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── TierList/
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── content/               # Content-specific components
│   │   │   │   ├── ContentCard/
│   │   │   │   │   ├── ContentCard.tsx
│   │   │   │   │   ├── ContentCard.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ContentFeed/
│   │   │   │   │   ├── ContentFeed.tsx
│   │   │   │   │   ├── ContentFeedItem.tsx
│   │   │   │   │   ├── ContentFeed.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ContentViewer/
│   │   │   │   │   ├── ContentViewer.tsx      # Renders decrypted content
│   │   │   │   │   ├── ContentViewer.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── LockedContent/
│   │   │   │   │   ├── LockedContent.tsx      # Paywall overlay
│   │   │   │   │   └── index.ts
│   │   │   │   └── ContentUploadForm/
│   │   │   │       ├── ContentUploadForm.tsx
│   │   │   │       ├── ContentUploadForm.types.ts
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── subscription/          # Subscription components
│   │   │   │   ├── SubscribeButton/
│   │   │   │   │   └── ...
│   │   │   │   ├── SubscriptionBadge/
│   │   │   │   │   └── ...
│   │   │   │   └── SubscriptionManager/
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── wallet/                # Wallet & auth components
│   │   │   │   ├── ConnectWallet/
│   │   │   │   │   ├── ConnectWallet.tsx
│   │   │   │   │   ├── ConnectWallet.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── WalletInfo/
│   │   │   │   │   └── ...
│   │   │   │   └── ZkLoginButton/
│   │   │   │       ├── ZkLoginButton.tsx
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   └── common/                # Shared utility components
│   │   │       ├── SuiAddress/
│   │   │       │   ├── SuiAddress.tsx         # Displays address or SuiNS name
│   │   │       │   └── index.ts
│   │   │       ├── SuiAmount/
│   │   │       │   └── ...
│   │   │       ├── LoadingState/
│   │   │       │   └── ...
│   │   │       ├── ErrorBoundary/
│   │   │       │   └── ...
│   │   │       └── EmptyState/
│   │   │           └── ...
│   │   │
│   │   ├── services/                  # ══ BLOCKCHAIN SERVICE LAYER ══
│   │   │   │                          # ⚠️  Chaque service = TODO pour Dev 3
│   │   │   │                          #     Voir section "Services — TODO"
│   │   │   ├── sui/
│   │   │   │   ├── client.ts          # TODO SUI
│   │   │   │   ├── constants.ts       # TODO SUI
│   │   │   │   └── index.ts
│   │   │   ├── zklogin/
│   │   │   │   ├── zklogin.service.ts # TODO ZKLOGIN
│   │   │   │   ├── zklogin.types.ts   # TODO ZKLOGIN
│   │   │   │   ├── zklogin.constants.ts
│   │   │   │   └── index.ts
│   │   │   ├── enoki/
│   │   │   │   ├── enoki.service.ts   # TODO ENOKI
│   │   │   │   ├── enoki.types.ts     # TODO ENOKI
│   │   │   │   ├── enoki.constants.ts
│   │   │   │   └── index.ts
│   │   │   ├── walrus/
│   │   │   │   ├── walrus.service.ts  # TODO WALRUS
│   │   │   │   ├── walrus.types.ts    # TODO WALRUS
│   │   │   │   ├── walrus.constants.ts
│   │   │   │   └── index.ts
│   │   │   ├── seal/
│   │   │   │   ├── seal.service.ts    # TODO SEAL
│   │   │   │   ├── seal.types.ts      # TODO SEAL
│   │   │   │   ├── seal.constants.ts
│   │   │   │   └── index.ts
│   │   │   ├── suins/
│   │   │   │   ├── suins.service.ts   # TODO SUINS
│   │   │   │   ├── suins.types.ts     # TODO SUINS
│   │   │   │   ├── suins.constants.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts               # Barrel exports
│   │   │
│   │   ├── hooks/                     # ── Custom React Hooks ──
│   │   │   ├── useAuth.ts             # ZkLogin auth state
│   │   │   ├── useWallet.ts           # Wallet connection
│   │   │   ├── useSuiName.ts          # SuiNS resolution
│   │   │   ├── useSubscription.ts     # Check/manage subscriptions
│   │   │   ├── useContent.ts          # Fetch & decrypt content
│   │   │   ├── useCreator.ts          # Creator profile data
│   │   │   ├── useSponsoredTx.ts      # Enoki sponsored transaction
│   │   │   ├── useWalrusUpload.ts     # Upload to Walrus
│   │   │   ├── useWalrusDownload.ts   # Download from Walrus
│   │   │   ├── useSealEncrypt.ts      # Seal encrypt
│   │   │   ├── useSealDecrypt.ts      # Seal decrypt
│   │   │   └── index.ts
│   │   │
│   │   ├── stores/                    # ── Zustand Stores ──
│   │   │   ├── auth.store.ts          # Auth state (jwt, address, zkProof)
│   │   │   ├── creator.store.ts       # Current creator data
│   │   │   ├── subscription.store.ts  # User's active subscriptions
│   │   │   ├── ui.store.ts            # UI state (modals, sidebar, theme)
│   │   │   └── index.ts
│   │   │
│   │   ├── providers/                 # ── Context Providers ──
│   │   │   ├── SuiProvider.tsx        # SUI client + wallet provider
│   │   │   ├── AuthProvider.tsx       # ZkLogin + Enoki auth provider
│   │   │   ├── ThemeProvider.tsx       # HeroUI theme
│   │   │   └── index.ts
│   │   │
│   │   ├── constants/                 # ══ MOCK DATA & APP CONSTANTS ══
│   │   │   ├── creators.mock.ts       # Mock creator profiles
│   │   │   ├── content.mock.ts        # Mock content items
│   │   │   ├── tiers.mock.ts          # Mock subscription tiers
│   │   │   ├── subscriptions.mock.ts  # Mock user subscriptions
│   │   │   ├── feed.mock.ts           # Mock feed data
│   │   │   ├── navigation.ts          # Sidebar & nav items
│   │   │   ├── routes.ts             # Route path constants
│   │   │   ├── config.ts              # App-wide config (non-env)
│   │   │   └── index.ts
│   │   │
│   │   ├── types/                     # ══ SHARED TYPES ══
│   │   │   ├── creator.types.ts
│   │   │   ├── content.types.ts
│   │   │   ├── subscription.types.ts
│   │   │   ├── tier.types.ts
│   │   │   ├── user.types.ts
│   │   │   ├── wallet.types.ts
│   │   │   ├── api.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── lib/                       # ── Utility functions ──
│   │   │   ├── format.ts              # Address truncation, amounts, dates
│   │   │   ├── validation.ts          # Form validation schemas (zod)
│   │   │   ├── cn.ts                  # Tailwind class merge utility
│   │   │   └── index.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── .env.local
│   ├── .env.example
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── docs/                              # ══════ DOCUMENTATION ══════
│   ├── architecture.md
│   ├── services/
│   │   ├── ZKLOGIN.md
│   │   ├── ENOKI.md
│   │   ├── WALRUS.md
│   │   ├── SEAL.md
│   │   └── SUINS.md
│   ├── contracts/
│   │   └── MOVE_CONTRACTS.md
│   └── setup.md
│
├── .gitignore
├── .prettierrc
├── .eslintrc.json
└── pnpm-workspace.yaml
```

---

## ⚙️ Environment Variables

```env
# ══════ .env.example ══════

# ── SUI Network ──
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# ── Move Package (deployed on testnet) ──
NEXT_PUBLIC_PACKAGE_ID=0x_YOUR_PACKAGE_ID_HERE
NEXT_PUBLIC_CREATOR_MODULE=creator
NEXT_PUBLIC_SUBSCRIPTION_MODULE=subscription
NEXT_PUBLIC_CONTENT_MODULE=content

# ── ZkLogin / Enoki ──
NEXT_PUBLIC_ENOKI_API_KEY=your_enoki_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/callback

# ── Walrus ──
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space

# ── Seal ──
NEXT_PUBLIC_SEAL_PACKAGE_ID=0x_SEAL_PACKAGE_ID
NEXT_PUBLIC_SEAL_ALLOWLIST_ID=0x_SEAL_ALLOWLIST_OBJECT_ID

# ── SuiNS ──
NEXT_PUBLIC_SUINS_PACKAGE_ID=0x_SUINS_PACKAGE_ID
```

> **RULE: ZERO hardcoded values in frontend code.** All config values MUST come from `constants/config.ts` which reads from `process.env`. If a value doesn't exist yet, add a placeholder in `.env.example` and use the mock.

---

## 🔗 Services — Architecture & TODO Map

### Architecture Principle

Every service is fully isolated in `services/<name>/`. Each service folder contains:
- `<name>.service.ts` — The service class/functions (all logic)
- `<name>.types.ts` — TypeScript interfaces for that service
- `<name>.constants.ts` — Service-specific config & endpoints
- `index.ts` — Barrel export

Components NEVER call services directly. The data flow is:

```
Component → Hook → Service → Blockchain/API
              ↓
            Store (Zustand)
```

---

### 🔹 TODO SUI — SUI Client (`services/sui/`)

> **Owner:** Dev 3
> **Purpose:** Singleton SUI client connected to testnet. Foundation for every other service.
> **Package:** `@mysten/sui`
> **Docs:** https://sdk.mystenlabs.com/typescript

**Files to create:**
| File | Description |
|---|---|
| `constants.ts` | Network config, RPC URL, package IDs — read from `process.env` |
| `client.ts` | Singleton `SuiClient` instance via `getSuiClient()` |
| `index.ts` | Barrel export |

**Requirements:**
- Singleton pattern — one client instance for the entire app
- All RPC calls must go through `getSuiClient()`, never instantiate `SuiClient` elsewhere
- All config from env vars

---

### 🔹 TODO ZKLOGIN — Social Login (`services/zklogin/`)

> **Owner:** Dev 3
> **Purpose:** Allow users to log in with Google (or other OAuth) and derive a SUI address from their JWT.
> **Packages:** `@mysten/sui`, `@mysten/zklogin`
> **Docs:** https://docs.sui.io/concepts/cryptography/zklogin

**Files to create:**
| File | Description |
|---|---|
| `zklogin.service.ts` | OAuth URL generation, callback handling, address derivation |
| `zklogin.types.ts` | `ZkLoginSession`, `OAuthProvider`, `ZkLoginProof` |
| `zklogin.constants.ts` | Provider configs (clientId, authUrl, scope, redirectUri) |
| `index.ts` | Barrel export |

**Expected flow:**
1. User clicks "Login with Google"
2. Generate ephemeral keypair + nonce → redirect to Google OAuth
3. Google redirects back to `/callback` with JWT in URL hash
4. Send JWT to Enoki → get ZK proof + salt
5. Derive SUI address from JWT claims
6. Store session in memory → populate `auth.store.ts`

**Must expose:**
- `getOAuthUrl(provider)` → redirect URL string
- `handleCallback(jwt)` → `ZkLoginSession`
- `deriveAddress(jwt, salt)` → SUI address string

**Integrates with:** Enoki service (proof generation), `auth.store.ts`

---

### 🔹 TODO ENOKI — Sponsored Transactions (`services/enoki/`)

> **Owner:** Dev 3
> **Purpose:** (1) Generate ZkLogin proofs, (2) Sponsor ALL user transactions — zero gas fees.
> **Package:** `@mysten/enoki`
> **Docs:** https://docs.enoki.mystenlabs.com

**Files to create:**
| File | Description |
|---|---|
| `enoki.service.ts` | Proof generation + sponsored tx execution |
| `enoki.types.ts` | `SponsoredTxResult`, `EnokiProofResponse` |
| `enoki.constants.ts` | API key, base URL |
| `index.ts` | Barrel export |

**Must expose:**
- `getZkLoginProof(jwt, ephemeralPublicKey, maxEpoch, randomness)` → ZK proof + salt
- `sponsorAndExecute(tx, senderAddress, signFn)` → transaction result

**⚠️ CRITICAL RULE:** EVERY user transaction MUST go through `sponsorAndExecute()`. Never call `client.signAndExecuteTransaction()` directly. The `useSponsoredTx` hook wraps this.

---

### 🔹 TODO WALRUS — Decentralized Storage (`services/walrus/`)

> **Owner:** Dev 3
> **Purpose:** Store all content on Walrus. Returns a `blobId` stored on-chain.
> **Package:** None (pure HTTP fetch)
> **Docs:** https://docs.walrus.site

**Files to create:**
| File | Description |
|---|---|
| `walrus.service.ts` | Upload (PUT), download (GET), URL builder |
| `walrus.types.ts` | `WalrusUploadResponse`, `WalrusStoreOptions`, `WalrusBlobData` |
| `walrus.constants.ts` | Aggregator URL (read), Publisher URL (write), default epochs |
| `index.ts` | Barrel export |

**Must expose:**
- `upload(data: Uint8Array, options?)` → `{ blobId, size, endEpoch }`
- `download(blobId)` → `Uint8Array`
- `getBlobUrl(blobId)` → direct URL string

**Flow:** Encrypt with Seal → upload to Walrus → store blobId on-chain
**⚠️ IMPORTANT:** ALWAYS encrypt with Seal BEFORE uploading. Walrus stores opaque bytes.

---

### 🔹 TODO SEAL — Encryption & Access Control (`services/seal/`)

> **Owner:** Dev 3
> **Purpose:** Encrypt content so only authorized subscribers can decrypt. Tied to on-chain policies.
> **Package:** Seal SDK (check latest on SUI ecosystem)
> **Docs:** https://docs.seal.mystenlabs.com

**Files to create:**
| File | Description |
|---|---|
| `seal.service.ts` | Encrypt, decrypt, create policy |
| `seal.types.ts` | `SealPolicy`, `SealEncryptResult`, `SealDecryptResult` |
| `seal.constants.ts` | Seal package ID, allowlist ID |
| `index.ts` | Barrel export |

**Must expose:**
- `encrypt(data: Uint8Array, policyObjectId)` → `{ encryptedData, policyId }`
- `decrypt(encryptedData: Uint8Array, policyObjectId, signFn)` → `{ decryptedData }`
- `createPolicy(...)` → policyId string

**Architecture:**
```
Creator creates Tier → Move creates SealPolicy → policyId stored in Tier
Creator uploads → encrypt(data, policyId) → Walrus → blobId on-chain
User subscribes → gets SubscriptionNFT
User requests content → Seal checks NFT ownership → decrypt if authorized
```

---

### 🔹 TODO SUINS — Name Resolution (`services/suins/`)

> **Owner:** Dev 3
> **Purpose:** Display human-readable names (`alice.sui`) instead of raw addresses.
> **Package:** `@mysten/suins`
> **Docs:** https://docs.suins.io

**Files to create:**
| File | Description |
|---|---|
| `suins.service.ts` | Address→name, name→address, batch resolve |
| `suins.types.ts` | `SuiNameRecord` |
| `suins.constants.ts` | Package ID, registry object |
| `index.ts` | Barrel export |

**Must expose:**
- `getNameForAddress(address)` → `string | null`
- `getAddressForName(name)` → `string | null`
- `batchResolve(addresses[])` → `Map<address, name | null>`

**Frontend:** The `useSuiName(address)` hook calls this and caches results. The `<SuiAddress>` component uses this hook.

---

### 🔹 TODO MOVE — Smart Contracts (`contracts/`)

> **Owner:** Dev 1
> **Purpose:** All on-chain logic: creator profiles, tiers, subscriptions, content, payments, Seal policies.
> **Docs:** https://move-book.com, https://docs.sui.io

**Files to create:**
| File | Description |
|---|---|
| `sources/creator.move` | CreatorProfile shared object (create, update, delete) |
| `sources/subscription.move` | Tier creation, subscribe (mint NFT), renew, cancel |
| `sources/content.move` | Content metadata (blobId, policyId, tierId), publish, delete |
| `sources/access_policy.move` | Seal policy creation, access verification |
| `sources/payment.move` | SUI payment handling, revenue split |
| `tests/*` | Full test coverage |

**Expected object model:**

| Object | Type | Key fields |
|---|---|---|
| `CreatorProfile` | shared | owner, name, bio, avatar_blob_id, tiers, subscriber_count |
| `SubscriptionTier` | child of Creator | name, price (MIST), seal_policy_id, benefits, active |
| `ContentObject` | shared | creator, title, blob_id, seal_policy_id, tier_id, is_public |
| `SubscriptionNFT` | owned by subscriber | subscriber, creator, tier_id, started_at, expires_at |

**Deploy:**
```bash
cd contracts && sui move build && sui move test && sui client publish --gas-budget 100000000
# → Copy package ID into NEXT_PUBLIC_PACKAGE_ID
```

---

## 📦 Types System (`types/`)

All shared types live in `types/`. Each mock file in `constants/` MUST import and satisfy the corresponding type. These types are the **contract** between frontend and blockchain — agreed upon by all devs.

```typescript
// types/creator.types.ts
export interface Creator {
  address: string;
  name: string;
  bio: string;
  avatarBlobId: string | null;
  bannerBlobId: string | null;
  suinsName: string | null;
  totalSubscribers: number;
  totalContent: number;
  tiers: Tier[];
  createdAt: number;
}
```

```typescript
// types/tier.types.ts
export interface Tier {
  id: string;
  creatorAddress: string;
  name: string;
  description: string;
  priceInMist: number;       // 1 SUI = 1_000_000_000 MIST
  sealPolicyId: string;
  benefits: string[];
  subscriberCount: number;
  order: number;
}
```

```typescript
// types/content.types.ts
export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface Content {
  id: string;
  creatorAddress: string;
  title: string;
  description: string;
  contentType: ContentType;
  walrusBlobId: string;
  sealPolicyId: string;
  requiredTierId: string;
  isPublic: boolean;
  previewBlobId: string | null;
  createdAt: number;
  likesCount: number;
  commentsCount: number;
}
```

```typescript
// types/subscription.types.ts
export interface Subscription {
  id: string;
  subscriberAddress: string;
  creatorAddress: string;
  tierId: string;
  startedAt: number;
  expiresAt: number;
  isActive: boolean;
  autoRenew: boolean;
}
```

```typescript
// types/user.types.ts
export interface User {
  address: string;
  suinsName: string | null;
  avatarUrl: string | null;
  isCreator: boolean;
  subscriptions: Subscription[];
}
```

```typescript
// types/wallet.types.ts
export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  suinsName: string | null;
}
```

```typescript
// types/api.types.ts
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}
```

---

## 🧪 Mock Data (`constants/`)

**Rule:** Every mock file imports its type and satisfies it fully. When a service is integrated, the hook switches from mock → real data. Components never change.

```typescript
// constants/creators.mock.ts
import type { Creator } from '@/types';

export const MOCK_CREATORS: Creator[] = [
  {
    address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    name: 'Alice Art',
    bio: 'Digital artist exploring the intersection of AI and traditional art.',
    avatarBlobId: null,
    bannerBlobId: null,
    suinsName: 'alice.sui',
    totalSubscribers: 142,
    totalContent: 38,
    tiers: [],
    createdAt: 1700000000,
  },
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    name: 'Bob Music',
    bio: 'Independent musician sharing exclusive tracks and behind-the-scenes content.',
    avatarBlobId: null,
    bannerBlobId: null,
    suinsName: 'bob.sui',
    totalSubscribers: 89,
    totalContent: 24,
    tiers: [],
    createdAt: 1701000000,
  },
  {
    address: '0x9999999999999999999999999999999999999999999999999999999999999999',
    name: 'Charlie Dev',
    bio: 'Building the future of Web3. Tutorials, code walkthroughs, and hot takes.',
    avatarBlobId: null,
    bannerBlobId: null,
    suinsName: 'charlie.sui',
    totalSubscribers: 312,
    totalContent: 67,
    tiers: [],
    createdAt: 1698000000,
  },
];
```

```typescript
// constants/tiers.mock.ts
import type { Tier } from '@/types';

export const MOCK_TIERS: Tier[] = [
  {
    id: '0xtier001',
    creatorAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    name: 'Supporter',
    description: 'Access to behind-the-scenes posts and community chat.',
    priceInMist: 1_000_000_000,
    sealPolicyId: '0xpolicy001',
    benefits: ['Behind-the-scenes posts', 'Community chat access', 'Monthly Q&A'],
    subscriberCount: 98,
    order: 1,
  },
  {
    id: '0xtier002',
    creatorAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    name: 'Premium',
    description: 'Everything in Supporter + exclusive tutorials and early access.',
    priceInMist: 5_000_000_000,
    sealPolicyId: '0xpolicy002',
    benefits: ['All Supporter benefits', 'Exclusive tutorials', 'Early access', 'HD downloads'],
    subscriberCount: 44,
    order: 2,
  },
  {
    id: '0xtier003',
    creatorAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    name: 'VIP',
    description: 'The ultimate tier — 1-on-1 sessions, source files, and more.',
    priceInMist: 15_000_000_000,
    sealPolicyId: '0xpolicy003',
    benefits: ['All Premium benefits', '1-on-1 monthly session', 'Source files', 'Credits in projects'],
    subscriberCount: 12,
    order: 3,
  },
];
```

```typescript
// constants/content.mock.ts
import type { Content } from '@/types';

export const MOCK_CONTENT: Content[] = [
  {
    id: '0xcontent001',
    creatorAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    title: 'Speed painting: Neon Cityscape',
    description: 'Watch the full process of creating this cyberpunk cityscape in 4K.',
    contentType: 'video',
    walrusBlobId: 'walrus_blob_mock_001',
    sealPolicyId: '0xpolicy001',
    requiredTierId: '0xtier001',
    isPublic: false,
    previewBlobId: 'walrus_preview_mock_001',
    createdAt: 1705000000,
    likesCount: 32,
    commentsCount: 8,
  },
  {
    id: '0xcontent002',
    creatorAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    title: 'Welcome to my page!',
    description: 'A free introduction post for everyone.',
    contentType: 'text',
    walrusBlobId: 'walrus_blob_mock_002',
    sealPolicyId: '',
    requiredTierId: '',
    isPublic: true,
    previewBlobId: null,
    createdAt: 1704000000,
    likesCount: 67,
    commentsCount: 15,
  },
  {
    id: '0xcontent003',
    creatorAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    title: 'Unreleased Track — "Midnight Signal"',
    description: 'Exclusive early listen to my upcoming single.',
    contentType: 'audio',
    walrusBlobId: 'walrus_blob_mock_003',
    sealPolicyId: '0xpolicy_bob_001',
    requiredTierId: '0xtier_bob_001',
    isPublic: false,
    previewBlobId: null,
    createdAt: 1706000000,
    likesCount: 45,
    commentsCount: 12,
  },
];
```

```typescript
// constants/subscriptions.mock.ts
import type { Subscription } from '@/types';

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '0xsub001',
    subscriberAddress: '0xUSER_ADDRESS_MOCK',
    creatorAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    tierId: '0xtier002',
    startedAt: 1704067200,
    expiresAt: 1706745600,
    isActive: true,
    autoRenew: true,
  },
  {
    id: '0xsub002',
    subscriberAddress: '0xUSER_ADDRESS_MOCK',
    creatorAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    tierId: '0xtier_bob_001',
    startedAt: 1705000000,
    expiresAt: 1707678000,
    isActive: true,
    autoRenew: false,
  },
];
```

```typescript
// constants/feed.mock.ts
import type { Content } from '@/types';
import { MOCK_CONTENT } from './content.mock';

export const MOCK_FEED: Content[] = [...MOCK_CONTENT].sort(
  (a, b) => b.createdAt - a.createdAt
);
```

```typescript
// constants/navigation.ts
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiresAuth: boolean;
}

export const SIDEBAR_NAV: NavItem[] = [
  { label: 'Feed', href: '/feed', icon: 'home', requiresAuth: true },
  { label: 'Explore', href: '/explore', icon: 'compass', requiresAuth: false },
  { label: 'My Subscriptions', href: '/subscriptions', icon: 'heart', requiresAuth: true },
  { label: 'Creator Dashboard', href: '/creator/dashboard', icon: 'bar-chart', requiresAuth: true },
  { label: 'Settings', href: '/settings', icon: 'settings', requiresAuth: true },
];
```

```typescript
// constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CALLBACK: '/callback',
  FEED: '/feed',
  EXPLORE: '/explore',
  CREATOR: (address: string) => `/creator/${address}`,
  CREATOR_DASHBOARD: '/creator/dashboard',
  CONTENT: (id: string) => `/content/${id}`,
  SETTINGS: '/settings',
} as const;
```

```typescript
// constants/config.ts
export const APP_CONFIG = {
  appName: 'DePatreon',
  appDescription: 'Decentralized creator platform on SUI',
  defaultAvatarUrl: '/images/default-avatar.png',
  defaultBannerUrl: '/images/default-banner.png',
  maxUploadSizeMb: 100,
  supportedContentTypes: [
    'image/png', 'image/jpeg', 'image/webp',
    'video/mp4', 'audio/mp3', 'application/pdf',
  ],
  suiDecimals: 9,
  mist: {
    toSui: (mist: number) => mist / 1_000_000_000,
    fromSui: (sui: number) => sui * 1_000_000_000,
  },
} as const;
```

---

## 🪝 Hooks — Mock → Real Pattern

Each hook encapsulates one concern. While services are TODO, hooks return mock data. When a service is integrated, flip `USE_MOCK` to `false`.

```typescript
// hooks/useCreator.ts — PATTERN TO FOLLOW FOR ALL HOOKS
import { useState, useEffect } from 'react';
import { MOCK_CREATORS } from '@/constants';
import type { Creator } from '@/types';

// TODO: When SUI service is ready, import and use:
// import { CreatorService } from '@/services/sui';

const USE_MOCK = true; // ← Flip to false when service is integrated

export function useCreator(address: string | null) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setIsLoading(true);
    setError(null);

    if (USE_MOCK) {
      const found = MOCK_CREATORS.find((c) => c.address === address) ?? null;
      setTimeout(() => {
        setCreator(found);
        setIsLoading(false);
      }, 300); // simulate async
      return;
    }

    // TODO: Real implementation
    // CreatorService.getByAddress(address)
    //   .then(setCreator)
    //   .catch((err) => setError(err.message))
    //   .finally(() => setIsLoading(false));
  }, [address]);

  return { creator, isLoading, error };
}
```

**All hooks:**

| Hook | Consumes (when integrated) | Purpose |
|---|---|---|
| `useAuth` | TODO ZKLOGIN + TODO ENOKI | Auth state, login/logout, current user |
| `useWallet` | TODO SUI | Wallet connection status, address |
| `useSuiName` | TODO SUINS | Resolve address → SuiNS name (cached) |
| `useSubscription` | TODO SUI | Check/manage user subscriptions |
| `useContent` | TODO WALRUS + TODO SEAL | Fetch, decrypt, return content |
| `useCreator` | TODO SUI | Creator profile data |
| `useSponsoredTx` | TODO ENOKI | Execute any tx with gas sponsoring |
| `useWalrusUpload` | TODO WALRUS | Upload with progress |
| `useWalrusDownload` | TODO WALRUS | Download blob by ID |
| `useSealEncrypt` | TODO SEAL | Encrypt data before upload |
| `useSealDecrypt` | TODO SEAL | Decrypt data after download |

---

## 🧩 Component Rules

### Simple components (≤ 50 lines):
```
components/ui/Badge/
├── Badge.tsx
└── index.ts
```

### Complex components (folder with split files):
```
components/content/ContentFeed/
├── ContentFeed.tsx          # Main container
├── ContentFeedItem.tsx      # Individual item
├── ContentFeedSkeleton.tsx  # Loading skeleton
├── ContentFeed.types.ts     # Props & internal types
├── ContentFeed.utils.ts     # Helpers (optional)
└── index.ts                 # Barrel export
```

### 10 Rules:
1. **Every component folder has an `index.ts`** barrel export
2. **Types in `.types.ts`**, never inline
3. **No business logic in components** — delegate to hooks
4. **No hardcoded strings** — use `constants/`
5. **No direct service calls** — always go through hooks
6. **All mock data via constants** — components never generate fake data
7. **HeroUI components first** — only custom when HeroUI lacks it
8. **Tailwind only** — no inline styles, no CSS modules
9. **Each complex component gets its own folder** — with sub-files
10. **Props always typed in `.types.ts`** — exported and reusable

### Imports:
```typescript
// ✅ Good
import { ContentCard } from '@/components/content/ContentCard';
import { MOCK_CONTENT } from '@/constants';
import { useContent } from '@/hooks';
import type { Content } from '@/types';

// ❌ Bad
import { ContentCard } from '@/components/content/ContentCard/ContentCard';
import { someContent } from './hardcoded-data';
```

---

## 🔄 Data Flow Architecture

```
┌──────────────────────────────────────────────────────┐
│                      FRONTEND                         │
│                                                       │
│  ┌─────────┐    ┌────────┐    ┌──────────────────┐  │
│  │Component │───▶│  Hook  │───▶│     Service      │  │
│  │  (UI)   │    │        │    │   (TODO / Mock)  │  │
│  └────┬────┘    └───┬────┘    │                  │  │
│       │             │         │ ┌──────────────┐ │  │
│       │         ┌───▼────┐    │ │ TODO SUI     │ │  │
│       │         │ Store  │    │ │ TODO ZKLOGIN │ │  │
│       │         │(Zustand)│   │ │ TODO ENOKI   │ │  │
│       │         └────────┘    │ │ TODO WALRUS  │ │  │
│       │                       │ │ TODO SEAL    │ │  │
│       │                       │ │ TODO SUINS   │ │  │
│       │                       │ └──────────────┘ │  │
│       │                       └─────────┬────────┘  │
└───────┼─────────────────────────────────┼────────────┘
        │                                 │
        │                    ┌────────────┴───────────┐
        │                    │      SUI TESTNET        │
        │                    │    ┌────────────────┐   │
        │                    │    │ TODO MOVE       │   │
        │                    │    │ contracts/      │   │
        │                    │    └────────────────┘   │
        │                    │  ┌────────┐ ┌────────┐  │
        │                    │  │ SuiNS  │ │ Seal   │  │
        │                    │  └────────┘ └────────┘  │
        │                    └────────────────────────┘
        │                    ┌────────────────────────┐
        └───────────────────▶│    WALRUS (Storage)     │
                             └────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Rust + SUI CLI (`cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui`)

### Setup
```bash
# 1. Clone
git clone <repo-url> depatreon && cd depatreon

# 2. SUI testnet
sui client switch --env testnet
sui client faucet

# 3. Contracts (when TODO MOVE is done)
cd contracts
sui move build && sui move test
sui client publish --gas-budget 100000000
# → Copy package ID

# 4. Frontend
cd ../frontend
pnpm install
cp .env.example .env.local
# Fill in values
pnpm dev
# → http://localhost:3000
```

---

## 📐 Code Quality Rules

1. **TypeScript strict mode** — `"strict": true`
2. **No `any`** — use `unknown` + narrowing, or define types
3. **No hardcoded values** — `constants/` or `.env`
4. **Barrel exports everywhere** — `index.ts` in every folder
5. **Absolute imports** — `@/` alias
6. **Prettier + ESLint** — enforced
7. **Commits** — `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

### tsconfig.json paths:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

---

## 🔐 Security Notes

- **Never store private keys in frontend** — ZkLogin uses ephemeral keys only
- **JWT tokens in memory only** — never localStorage
- **Seal policies = access control** — Move contract is source of truth
- **Always encrypt before Walrus upload** — Walrus stores opaque blobs
- **Enoki rate limits** — configure on dashboard to prevent abuse

---

## 📋 Phases & TODO Tracker

### Phase 1: Foundation
- [ ] **TODO MOVE** — Creator, Tier, Subscription contracts (Dev 1)
- [ ] **Frontend** — App shell, routing, HeroUI, all pages with mocks (Dev 2)
- [ ] **TODO ZKLOGIN + TODO ENOKI** — Login flow (Dev 3)
- [ ] **Mocks** — All screens with mock data (Dev 2 + Dev 4)

### Phase 2: Core Features
- [ ] **TODO SUI** — Client + read on-chain data (Dev 3)
- [ ] **Frontend** — Creator profile, tiers, subscribe UI (Dev 4)
- [ ] **TODO ENOKI** — Sponsored txs for all actions (Dev 3)
- [ ] **TODO SUINS** — Name resolution everywhere (Dev 3)

### Phase 3: Content System
- [ ] **TODO WALRUS** — Upload/download (Dev 3)
- [ ] **TODO SEAL** — Encrypt/decrypt (Dev 3)
- [ ] **Frontend** — Content publish, locked/unlocked views (Dev 4)
- [ ] **TODO MOVE** — Content + access_policy contracts (Dev 1)

### Phase 4: Polish
- [ ] Feed (explore + personalized)
- [ ] Responsive design
- [ ] Error handling + loading states
- [ ] Creator analytics dashboard
- [ ] E2E testing

---

## 📚 Reference Links

| Resource | URL |
|---|---|
| SUI Docs | https://docs.sui.io |
| SUI TypeScript SDK | https://sdk.mystenlabs.com/typescript |
| Move Book | https://move-book.com |
| ZkLogin Guide | https://docs.sui.io/concepts/cryptography/zklogin |
| Enoki Docs | https://docs.enoki.mystenlabs.com |
| Walrus Docs | https://docs.walrus.site |
| Seal Docs | https://docs.seal.mystenlabs.com |
| SuiNS Docs | https://docs.suins.io |
| HeroUI Docs | https://www.heroui.com/docs |
| Tailwind Docs | https://tailwindcss.com/docs |

---

> **This file is the single source of truth. When implementing a TODO, update this file to mark it done and document the integration.**
