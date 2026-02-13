# Enoki Sponsored Transactions

Ce sous-dossier fournit le flux **sponsored transactions** côté client avec zkLogin : l’app construit une transaction, Enoki la sponsorise (prise en charge du gas), l’utilisateur signe, puis Enoki exécute la transaction.

## Prérequis

- Utilisateur connecté via **zkLogin** (Enoki) : `EnokiProviders` et `ZkLoginButton` du module [zklogin](../zklogin/README.md) doivent être en place.
- Variable d’environnement **`ENOKI_PRIVATE_API_KEY`** définie côté serveur (clé **privée** Enoki). Les appels Enoki pour sponsor et execute passent par les routes API Next.js (`/api/enoki/sponsor`, `/api/enoki/execute`) qui utilisent cette clé ; elle ne doit jamais être exposée au client.

## Flux

1. Construire une `Transaction` avec `@mysten/sui/transactions`.
2. Appeler `sponsorAndExecute(transaction)` depuis un composant qui utilise le hook `useSponsoredTransaction`.
3. Le hook : build la tx en `onlyTransactionKind`, récupère le JWT de la session Enoki, appelle **votre backend** (`POST /api/enoki/sponsor`) qui utilise la clé privée pour appeler Enoki, récupère les bytes à signer, demande la signature à l’utilisateur (wallet), puis appelle **votre backend** (`POST /api/enoki/execute`) pour exécuter la transaction sponsorisée.

## Usage

```tsx
"use client";

import { useSponsoredTransaction } from "@/enoki";
import { Transaction } from "@mysten/sui/transactions";

export function MyComponent() {
  const { sponsorAndExecute, isPending, error } = useSponsoredTransaction();

  const handleSubmit = async () => {
    const tx = new Transaction();
    // ex. tx.moveCall({ target: "0x2::...", arguments: [...] });
    const { digest } = await sponsorAndExecute(tx);
    console.log("Executed:", digest);
  };

  return (
    <button onClick={handleSubmit} disabled={isPending}>
      {isPending ? "Processing…" : "Send sponsored tx"}
    </button>
  );
}
```

Optionnel : passer un réseau explicite :

```tsx
await sponsorAndExecute(tx, { network: "testnet" });
```

## API

- **`getEnokiClient()`** : retourne l’instance singleton `EnokiClient` (pour usages avancés).
- **`useSponsoredTransaction()`** : hook React qui retourne :
  - **`sponsorAndExecute(transaction, options?)`** : sponsorise, fait signer et exécute la transaction.
  - **`isPending`** : `true` pendant le flux.
  - **`error`** : erreur éventuelle (pas de wallet, pas de session JWT, échec API ou signature).

## Backend (routes API)

Les routes **`app/api/enoki/sponsor/route.ts`** et **`app/api/enoki/execute/route.ts`** appellent l’API Enoki avec la clé privée (`ENOKI_PRIVATE_API_KEY`). Ne pas exposer cette clé au client.

## Références

- [Enoki – Sponsored transactions](https://docs.enoki.mystenlabs.com/ts-sdk/sponsored-transactions)
- [Enoki – Exemples](https://docs.enoki.mystenlabs.com/ts-sdk/examples)
