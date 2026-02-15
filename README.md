<h1 align="center">SUI Patreon</h1>

<p align="center">
  A decentralized creator-subscription platform built on the <strong>Sui</strong> blockchain.<br/>
  Creators publish gated content, subscribers pay in SUI, and everything runs fully on-chain — no intermediary, no censorship.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#team">Team</a> •
  <a href="#license">License</a>
</p>

---

## Features

🔐 **Subscription-gated content** — Creators define tiered subscriptions. Subscribers pay in SUI and get access to exclusive posts, enforced on-chain by the smart contract.

🔑 **ZkLogin (Sign in with Google)** — Users sign in with their Google account via **Enoki zkLogin** — a Sui address is derived automatically, no seed phrase needed.

⛽ **Zero-gas experience** — All transactions are sponsored via **Enoki**. Users never pay gas; the platform covers it.

🔒 **End-to-end encryption (Seal)** — Gated post content is encrypted client-side with **Seal** threshold encryption. Only subscribers with the right tier can decrypt. Key servers verify access by dry-running a Move function — no backend involved.

🗄️ **Decentralized storage (Walrus)** — All content (text, images, avatars, banners) is stored on **Walrus**, a decentralized blob-storage protocol on Sui.

🏷️ **SuiNS names** — Every creator automatically receives a human-readable subname (`alice.patreon.sui`) via **SuiNS**, making profiles easy to find and share.

📝 **Rich posts** — Creators can publish posts with text and multiple images, update them, change visibility, or delete them.

💬 **Comments & reactions** — Subscribers can comment on posts and react with emojis, all stored on-chain.

💸 **Creator withdrawals** — Accumulated subscription revenue is withdrawable at any time by the creator.

---

## Tech Stack

| Layer                | Technology                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Blockchain**       | [Sui](https://sui.io) (Move smart contracts)                                                                                      |
| **Frontend**         | [Next.js 16](https://nextjs.org) · React 19 · TypeScript                                                                          |
| **Styling**          | [Tailwind CSS 4](https://tailwindcss.com) · [Radix UI](https://www.radix-ui.com) · [Framer Motion](https://www.framer.com/motion) |
| **Auth**             | [Enoki zkLogin](https://docs.enoki.mystenlabs.com) (Google OAuth)                                                                 |
| **Gas sponsoring**   | [Enoki Sponsored Transactions](https://docs.enoki.mystenlabs.com)                                                                 |
| **Encryption**       | [Seal](https://docs.seal.mystenlabs.com) (threshold encryption)                                                                   |
| **Storage**          | [Walrus](https://docs.walrus.site) (decentralized blobs)                                                                          |
| **Naming**           | [SuiNS](https://docs.suins.io) (Sui Name Service)                                                                                 |
| **State management** | [Zustand](https://zustand.docs.pmnd.rs) · [TanStack Query](https://tanstack.com/query)                                            |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** (or npm)
- **Sui CLI** — [installation guide](https://docs.sui.io/build/install)
- A **Google OAuth Client ID** (for zkLogin)
- An **Enoki API key** (private + public) — [Enoki portal](https://portal.enoki.mystenlabs.com)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/SUI_patreon.git
cd SUI_patreon
```

### 2. Deploy the smart contract

```bash
cd contract
sui client publish
```

Note the **Package ID** and **Platform object ID** from the output — you'll need them for the `.env` file.

### 3. Configure environment variables

```bash
cd ../app
cp .env.example .env
```

Edit `.env` with your values:

| Variable                       | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `NEXT_PUBLIC_PACKAGE_ID`       | Deployed Move package ID                       |
| `NEXT_PUBLIC_PLATFORM_ID`      | Shared Platform object ID                      |
| `NEXT_PUBLIC_SUI_NETWORK`      | `testnet`, `mainnet`, or `devnet`              |
| `NEXT_PUBLIC_ENOKI_API_KEY`    | Enoki public API key (zkLogin)                 |
| `ENOKI_PRIVATE_API_KEY`        | Enoki private API key (sponsored tx)           |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID                         |
| `SUINS_ADMIN_SECRET_KEY`       | Private key of the wallet owning `patreon.sui` |

### 4. Install dependencies & run

```bash
pnpm install
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
SUI_patreon/
├── app/                     ← Next.js frontend application
│   ├── app/                 ← Pages & API routes
│   ├── components/          ← React components
│   ├── hooks/               ← Custom React hooks
│   ├── lib/                 ← Core logic (contract, walrus, seal, etc.)
│   ├── enoki/               ← Enoki client & sponsored tx helpers
│   ├── constants/           ← Configuration & mock data
│   ├── stores/              ← Zustand stores
│   └── types/               ← TypeScript types
├── contract/                ← Move smart contract
│   ├── sources/             ← Move modules (service, subscription, platform, types)
│   └── tests/               ← Move unit tests
└── docs/                    ← Technical documentation
```

---

## Documentation

Detailed technical documentation for each integration is available in the [`docs/`](./docs) folder:

| Document                          | Description                                     |
| --------------------------------- | ----------------------------------------------- |
| [**ENOKI.md**](./docs/ENOKI.md)   | Sponsored transactions & zkLogin authentication |
| [**SEAL.md**](./docs/SEAL.md)     | Threshold encryption for gated content          |
| [**WALRUS.md**](./docs/WALRUS.md) | Decentralized blob storage (posts, images)      |
| [**SUINS.md**](./docs/SUINS.md)   | Human-readable creator subnames                 |

---

## 🏆 Hackathon

💙 Built with passion during the **Sui Paris Bootcamp Hackathon**

## Our PoC team ❤️

| [<img src="https://github.com/intermarch3.png?size=85" width=85><br><sub>Lucas Leclerc</sub>](https://github.com/intermarch3) | [<img src="https://github.com/L3yserEpitech.png?size=85" width=85><br><sub>Jules Lordet</sub>](https://github.com/L3yserEpitech) | [<img src="https://github.com/Nezketsu.png?size=85" width=85><br><sub>Grégoire Caseaux</sub>](https://github.com/Nezketsu) | [<img src="https://github.com/AurelienDEMEUSY.png?size=85" width=85><br><sub>Aurelien Demeusy</sub>](https://github.com/AurelienDEMEUSY)
| :---: | :---: | :---: | :---: |
