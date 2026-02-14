# INDEXER.md — Guide d'implémentation GraphQL Indexer pour DePatreon

> **Objectif** : Remplacer tous les appels JSON-RPC (queryEvents + getObject + getTransactionBlock) par des requêtes GraphQL typées, plus performantes, et préparer le terrain pour un indexeur custom en production.

---

## Table des matières

1. [Diagnostic : Pourquoi un indexeur ?](#1-diagnostic--pourquoi-un-indexeur-)
2. [Architecture cible](#2-architecture-cible)
3. [Choix technique : SUI GraphQL RPC Beta vs Custom Indexer](#3-choix-technique)
4. [Phase 0 — Setup du client GraphQL](#phase-0--setup-du-client-graphql)
5. [Phase 1 — Requêtes GraphQL : Creators](#phase-1--requêtes-graphql--creators)
6. [Phase 2 — Requêtes GraphQL : Posts & Content](#phase-2--requêtes-graphql--posts--content)
7. [Phase 3 — Requêtes GraphQL : Subscriptions](#phase-3--requêtes-graphql--subscriptions)
8. [Phase 4 — Hooks : Migration JSON-RPC → GraphQL](#phase-4--hooks--migration-json-rpc--graphql)
9. [Phase 5 — Optimisations avancées](#phase-5--optimisations-avancées)
10. [Phase 6 (Future) — Custom Indexer avec PostgreSQL](#phase-6-future--custom-indexer-avec-postgresql)
11. [Checklist finale](#checklist-finale)

---

## 1. Diagnostic : Pourquoi un indexeur ?

### Problèmes actuels

Le frontend utilise JSON-RPC avec un pattern très coûteux :

| Fichier | Problème | Impact |
|---|---|---|
| `hooks/useAllCreators.ts` | queryEvents → boucle getTransactionBlock → multiGetObjects | **N+2 appels RPC** pour N créateurs |
| `hooks/useCreator.ts` | queryEvents × 2 → boucle getTransactionBlock → getObject | **4-6 appels RPC** par créateur |
| `hooks/useMySubscriptions.ts` | queryEvents × 3 → boucle getTransactionBlock → multiGetObjects → getDynamicFieldObject par créateur | **O(N²) appels RPC** |
| `hooks/useCreatorPosts.ts` | getObject unique (ok) mais pas de pagination ni tri côté serveur | Charge tout en mémoire |
| `lib/service-lookup.ts` | queryEvents × 2 + getTransactionBlock + getObject | **4 appels par lookup** |

### Résultat

- **Lenteur** : Chargement de la page "Explore" = 10-50 appels RPC séquentiels
- **Limite des events** : `limit: 50` → pas de pagination, manque les creators au-delà de 50
- **Pas de recherche** : Impossible de chercher un créateur par nom
- **Pas de tri/filtre** : Tri côté client uniquement
- **Fragilité** : Les events JSON-RPC ne retournent pas les Object IDs directement

### Ce que GraphQL résout

| Besoin | JSON-RPC (actuel) | GraphQL (cible) |
|---|---|---|
| Liste de tous les creators | N+2 appels | **1 requête** |
| Profil d'un creator | 4-6 appels | **1 requête** |
| Posts d'un creator | 1 appel (ok) | **1 requête avec pagination** |
| Subscriptions d'un user | O(N²) appels | **1-2 requêtes** |
| Recherche par nom | Impossible | **1 requête avec filtre** |
| Pagination | Manuelle, limitée | **Curseurs natifs** |

---

## 2. Architecture cible

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND                                                     │
│                                                              │
│  ┌───────────┐   ┌────────────┐   ┌──────────────────────┐  │
│  │ Component  │──▶│   Hook     │──▶│ GraphQL Query Layer  │  │
│  │   (UI)     │   │            │   │                      │  │
│  └─────┬──────┘   └─────┬──────┘   │  lib/graphql/        │  │
│        │               │          │  ├── client.ts        │  │
│        │          ┌─────▼──────┐   │  ├── queries/         │  │
│        │          │   Store    │   │  │   ├── creators.ts  │  │
│        │          │ (Zustand)  │   │  │   ├── posts.ts     │  │
│        │          └────────────┘   │  │   ├── subs.ts      │  │
│        │                          │  │   └── platform.ts  │  │
│        │                          │  ├── fragments/        │  │
│        │                          │  │   ├── service.ts    │  │
│        │                          │  │   ├── post.ts       │  │
│        │                          │  │   └── tier.ts       │  │
│        │                          │  └── types.ts          │  │
│        │                          └──────────┬─────────────┘  │
└────────┼─────────────────────────────────────┼────────────────┘
         │                                     │
         │                          ┌──────────▼─────────────┐
         │                          │ SUI GraphQL RPC (Beta) │
         │                          │                        │
         │                          │ https://graphql.       │
         │                          │  testnet.sui.io/graphql│
         │                          └────────────────────────┘
         │
         │                          ┌────────────────────────┐
         └─────────────────────────▶│ WALRUS (blobs directs) │
                                    └────────────────────────┘
```

### Nouveaux fichiers à créer

```
app/
├── lib/
│   ├── graphql/                    # ══ NOUVEAU : Layer GraphQL ══
│   │   ├── client.ts               # SuiGraphQLClient singleton
│   │   ├── queries/
│   │   │   ├── creators.ts         # getAllCreators, getCreatorByAddress, searchCreators
│   │   │   ├── posts.ts            # getCreatorPosts, getPostById
│   │   │   ├── subscriptions.ts    # getUserSubscriptions, getSubscriptionStatus
│   │   │   └── platform.ts         # getPlatformStats
│   │   ├── fragments/
│   │   │   ├── service.ts          # ServiceFragment (réutilisable)
│   │   │   ├── post.ts             # PostFragment
│   │   │   └── tier.ts             # TierFragment
│   │   ├── parsers.ts              # Fonctions de parsing GraphQL → types app
│   │   └── index.ts                # Barrel export
│   └── ...
```

### Fichiers à modifier

```
app/
├── hooks/
│   ├── useAllCreators.ts           # MODIFIER : remplacer JSON-RPC par GraphQL
│   ├── useCreator.ts               # MODIFIER : remplacer JSON-RPC par GraphQL
│   ├── useCreatorPosts.ts          # MODIFIER : remplacer JSON-RPC par GraphQL
│   ├── useMySubscriptions.ts       # MODIFIER : remplacer JSON-RPC par GraphQL
│   └── useSubscriptionStatus.ts    # MODIFIER : remplacer JSON-RPC par GraphQL
├── lib/
│   ├── service-lookup.ts           # SUPPRIMER (remplacé par GraphQL)
│   └── contract-constants.ts       # MODIFIER : ajouter GRAPHQL_URL
```

---

## 3. Choix technique

### Option A : SUI GraphQL RPC Beta (RECOMMANDÉ pour le hackathon)

| Avantage | Détail |
|---|---|
| Zero infra | Endpoint managé par Mysten Labs |
| Typesafe | `gql.tada` via `@mysten/sui/graphql` |
| Déjà installé | Le package `@mysten/sui` est dans le projet |
| Testnet ready | `https://graphql.testnet.sui.io/graphql` |
| Pagination native | Curseurs, `first`/`after`, `last`/`before` |
| Filtres puissants | Par type, module, sender, checkpoint |

> **IMPORTANT** : JSON-RPC est deprecated avec une deadline de migration en **avril 2026**. Autant migrer maintenant.

### Option B : Custom Indexer (pour la production)

| Aspect | Détail |
|---|---|
| Framework | `sui-indexer-alt-framework` (Rust) |
| Base de données | PostgreSQL + Diesel ORM |
| API | GraphQL custom (avec Juniper ou async-graphql) |
| Infrastructure | Serveur dédié, ~4GB RAM, ~450GB stockage (30j) |
| Avantage | Requêtes libres, agrégations, full-text search |

> Pour le hackathon : **Option A uniquement**. L'Option B est documentée en Phase 6 pour référence future.

---

## Phase 0 — Setup du client GraphQL

> **Objectif** : Créer le client GraphQL singleton et valider qu'il fonctionne.
> **Fichiers** : 2 à créer, 1 à modifier
> **Durée estimée** : ~15 min

### Étape 0.1 — Ajouter la constante GraphQL

**Fichier** : `app/lib/contract-constants.ts`

**Modification** : Ajouter en haut du fichier, après les imports existants :

```typescript
// ============================================================
// GraphQL Configuration
// ============================================================

/**
 * SUI GraphQL RPC Beta endpoint.
 * @see https://docs.sui.io/guides/developer/getting-started/graphql-rpc
 */
export const SUI_GRAPHQL_URL = process.env.NEXT_PUBLIC_SUI_GRAPHQL_URL
    ?? `https://graphql.${SUI_NETWORK}.sui.io/graphql`;
```

### Étape 0.2 — Créer le client GraphQL

**Fichier à créer** : `app/lib/graphql/client.ts`

```typescript
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { SUI_GRAPHQL_URL } from '@/lib/contract-constants';

/**
 * Singleton SuiGraphQLClient for all GraphQL queries.
 *
 * Uses the SUI GraphQL RPC Beta endpoint.
 * All queries in the app must go through this client.
 */
let _client: SuiGraphQLClient | null = null;

export function getGraphQLClient(): SuiGraphQLClient {
    if (!_client) {
        _client = new SuiGraphQLClient({
            url: SUI_GRAPHQL_URL,
        });
    }
    return _client;
}
```

### Étape 0.3 — Créer le barrel export

**Fichier à créer** : `app/lib/graphql/index.ts`

```typescript
export { getGraphQLClient } from './client';
```

### Étape 0.4 — Test de validation

Créer un petit test temporaire pour valider la connexion :

```typescript
// Test temporaire dans la console du navigateur ou un composant dev
import { getGraphQLClient } from '@/lib/graphql';
import { graphql } from '@mysten/sui/graphql/schemas/latest';

const testQuery = graphql(`
    query {
        chainIdentifier
    }
`);

const client = getGraphQLClient();
const result = await client.query({ query: testQuery });
console.log('Chain ID:', result.data?.chainIdentifier);
// Attendu sur testnet : "4c78adac"
```

### Validation Phase 0

- [ ] `SUI_GRAPHQL_URL` ajouté à `contract-constants.ts`
- [ ] `lib/graphql/client.ts` créé avec singleton
- [ ] `lib/graphql/index.ts` créé
- [ ] Test de connexion retourne `chainIdentifier` correct

---

## Phase 1 — Requêtes GraphQL : Creators

> **Objectif** : Écrire toutes les requêtes GraphQL pour les données creators.
> **Fichiers** : 3 à créer
> **Durée estimée** : ~30 min

### Étape 1.1 — Fragment Service réutilisable

**Fichier à créer** : `app/lib/graphql/fragments/service.ts`

Le fragment Service est la brique de base. Il extrait les champs du Move object `Service` qui correspond à un creator.

```typescript
import { graphql } from '@mysten/sui/graphql/schemas/latest';

/**
 * Fragment for the Service Move object fields.
 *
 * This maps to contract::service::Service on-chain.
 * Used by all creator-related queries.
 */
export const ServiceContentFragment = graphql(`
    fragment ServiceContent on MoveObject {
        address
        contents {
            json
            type {
                repr
            }
        }
    }
`);
```

> **Note sur `contents.json`** : Le champ `json` retourne un JSON non typé contenant tous les fields du Move object (name, description, avatar_blob_id, tiers, posts, etc.). C'est l'équivalent de `(obj.data.content as any).fields` dans le code actuel.

### Étape 1.2 — Requêtes Creators

**Fichier à créer** : `app/lib/graphql/queries/creators.ts`

```typescript
import { graphql } from '@mysten/sui/graphql/schemas/latest';
import { getGraphQLClient } from '../client';
import { PACKAGE_ID } from '@/lib/contract-constants';

// ============================================================
// Query: Get all creator Service objects
// ============================================================

/**
 * Fetches all Service objects (creators) from the package.
 *
 * Uses the `objects` query filtered by the Service type.
 * This replaces the entire useAllCreators flow:
 *   queryEvents(CreatorRegistered) → getTransactionBlock → multiGetObjects
 *
 * Now: 1 single query.
 */
const ALL_CREATORS_QUERY = graphql(`
    query getAllCreators($serviceType: String!, $first: Int, $after: String) {
        objects(
            first: $first
            after: $after
            filter: {
                type: $serviceType
            }
        ) {
            nodes {
                address
                asMoveObject {
                    contents {
                        json
                        type {
                            repr
                        }
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
`);

export async function queryAllCreators(first: number = 50, after?: string) {
    const client = getGraphQLClient();
    const serviceType = `${PACKAGE_ID}::service::Service`;

    return client.query({
        query: ALL_CREATORS_QUERY,
        variables: {
            serviceType,
            first,
            after: after ?? null,
        },
    });
}

// ============================================================
// Query: Get a single creator by Service object ID
// ============================================================

/**
 * Fetches a single Service object by its object ID.
 *
 * This replaces: getObject({ id, options: { showContent: true } })
 */
const CREATOR_BY_OBJECT_ID_QUERY = graphql(`
    query getCreatorByObjectId($objectId: SuiAddress!) {
        object(address: $objectId) {
            address
            asMoveObject {
                contents {
                    json
                    type {
                        repr
                    }
                }
            }
        }
    }
`);

export async function queryCreatorByObjectId(objectId: string) {
    const client = getGraphQLClient();
    return client.query({
        query: CREATOR_BY_OBJECT_ID_QUERY,
        variables: { objectId },
    });
}

// ============================================================
// Query: Find creator Service ID via CreatorRegistered events
// ============================================================

/**
 * Queries CreatorRegistered events filtered by sender (creator address).
 *
 * This replaces: queryEvents({ MoveEventType: '...::CreatorRegistered' })
 *                + getTransactionBlock loop
 *
 * The GraphQL event query can return the transaction effects,
 * which include the created objects — no need for a second query.
 */
const CREATOR_EVENTS_QUERY = graphql(`
    query getCreatorEvents($eventType: String!, $first: Int, $after: String) {
        events(
            first: $first
            after: $after
            filter: {
                eventType: $eventType
            }
        ) {
            nodes {
                json
                timestamp
                sender {
                    address
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
`);

export async function queryCreatorRegisteredEvents(first: number = 50, after?: string) {
    const client = getGraphQLClient();
    const eventType = `${PACKAGE_ID}::service::CreatorRegistered`;

    return client.query({
        query: CREATOR_EVENTS_QUERY,
        variables: {
            eventType,
            first,
            after: after ?? null,
        },
    });
}

export async function queryCreatorDeletedEvents(first: number = 50, after?: string) {
    const client = getGraphQLClient();
    const eventType = `${PACKAGE_ID}::service::CreatorDeleted`;

    return client.query({
        query: CREATOR_EVENTS_QUERY,
        variables: {
            eventType,
            first,
            after: after ?? null,
        },
    });
}

// ============================================================
// Query: Get creator's dynamic field (subscriber check)
// ============================================================

/**
 * Check if a user has a subscription entry in a Service's subscribers Table.
 *
 * This replaces: getDynamicFieldObject({ parentId, name: { type: 'address', value } })
 */
const DYNAMIC_FIELD_QUERY = graphql(`
    query getDynamicField($parentId: SuiAddress!, $fieldName: DynamicFieldName!) {
        object(address: $parentId) {
            dynamicField(name: $fieldName) {
                value {
                    ... on MoveValue {
                        json
                        type {
                            repr
                        }
                    }
                }
            }
        }
    }
`);

export async function querySubscriberDynamicField(
    subscribersTableId: string,
    subscriberAddress: string,
) {
    const client = getGraphQLClient();
    return client.query({
        query: DYNAMIC_FIELD_QUERY,
        variables: {
            parentId: subscribersTableId,
            fieldName: {
                type: 'address',
                bcs: subscriberAddress, // BCS-encoded address
            },
        },
    });
}
```

### Étape 1.3 — Parsers : GraphQL → Types App

**Fichier à créer** : `app/lib/graphql/parsers.ts`

```typescript
import type { Creator, Tier } from '@/types';
import type { OnChainPost } from '@/types/post.types';
import { getWalrusImageUrl } from '@/lib/walrus';

/**
 * Common shape of a Service object from GraphQL `contents.json`.
 *
 * This is the JSON representation of the on-chain Move struct.
 */
interface ServiceJson {
    id: { id: string };
    creator: string;
    name: string;
    description: string;
    avatar_blob_id: string;
    tiers: Array<{
        tier_level: string;
        name: string;
        price: string;
        duration_ms: string;
    }>;
    posts: Array<{
        post_id: string;
        title: string;
        metadata_blob_id: string;
        data_blob_id: string;
        required_tier: string;
        created_at_ms: string;
    }>;
    next_post_id: string;
    subscribers: { id: { id: string } };
    revenue: string;
    suins_name: string | null;
}

/**
 * Parse a GraphQL Service object node into our Creator type.
 *
 * @param objectAddress - The object's on-chain address (= serviceObjectId)
 * @param json - The `contents.json` field from the GraphQL response
 */
export function parseServiceToCreator(
    objectAddress: string,
    json: ServiceJson,
): Creator {
    const tiers: Tier[] = (json.tiers || []).map((t, index) => ({
        id: `${objectAddress}_tier_${t.tier_level}`,
        creatorAddress: json.creator,
        name: t.name || '',
        description: '',
        priceInMist: Number(t.price || 0),
        sealPolicyId: objectAddress,
        benefits: [],
        subscriberCount: 0,
        order: Number(t.tier_level || index + 1),
        tierLevel: Number(t.tier_level || index + 1),
        durationMs: Number(t.duration_ms || 0),
    }));

    return {
        address: json.creator,
        name: json.name || 'Creator',
        bio: json.description || '',
        avatarBlobId: json.avatar_blob_id
            ? getWalrusImageUrl(json.avatar_blob_id)
            : null,
        bannerBlobId: null,
        suinsName: json.suins_name ?? null,
        totalSubscribers: 0,
        totalContent: (json.posts || []).length,
        tiers,
        createdAt: Math.floor(Date.now() / 1000),
        serviceObjectId: objectAddress,
    };
}

/**
 * Parse a GraphQL Service object's posts into OnChainPost[].
 */
export function parseServicePosts(
    serviceObjectId: string,
    json: ServiceJson,
): OnChainPost[] {
    return (json.posts || []).map((p) => ({
        postId: Number(p.post_id),
        title: p.title,
        metadataBlobId: p.metadata_blob_id,
        dataBlobId: p.data_blob_id,
        requiredTier: Number(p.required_tier),
        createdAtMs: Number(p.created_at_ms),
        serviceObjectId,
    }));
}

/**
 * Extract the subscribers Table object ID from Service JSON.
 */
export function getSubscribersTableId(json: ServiceJson): string {
    return json.subscribers?.id?.id ?? '';
}

/**
 * Extract next_post_id from Service JSON.
 */
export function getNextPostIdFromJson(json: ServiceJson): number {
    return Number(json.next_post_id || 0);
}
```

### Validation Phase 1

- [ ] `lib/graphql/fragments/service.ts` créé
- [ ] `lib/graphql/queries/creators.ts` créé avec 4 queries
- [ ] `lib/graphql/parsers.ts` créé avec fonctions de parsing
- [ ] `queryAllCreators()` retourne des Service objects sur testnet
- [ ] `queryCreatorByObjectId()` retourne un Service complet

---

## Phase 2 — Requêtes GraphQL : Posts & Content

> **Objectif** : Requêtes pour les posts, avec support de la pagination.
> **Fichiers** : 1 à créer
> **Durée estimée** : ~15 min

### Étape 2.1 — Requêtes Posts

**Fichier à créer** : `app/lib/graphql/queries/posts.ts`

```typescript
import { graphql } from '@mysten/sui/graphql/schemas/latest';
import { getGraphQLClient } from '../client';
import { PACKAGE_ID } from '@/lib/contract-constants';

// ============================================================
// Query: Get a single Service object (for posts)
// ============================================================

/**
 * Fetch a Service object by ID — used to get posts array.
 *
 * This is the same as queryCreatorByObjectId but can be used
 * independently for the posts use case.
 *
 * Note: Posts are stored inside the Service object as a vector,
 * so we always get all posts when we fetch the Service.
 * Pagination happens client-side unless we migrate to a
 * custom indexer (Phase 6).
 */
const SERVICE_OBJECT_QUERY = graphql(`
    query getServiceObject($objectId: SuiAddress!) {
        object(address: $objectId) {
            address
            asMoveObject {
                contents {
                    json
                }
            }
        }
    }
`);

export async function queryServiceObject(serviceObjectId: string) {
    const client = getGraphQLClient();
    return client.query({
        query: SERVICE_OBJECT_QUERY,
        variables: { objectId: serviceObjectId },
    });
}

// ============================================================
// Query: PostPublished events (for cross-creator feeds)
// ============================================================

/**
 * Fetches PostPublished events across all creators.
 *
 * Useful for building a global feed — query recent PostPublished events,
 * then batch-fetch the corresponding Service objects.
 */
const POST_PUBLISHED_EVENTS_QUERY = graphql(`
    query getPostPublishedEvents($first: Int, $after: String) {
        events(
            first: $first
            after: $after
            filter: {
                eventType: "${PACKAGE_ID}::service::PostPublished"
            }
        ) {
            nodes {
                json
                timestamp
                sender {
                    address
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
`);

export async function queryPostPublishedEvents(first: number = 20, after?: string) {
    const client = getGraphQLClient();
    return client.query({
        query: POST_PUBLISHED_EVENTS_QUERY,
        variables: {
            first,
            after: after ?? null,
        },
    });
}
```

> **Note importante** : Les posts sont stockés dans un `vector<Post>` à l'intérieur du `Service` object. Le GraphQL de SUI retourne l'objet entier — il n'y a pas de moyen de paginer à l'intérieur d'un vector on-chain. La pagination se fait côté client, ou via un custom indexer (Phase 6).

### Validation Phase 2

- [ ] `lib/graphql/queries/posts.ts` créé
- [ ] `queryServiceObject()` retourne les posts d'un creator
- [ ] `queryPostPublishedEvents()` retourne des events de publication

---

## Phase 3 — Requêtes GraphQL : Subscriptions

> **Objectif** : Requêtes pour les subscriptions et le statut d'abonnement.
> **Fichiers** : 1 à créer
> **Durée estimée** : ~20 min

### Étape 3.1 — Requêtes Subscriptions

**Fichier à créer** : `app/lib/graphql/queries/subscriptions.ts`

```typescript
import { graphql } from '@mysten/sui/graphql/schemas/latest';
import { getGraphQLClient } from '../client';
import { PACKAGE_ID } from '@/lib/contract-constants';

// ============================================================
// Query: SubscriptionPurchased events for a specific subscriber
// ============================================================

/**
 * Find all SubscriptionPurchased events sent by a specific address.
 *
 * This replaces the queryEvents + manual filter in useMySubscriptions.
 */
const SUBSCRIPTION_EVENTS_QUERY = graphql(`
    query getSubscriptionEvents(
        $eventType: String!
        $senderAddress: SuiAddress
        $first: Int
        $after: String
    ) {
        events(
            first: $first
            after: $after
            filter: {
                eventType: $eventType
                sender: $senderAddress
            }
        ) {
            nodes {
                json
                timestamp
                sender {
                    address
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
`);

export async function querySubscriptionPurchasedEvents(
    senderAddress?: string,
    first: number = 50,
    after?: string,
) {
    const client = getGraphQLClient();
    return client.query({
        query: SUBSCRIPTION_EVENTS_QUERY,
        variables: {
            eventType: `${PACKAGE_ID}::subscription::SubscriptionPurchased`,
            senderAddress: senderAddress ?? null,
            first,
            after: after ?? null,
        },
    });
}

export async function querySubscriptionRenewedEvents(
    senderAddress?: string,
    first: number = 50,
    after?: string,
) {
    const client = getGraphQLClient();
    return client.query({
        query: SUBSCRIPTION_EVENTS_QUERY,
        variables: {
            eventType: `${PACKAGE_ID}::subscription::SubscriptionRenewed`,
            senderAddress: senderAddress ?? null,
            first,
            after: after ?? null,
        },
    });
}

// ============================================================
// Query: Check subscription via dynamic field
// ============================================================

/**
 * Check if a specific address has an active subscription
 * in a creator's Service subscribers Table.
 *
 * Uses dynamic field lookup on the Table object.
 */
const SUBSCRIPTION_STATUS_QUERY = graphql(`
    query getSubscriptionStatus(
        $subscribersTableId: SuiAddress!
        $subscriberAddress: String!
    ) {
        object(address: $subscribersTableId) {
            dynamicField(name: {
                type: "address"
                bcs: $subscriberAddress
            }) {
                value {
                    ... on MoveValue {
                        json
                    }
                }
            }
        }
    }
`);

export async function querySubscriptionStatus(
    subscribersTableId: string,
    subscriberAddress: string,
) {
    const client = getGraphQLClient();
    return client.query({
        query: SUBSCRIPTION_STATUS_QUERY,
        variables: {
            subscribersTableId,
            subscriberAddress,
        },
    });
}

// ============================================================
// Query: Batch fetch multiple Service objects (for subscribed creators)
// ============================================================

/**
 * Batch fetch multiple objects by their IDs.
 *
 * This replaces: suiClient.multiGetObjects({ ids, options: { showContent: true } })
 *
 * Note: GraphQL doesn't have a native "multiGet" — we use objectConnection
 * filtered by a list of IDs, or make parallel queries.
 */
const MULTI_OBJECTS_QUERY = graphql(`
    query getMultipleObjects($ids: [SuiAddress!]!) {
        objects(filter: { objectIds: $ids }) {
            nodes {
                address
                asMoveObject {
                    contents {
                        json
                        type {
                            repr
                        }
                    }
                }
            }
        }
    }
`);

export async function queryMultipleObjects(objectIds: string[]) {
    const client = getGraphQLClient();
    return client.query({
        query: MULTI_OBJECTS_QUERY,
        variables: { ids: objectIds },
    });
}
```

### Validation Phase 3

- [ ] `lib/graphql/queries/subscriptions.ts` créé
- [ ] `querySubscriptionPurchasedEvents()` filtre bien par sender
- [ ] `querySubscriptionStatus()` retourne le tier + expiry
- [ ] `queryMultipleObjects()` batch-fetch fonctionne

---

## Phase 4 — Hooks : Migration JSON-RPC → GraphQL

> **Objectif** : Migrer chaque hook existant pour utiliser les queries GraphQL.
> **Fichiers** : 5 à modifier, 1 à supprimer
> **Durée estimée** : ~45 min
>
> **IMPORTANT** : Migrer un hook à la fois. Tester après chaque migration. Ne pas tout casser d'un coup.

### Étape 4.1 — Migrer `useAllCreators.ts`

**Fichier** : `app/hooks/useAllCreators.ts`

**Avant** (résumé du flux actuel) :
```
queryEvents(CreatorRegistered) + queryEvents(CreatorDeleted)
→ filter deleted
→ loop getTransactionBlock (pour chaque event)
→ multiGetObjects
→ parse fields
```

**Après** (nouveau flux) :
```
queryAllCreators()  // 1 seule requête GraphQL
→ parse json
→ filter out deleted (via queryCreatorDeletedEvents si nécessaire)
```

**Remplacement complet** :

```typescript
'use client';

import { useState, useEffect } from 'react';
import { queryAllCreators } from '@/lib/graphql/queries/creators';
import { parseServiceToCreator } from '@/lib/graphql/parsers';
import type { Creator } from '@/types';
import { PACKAGE_ID } from '@/lib/contract-constants';

/**
 * Fetches ALL active creators registered on the platform via GraphQL.
 *
 * MIGRATED: Previously used JSON-RPC queryEvents + getTransactionBlock loop.
 * Now uses a single GraphQL `objects` query filtered by Service type.
 */
export function useAllCreators() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchAllCreators = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await queryAllCreators(50);

                if (cancelled) return;

                const nodes = result.data?.objects?.nodes ?? [];
                const parsedCreators: Creator[] = [];

                for (const node of nodes) {
                    const json = node.asMoveObject?.contents?.json;
                    if (!json) continue;

                    const creator = parseServiceToCreator(node.address, json);
                    parsedCreators.push(creator);
                }

                if (!cancelled) {
                    setCreators(parsedCreators);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('[useAllCreators] GraphQL error:', err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch creators');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchAllCreators();
        return () => { cancelled = true; };
    }, []);

    return { creators, isLoading, error };
}
```

> **Note** : La query `objects(filter: { type })` ne retourne que les objets existants — les Service objects supprimés (via `delete_creator_profile`) n'apparaissent pas. On n'a plus besoin de filtrer les CreatorDeleted events.

### Étape 4.2 — Migrer `useCreator.ts`

**Fichier** : `app/hooks/useCreator.ts`

**Avant** :
```
findActiveServiceId(address) → 4-6 RPC calls
→ getObject(serviceId) → parse fields
```

**Après** :
```
queryAllCreators() filtered or queryCreatorByObjectId()
→ parse json
```

**Points clés du remplacement** :

1. Si on a un `serviceObjectId` connu → utiliser `queryCreatorByObjectId()`
2. Si on a une `address` → requêter les Service objects filtrés par `creator` field
3. Le parsing utilise `parseServiceToCreator()` du fichier `parsers.ts`

**Approche recommandée** : Puisque `queryAllCreators()` retourne tous les Service objects, on peut soit :
- (a) Chercher dans le résultat global (si déjà en cache via React Query)
- (b) Utiliser `queryCreatorByObjectId()` si on a le serviceObjectId
- (c) Faire une query events `CreatorRegistered` filtrée par sender pour trouver le serviceObjectId

Pour simplifier, l'approche (b) avec fallback sur events est recommandée :

```typescript
// Pseudo-code du nouveau useCreator
const fetchCreator = async () => {
    // Si on a déjà un serviceObjectId (par ex. depuis useAllCreators cache)
    if (isServiceObjectId(effectiveAddress)) {
        const result = await queryCreatorByObjectId(effectiveAddress);
        const json = result.data?.object?.asMoveObject?.contents?.json;
        if (json) {
            setCreator(parseServiceToCreator(effectiveAddress, json));
            setServiceObjectId(effectiveAddress);
            return;
        }
    }

    // Sinon, chercher via les Service objects de type Service
    // où creator == effectiveAddress
    const result = await queryAllCreators(50);
    const node = result.data?.objects?.nodes?.find(
        (n) => n.asMoveObject?.contents?.json?.creator === effectiveAddress
    );

    if (node) {
        const json = node.asMoveObject.contents.json;
        setCreator(parseServiceToCreator(node.address, json));
        setServiceObjectId(node.address);
    } else {
        // Pas de profil créateur
        setCreator({ /* default empty profile */ });
        setServiceObjectId(null);
    }
};
```

### Étape 4.3 — Migrer `useCreatorPosts.ts`

**Fichier** : `app/hooks/useCreatorPosts.ts`

Ce hook est le plus simple à migrer car il fait déjà un seul `getObject()`.

**Remplacement** : Utiliser `queryServiceObject()` au lieu de `suiClient.getObject()`, puis `parseServicePosts()` pour le parsing.

```typescript
// Clé du changement dans fetchPosts :
const result = await queryServiceObject(serviceObjectId);
const json = result.data?.object?.asMoveObject?.contents?.json;
if (json) {
    const parsedPosts = parseServicePosts(serviceObjectId, json);
    parsedPosts.sort((a, b) => b.createdAtMs - a.createdAtMs);
    setPosts(parsedPosts);
    setNextPostId(getNextPostIdFromJson(json));
}
```

### Étape 4.4 — Migrer `useMySubscriptions.ts`

**Fichier** : `app/hooks/useMySubscriptions.ts`

C'est le hook le plus complexe. Le nouveau flux :

```
1. querySubscriptionPurchasedEvents(senderAddress)
   + querySubscriptionRenewedEvents(senderAddress)
2. Extraire les creator addresses uniques depuis les events
3. queryAllCreators() pour trouver les Service objects
4. Pour chaque Service, querySubscriptionStatus() via dynamic field
5. Filtrer les subscriptions actives
6. Parser les résultats
```

Cela reste plusieurs requêtes, mais chacune est plus efficace que l'équivalent JSON-RPC.

### Étape 4.5 — Supprimer `service-lookup.ts`

**Fichier** : `app/lib/service-lookup.ts`

Une fois que les 4 hooks sont migrés et testés :
1. Vérifier qu'aucun autre fichier n'importe depuis `service-lookup.ts`
2. Supprimer le fichier
3. Retirer les exports de `lib/index.ts` si applicable

### Validation Phase 4

- [ ] `useAllCreators` migré et testé — la page "Explore" charge les creators
- [ ] `useCreator` migré et testé — la page profil creator charge correctement
- [ ] `useCreatorPosts` migré et testé — les posts s'affichent
- [ ] `useMySubscriptions` migré et testé — les subscriptions s'affichent
- [ ] `service-lookup.ts` supprimé
- [ ] Aucune régression visuelle

---

## Phase 5 — Optimisations avancées

> **Objectif** : Caching, pagination UI, et requêtes avancées.
> **Durée estimée** : ~30 min
>
> **Pré-requis** : Phases 0-4 terminées et fonctionnelles.

### Étape 5.1 — Intégration avec React Query (TanStack Query)

Le projet utilise déjà `@tanstack/react-query` (dans `package.json`). Intégrer les queries GraphQL dans le cache React Query pour :
- **Déduplication** : Pas de requête en double si 2 composants demandent les mêmes données
- **Stale-while-revalidate** : Afficher les données en cache pendant le refetch
- **Cache** : Les données creators sont stables, le cache peut durer 30s-1min

```typescript
// Exemple avec React Query
import { useQuery } from '@tanstack/react-query';
import { queryAllCreators } from '@/lib/graphql/queries/creators';
import { parseServiceToCreator } from '@/lib/graphql/parsers';

export function useAllCreators() {
    return useQuery({
        queryKey: ['allCreators'],
        queryFn: async () => {
            const result = await queryAllCreators(50);
            const nodes = result.data?.objects?.nodes ?? [];
            return nodes
                .filter((n) => n.asMoveObject?.contents?.json)
                .map((n) => parseServiceToCreator(n.address, n.asMoveObject!.contents!.json));
        },
        staleTime: 30_000, // 30 secondes
        gcTime: 5 * 60_000, // 5 minutes
    });
}
```

### Étape 5.2 — Pagination infinie pour Explore

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export function useAllCreatorsPaginated() {
    return useInfiniteQuery({
        queryKey: ['allCreators', 'paginated'],
        queryFn: async ({ pageParam }) => {
            const result = await queryAllCreators(20, pageParam);
            const nodes = result.data?.objects?.nodes ?? [];
            const pageInfo = result.data?.objects?.pageInfo;

            return {
                creators: nodes
                    .filter((n) => n.asMoveObject?.contents?.json)
                    .map((n) => parseServiceToCreator(n.address, n.asMoveObject!.contents!.json)),
                nextCursor: pageInfo?.hasNextPage ? pageInfo.endCursor : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined as string | undefined,
    });
}
```

### Étape 5.3 — Query Platform Stats

**Fichier à créer** : `app/lib/graphql/queries/platform.ts`

```typescript
import { graphql } from '@mysten/sui/graphql/schemas/latest';
import { getGraphQLClient } from '../client';
import { PLATFORM_ID } from '@/lib/contract-constants';

const PLATFORM_STATS_QUERY = graphql(`
    query getPlatformStats($platformId: SuiAddress!) {
        object(address: $platformId) {
            asMoveObject {
                contents {
                    json
                }
            }
        }
    }
`);

export async function queryPlatformStats() {
    const client = getGraphQLClient();
    return client.query({
        query: PLATFORM_STATS_QUERY,
        variables: { platformId: PLATFORM_ID },
    });
}
```

### Validation Phase 5

- [ ] React Query intégré dans les hooks GraphQL
- [ ] Pagination infinie fonctionne sur la page Explore
- [ ] Cache fonctionne (pas de requête en double sur navigation)
- [ ] Platform stats query fonctionne

---

## Phase 6 (Future) — Custom Indexer avec PostgreSQL

> **Note** : Cette phase est pour la production / post-hackathon. Ne pas implémenter maintenant.
> Documentée ici pour référence future.

### Pourquoi un custom indexer ?

Le SUI GraphQL RPC est suffisant pour la plupart des cas, mais un custom indexer permet :

| Besoin | GraphQL RPC | Custom Indexer |
|---|---|---|
| Full-text search (nom creator) | Non | Oui (PostgreSQL `tsvector`) |
| Agrégations (top creators, stats) | Non | Oui (`COUNT`, `SUM`, `GROUP BY`) |
| Requêtes complexes (feed personnalisé) | Limité | Oui (SQL joins) |
| Données historiques (analytics) | Limité (pruning) | Oui (stockage illimité) |
| Latence | ~100-200ms | ~10-50ms (local) |
| Indépendance | Dépend de Mysten | Auto-hébergé |

### Architecture cible (production)

```
SUI Testnet/Mainnet
    │
    ▼ (checkpoints stream)
┌────────────────────────────┐
│ Custom Indexer (Rust)      │
│ sui-indexer-alt-framework  │
│                            │
│ Pipelines:                 │
│  - CreatorRegistered → DB  │
│  - PostPublished → DB      │
│  - SubscriptionPurchased   │
│  - CreatorDeleted → soft   │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ PostgreSQL                 │
│                            │
│ Tables:                    │
│  - creators                │
│  - posts                   │
│  - subscriptions           │
│  - events_log              │
│  - platform_stats          │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ GraphQL API (async-graphql)│
│ ou API REST (axum)         │
│                            │
│ Endpoints:                 │
│  - /graphql                │
│  - Queries typées          │
│  - Mutations (write-through│
│    to on-chain)            │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ Frontend Next.js           │
│ (inchangé sauf les URLs)   │
└────────────────────────────┘
```

### Stack recommandé

| Composant | Technologie |
|---|---|
| Indexer | Rust + `sui-indexer-alt-framework` |
| Database | PostgreSQL 16+ |
| ORM | Diesel (Rust) |
| API GraphQL | `async-graphql` (Rust) |
| Déploiement | Docker Compose |

### Schéma PostgreSQL préliminaire

```sql
CREATE TABLE creators (
    service_object_id TEXT PRIMARY KEY,
    creator_address TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    avatar_blob_id TEXT,
    suins_name TEXT UNIQUE,
    total_subscribers INTEGER NOT NULL DEFAULT 0,
    total_posts INTEGER NOT NULL DEFAULT 0,
    revenue_mist BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- soft delete
);

CREATE TABLE tiers (
    id SERIAL PRIMARY KEY,
    service_object_id TEXT NOT NULL REFERENCES creators(service_object_id),
    tier_level INTEGER NOT NULL,
    name TEXT NOT NULL,
    price_mist BIGINT NOT NULL,
    duration_ms BIGINT NOT NULL,
    UNIQUE(service_object_id, tier_level)
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    service_object_id TEXT NOT NULL REFERENCES creators(service_object_id),
    post_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    metadata_blob_id TEXT,
    data_blob_id TEXT,
    required_tier INTEGER NOT NULL DEFAULT 0,
    created_at_ms BIGINT NOT NULL,
    deleted_at TIMESTAMPTZ, -- soft delete
    UNIQUE(service_object_id, post_id)
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    subscriber_address TEXT NOT NULL,
    service_object_id TEXT NOT NULL REFERENCES creators(service_object_id),
    tier_level INTEGER NOT NULL,
    expires_at_ms BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(subscriber_address, service_object_id)
);

CREATE TABLE events_log (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    checkpoint BIGINT NOT NULL,
    tx_digest TEXT NOT NULL,
    data JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_creators_name ON creators USING gin(to_tsvector('english', name));
CREATE INDEX idx_posts_service ON posts(service_object_id);
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_address);
CREATE INDEX idx_events_type ON events_log(event_type);
```

### Prérequis pour le custom indexer

- Rust toolchain (1.75+)
- PostgreSQL 16+
- Diesel CLI : `cargo install diesel_cli --no-default-features --features postgres`
- ~4GB RAM, ~50GB SSD (pour commencer sur testnet)

### Checkpoint store URLs

- **Testnet** : `https://checkpoints.testnet.sui.io`
- **Mainnet** : `https://checkpoints.mainnet.sui.io`

---

## Checklist finale

### Phase 0 — Setup ✅
- [ ] Constante `SUI_GRAPHQL_URL` ajoutée
- [ ] Client GraphQL singleton créé
- [ ] Connexion testée (`chainIdentifier`)

### Phase 1 — Queries Creators ✅
- [ ] Fragment Service créé
- [ ] 4 queries creators écrites
- [ ] Parsers GraphQL → types app créés

### Phase 2 — Queries Posts ✅
- [ ] Query Service object (pour posts)
- [ ] Query PostPublished events

### Phase 3 — Queries Subscriptions ✅
- [ ] Query SubscriptionPurchased/Renewed events
- [ ] Query subscription status (dynamic field)
- [ ] Query batch objects

### Phase 4 — Migration Hooks ✅
- [ ] `useAllCreators` migré
- [ ] `useCreator` migré
- [ ] `useCreatorPosts` migré
- [ ] `useMySubscriptions` migré
- [ ] `service-lookup.ts` supprimé

### Phase 5 — Optimisations ✅
- [ ] React Query intégré
- [ ] Pagination infinie
- [ ] Platform stats query

### Phase 6 — Custom Indexer (futur) ⏳
- [ ] Rust indexer scaffold
- [ ] PostgreSQL schema
- [ ] GraphQL API custom

---

## Rappels importants

1. **JSON-RPC est deprecated** — deadline avril 2026 pour migrer vers GraphQL ou gRPC
2. **L'endpoint testnet est** : `https://graphql.testnet.sui.io/graphql`
3. **Le package `@mysten/sui` contient déjà** le `SuiGraphQLClient` — pas de dépendance à ajouter
4. **`gql.tada`** fournit le typage automatique des queries — utiliser `graphql()` de `@mysten/sui/graphql/schemas/latest`
5. **Les queries GraphQL retournent `contents.json`** — c'est un JSON non typé, d'où les parsers custom
6. **Les Service objects supprimés n'apparaissent pas** dans `objects(filter: { type })` — plus besoin de filtrer les CreatorDeleted events
7. **La pagination est native** — utiliser `first`/`after` avec les curseurs

---

## Liens utiles

| Resource | URL |
|---|---|
| SUI GraphQL RPC Docs | https://docs.sui.io/guides/developer/getting-started/graphql-rpc |
| SUI GraphQL Schema Reference | https://docs.sui.io/references/sui-api/sui-graphql/beta/reference |
| SUI TypeScript SDK — GraphQL | https://sdk.mystenlabs.com/typescript/graphql |
| EventFilter Reference | https://docs.sui.io/references/sui-api/sui-graphql/reference/types/inputs/event-filter |
| Custom Indexer Framework | https://docs.sui.io/guides/developer/accessing-data/custom-indexer/build |
| GraphQL Playground (Testnet) | https://graphql.testnet.sui.io/graphql |
