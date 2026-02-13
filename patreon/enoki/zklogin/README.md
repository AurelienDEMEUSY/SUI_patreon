# Enoki zkLogin

Ce sous-dossier contient les composants pour l’authentification **zkLogin** via [Enoki](https://docs.enoki.mystenlabs.com) (Mysten Labs) sur Sui. Le package est prêt à l’emploi mais **n’est pas branché** à l’app : suivez les étapes ci‑dessous pour l’intégrer plus tard.

## Contenu du package

| Fichier | Rôle |
|--------|------|
| `EnokiProviders.tsx` | Wrapper React : `QueryClientProvider` → `SuiClientProvider` → enregistrement des wallets Enoki → `WalletProvider`. À placer autour de l’app. |
| `ZkLoginButton.tsx` | Composant UI : boutons « Sign in with Google » (et autres providers) + affichage adresse / déconnexion une fois connecté. |
| `index.ts` | Exports publics : `EnokiProviders`, `ZkLoginButton`, `ZkLoginButtonProps`. |
| `.env.example` | À la racine du projet (`patreon/.env.example`) : variables à copier dans `.env.local`. |

Les composants zkLogin sont sous `patreon/enoki/zklogin/`. Vous pouvez importer depuis `@/enoki` (barrel racine) ou `@/enoki/zklogin`.

## Intégration future (étapes)

### 1. Variables d’environnement

- Copier `patreon/.env.example` vers `patreon/.env.local`.
- Renseigner :
  - **`NEXT_PUBLIC_ENOKI_API_KEY`** : clé API publique Enoki ([docs](https://docs.enoki.mystenlabs.com)).
  - **`NEXT_PUBLIC_GOOGLE_CLIENT_ID`** : client ID OAuth Google (Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs, type « Web application »). Ajouter les origines autorisées (ex. `http://localhost:3000`).
  - **`NEXT_PUBLIC_SUI_NETWORK`** : `testnet` | `mainnet` | `devnet` (défaut : `testnet`).

### 2. Envelopper l’app avec les providers

Dans **`app/layout.tsx`** :

```tsx
import { EnokiProviders } from "@/enoki";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <EnokiProviders>{children}</EnokiProviders>
      </body>
    </html>
  );
}
```

### 3. Afficher le bouton de connexion

Là où vous voulez le login (ex. header ou page d’accueil) :

```tsx
import { ZkLoginButton } from "@/enoki";

// Dans votre JSX :
<ZkLoginButton className="flex gap-2" />
```

- Si la page est pré-rendue statiquement et que vous voyez une erreur du type « Could not find WalletContext », ajoutez sur cette page :

```tsx
export const dynamic = "force-dynamic";
```

### 4. Optionnel : autres providers

Pour Facebook / Twitch, ajouter dans `EnokiProviders.tsx` (dans l’objet `providers` de `registerEnokiWallets`) les `clientId` correspondants, et définir les variables d’environnement (ex. `NEXT_PUBLIC_FACEBOOK_CLIENT_ID`). Les libellés sont déjà gérés dans `ZkLoginButton` pour ces providers.

## Dépendances

Aucune installation supplémentaire : le package s’appuie sur les dépendances déjà présentes dans le projet (`@mysten/dapp-kit`, `@mysten/enoki`, `@mysten/sui`, `@tanstack/react-query`).

## Références

- [Enoki – docs](https://docs.enoki.mystenlabs.com)
- [zkLogin sur Sui](https://docs.sui.io/standards/zklogin)
