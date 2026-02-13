# Patreon Contract - Feature To-Do List

## Structures de données
- [x] `Platform` — Objet partagé global (registre des créateurs, config plateforme)
- [x] `CreatorAccount` — Objet possédé par le créateur (profil, prix abo, stats)
- [x] `Subscription` — Objet possédé par l'abonné (preuve d'abonnement actif à un créateur)
- [x] `Content` — Objet owned (metadata contenu, blob_id Walrus, public/privé)
- [x] `AdminCap` — Capability pattern pour l'administration de la plateforme

## Événements
- [x] `AccountCreated` — Émis à la création d'un compte créateur
- [x] `SubscriptionCreated` — Émis quand un utilisateur s'abonne à un créateur
- [x] `ContentCreated` — Émis quand un créateur publie du contenu

## Gestion des comptes créateurs
- [x] `create_creator_account` — Créer un profil créateur (nom, description, prix d'abonnement)
- [x] `update_creator_profile` — Modifier nom, description, prix

## Système d'abonnement
- [x] `subscribe` — S'abonner à un créateur (paiement en SUI)
- [x] `renew_subscription` — Renouveler un abonnement expiré
- [x] `is_subscription_active` — Vérifier si un abonnement est encore valide
- [x] Logique de durée d'abonnement (timestamp-based, 30 jours)

## Gestion du contenu
- [x] `create_content` — Publier du contenu (titre, description, blob_id Walrus, public/privé)
- [x] `update_content` — Modifier les métadonnées d'un contenu
- [x] `delete_content` — Supprimer un contenu
- [x] `set_content_visibility` — Changer la visibilité (public ↔ privé)

## Accès au contenu
- [x] `assert_content_access` — Vérifier qu'un utilisateur a le droit d'accéder (public ou abonné actif)

## Registre & découverte (lien avec Suins)
- [ ] Intégration SuiNS (à implémenter correctement plus tard)
- [ ] `find_creator_by_suins` — Rechercher un créateur via son Suins name

## Paiements & économie
- [x] Transfert du paiement d'abonnement au créateur
- [ ] (Optionnel) Commission plateforme sur les abonnements
- [ ] (Optionnel) Retrait des fonds par le créateur (`withdraw`)

## Administration
- [x] Création du `Platform` shared object à l'`init`
- [ ] (Optionnel) Fonctions admin pour la gestion de la plateforme

## View Functions
- [x] Getters pour `CreatorAccount` (name, description, price, subscribers, balance, content_count)
- [x] Getters pour `Subscription` (expires_at, creator)
- [x] Getters pour `Content` (title, description, blob_id, is_public)
- [x] Getters pour `Platform` (total_creators)

## Tests
- [x] Test création de compte créateur
- [x] Test souscription et paiement
- [x] Test renouvellement d'abonnement
- [x] Test création/modification/suppression de contenu
- [x] Test accès au contenu (public vs privé)
- [x] Test E2E flow complet
- [ ] Test registre Suins (à faire après intégration SuiNS)
