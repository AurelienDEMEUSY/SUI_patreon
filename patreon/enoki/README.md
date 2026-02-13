# Enoki

Ce dossier regroupe deux modules pour [Enoki](https://docs.enoki.mystenlabs.com) (Mysten Labs) sur Sui :

- **[zklogin](./zklogin/README.md)** — Authentification zkLogin (connexion avec Google, etc.) : providers React et composant bouton de connexion.
- **[sponsor](./sponsor/README.md)** — Sponsored transactions côté client : le gas est pris en charge par Enoki ; l’utilisateur signe la transaction avec son wallet zkLogin.

Les deux modules sont exportés via le barrel `@/enoki` : vous pouvez importer depuis `@/enoki` ou depuis `@/enoki/zklogin` / `@/enoki/sponsor` selon le besoin.

---

## Configuration Enoki (pour que tout soit fonctionnel)

### 1. Enoki Developer Portal

- **Où :** [portal.enoki.mystenlabs.com](https://portal.enoki.mystenlabs.com)
- **À faire :** Créer un compte (ou se connecter), puis créer une **app** (ou en sélectionner une).
- **Ce que tu en tires :**
  - **Clé API publique** → à mettre dans `NEXT_PUBLIC_ENOKI_API_KEY` (`.env.local`). Elle sert à la fois au zkLogin (enregistrement des wallets) et aux sponsored transactions côté client.
  - Dans le Portal : configurer les **origines autorisées** (Allowed origins) pour ton front : ex. `http://localhost:3000` en dev, puis l’URL de prod.

### 2. zkLogin (Google, etc.)

- **Où (Enoki) :** Dans le [Developer Portal](https://portal.enoki.mystenlabs.com), dans ta app → section **Authentication providers** (ou équivalent). Tu peux y voir / configurer les providers (Google, Facebook, Twitch…).
- **Où (Google) :** [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
  - Type : **Web application**.
  - **Authorized JavaScript origins** : ajouter `http://localhost:3000` (et plus tard ton domaine de prod).
  - **Authorized redirect URIs** : en général Enoki gère le redirect ; si le Portal te donne une URI de redirect à whitelister, l’ajouter ici.
- **Ce que tu en tires :** Un **Client ID** Google → à mettre dans `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (`.env.local`). C’est ce Client ID que tu renseignes aussi dans l’Enoki Portal pour le provider Google (si le Portal te le demande).

### 3. Sponsored transactions

- **Où :** Même [Enoki Developer Portal](https://portal.enoki.mystenlabs.com), même app.
- **À faire :** Créer une **clé API privée** en plus de la publique. Les sponsored transactions passent par le **backend** (routes `app/api/enoki/sponsor` et `app/api/enoki/execute`) qui utilisent cette clé privée ; elle ne doit **jamais** être exposée au client. Renseigner `ENOKI_PRIVATE_API_KEY` dans `.env.local`. Si le Portal propose des options « Sponsored transactions » ou « Allowed move call targets », tu peux les configurer pour restreindre quels appels Move sont autorisés.

### 4. Variables d’environnement (récap)

À définir dans **`patreon/.env.local`** (copier depuis `patreon/.env.example`) :

| Variable | Où la trouver |
|----------|----------------|
| `NEXT_PUBLIC_ENOKI_API_KEY` | Enoki Portal → ton app → clé API **publique** (zkLogin, frontend) |
| `ENOKI_PRIVATE_API_KEY` | Enoki Portal → ton app → clé API **privée** (sponsored tx, backend uniquement) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 Client ID (type Web application) |
| `NEXT_PUBLIC_SUI_NETWORK` | Choix du projet : `testnet`, `mainnet` ou `devnet` (défaut : `testnet`) |

### 5. Ordre recommandé

1. Créer / configurer l’app dans l’Enoki Portal et récupérer la clé API publique.
2. Créer le client OAuth Google et configurer les origines / redirects.
3. Associer le Client ID Google à l’app dans l’Enoki Portal (si demandé).
4. Remplir `.env.local` et redémarrer le serveur Next (`npm run dev`).
5. Intégrer les providers et le bouton (voir [zklogin/README.md](./zklogin/README.md)) puis tester la connexion et, si besoin, les sponsored transactions (voir [sponsor/README.md](./sponsor/README.md)).

