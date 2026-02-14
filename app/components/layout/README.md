# Layout System — DePatreon

## 📐 Architecture du Layout

Le système de layout est composé de **4 composants principaux** qui travaillent ensemble pour créer une expérience utilisateur cohérente :

```
┌─────────────────────────────────────────────────────────────┐
│                        AppShell                              │
│  ┌──────────┐  ┌───────────────────────────────────────┐   │
│  │          │  │           Main Content                 │   │
│  │ Sidebar  │  │  ┌─────────────────────────────────┐  │   │
│  │          │  │  │         Topbar                   │  │   │
│  │  - Nav   │  │  └─────────────────────────────────┘  │   │
│  │  - Logo  │  │  ┌─────────────────────────────────┐  │   │
│  │  - User  │  │  │      PageContainer              │  │   │
│  │          │  │  │  ┌───────────────────────────┐  │  │   │
│  │          │  │  │  │   Your Page Content       │  │  │   │
│  │          │  │  │  │   (Harmonized spacing)    │  │  │   │
│  │          │  │  │  └───────────────────────────┘  │  │   │
│  │          │  │  └─────────────────────────────────┘  │   │
│  └──────────┘  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Composants

### 1. **AppShell** — Container principal

**Fichier:** `AppShell/AppShell.tsx`

Le wrapper racine qui contient toute l'application authentifiée.

**Responsabilités:**
- Gestion des orbes de background (ambient design)
- Layout flex avec sidebar + main content
- Overflow handling
- Protection d'authentification (redirect si non connecté)

**Structure:**
```tsx
<div className="flex h-screen w-full p-6 gap-6 overflow-hidden">
  <Sidebar className="shrink-0" />
  <main className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
    <Topbar />
    {children}
  </main>
</div>
```

**Spacing:**
- `p-6` — Padding autour de tout le layout (24px)
- `gap-6` — Gap entre sidebar et main (24px)

---

### 2. **Sidebar** — Navigation latérale

**Fichier:** `Sidebar/Sidebar.tsx`

Navigation principale de l'application.

**Largeur:**
- Mobile/Tablet: `w-20` (80px) — Mode icônes seulement
- Desktop: `w-64` (256px) — Mode complet avec labels

**Caractéristiques:**
- Glassmorphism design (`glass-panel`)
- Navigation items avec badges optionnels
- User profile dropdown en bas
- Responsive collapse

---

### 3. **Topbar** — Barre supérieure

**Fichier:** `Topbar/Topbar.tsx`

Barre de recherche et notifications.

**Contenu:**
- Search bar (max-w-xl)
- Notifications button
- User actions

**Hauteur:** Auto (basée sur le padding du contenu)

---

### 4. **PageContainer** — Wrapper de contenu ✨ NOUVEAU

**Fichier:** `PageContainer/PageContainer.tsx`

**Le composant clé pour harmoniser toutes vos pages.**

#### Props

```typescript
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
  noPadding?: boolean;
  className?: string;
}
```

#### Largeurs disponibles

| `maxWidth` | Pixels | Usage recommandé |
|---|---|---|
| `max-w-4xl` | 896px | Pages simples, formulaires |
| `max-w-5xl` | 1024px | Pages de contenu texte |
| `max-w-6xl` | 1152px | Pages avec sidebar latérale |
| `max-w-7xl` | 1280px | **Default** — Pages riches, grids |
| `max-w-full` | 100% | Dashboards, tables larges |

#### Padding standard

**Horizontal (responsive):**
- Mobile: `px-4` (16px)
- Tablet: `px-6` (24px)
- Desktop: `px-8` (32px)

**Vertical:**
- Bottom: `pb-8` (32px) — Pour confort de scroll

#### Utilisation

```tsx
import { PageContainer } from '@/components/layout';

export default function MyPage() {
  return (
    <PageContainer>
      <h1>Mon contenu</h1>
      <p>Spacing harmonisé automatiquement</p>
    </PageContainer>
  );
}
```

#### Options avancées

```tsx
// Page étroite (formulaire)
<PageContainer maxWidth="max-w-4xl">
  <FormComponent />
</PageContainer>

// Page pleine largeur
<PageContainer maxWidth="max-w-full">
  <DashboardGrid />
</PageContainer>

// Pas de padding (contrôle manuel)
<PageContainer noPadding>
  <CustomLayoutWithOwnPadding />
</PageContainer>

// Classes Tailwind additionnelles
<PageContainer className="space-y-8">
  <Section1 />
  <Section2 />
</PageContainer>
```

---

## 📏 Système de Spacing — Standards

### Vertical Rhythm (espacement vertical)

Utilisez ces classes Tailwind pour un espacement vertical cohérent :

```tsx
// Entre sections majeures
<div className="space-y-8">  {/* 32px */}

// Entre éléments de section
<div className="space-y-6">  {/* 24px */}

// Entre petits éléments
<div className="space-y-4">  {/* 16px */}

// Entre éléments très proches
<div className="space-y-2">  {/* 8px */}
```

### Horizontal Spacing

```tsx
// Entre colonnes majeures
<div className="gap-8">      {/* 32px */}

// Entre cards dans une grille
<div className="gap-6">      {/* 24px */}

// Entre boutons
<div className="gap-4">      {/* 16px */}
```

---

## 🎨 Exemples de Pages

### Page simple (Creator Profile)

```tsx
import { PageContainer } from '@/components/layout';
import { CreatorHeader } from '@/components/creator/CreatorHeader';

export default function CreatorProfilePage() {
  return (
    <PageContainer>
      <CreatorHeader />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <MainContent />
        <Sidebar />
      </div>
    </PageContainer>
  );
}
```

### Page vide (placeholder)

```tsx
import { PageContainer } from '@/components/layout';

export default function EmptyPage() {
  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[50vh] text-white/30">
        No content yet
      </div>
    </PageContainer>
  );
}
```

### Dashboard pleine largeur

```tsx
import { PageContainer } from '@/components/layout';

export default function DashboardPage() {
  return (
    <PageContainer maxWidth="max-w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard />
        <StatsCard />
        <StatsCard />
        <StatsCard />
      </div>
    </PageContainer>
  );
}
```

---

## ✅ Checklist pour chaque nouvelle page

1. ✅ Wrap le contenu dans `<PageContainer>`
2. ✅ Choisir la bonne `maxWidth` selon le contenu
3. ✅ Utiliser `space-y-*` pour l'espacement vertical
4. ✅ Utiliser `gap-*` pour les grids et flex
5. ✅ Éviter les paddings custom (utiliser le système)
6. ✅ Tester responsive (mobile, tablet, desktop)

---

## 🚫 Anti-patterns à éviter

```tsx
// ❌ BAD — Padding custom
<div className="max-w-7xl mx-auto px-4 pb-20">
  <Content />
</div>

// ✅ GOOD — Utiliser PageContainer
<PageContainer>
  <Content />
</PageContainer>

// ❌ BAD — Largeur max custom
<div className="max-w-[1400px] mx-auto">
  <Content />
</div>

// ✅ GOOD — Utiliser les largeurs standards
<PageContainer maxWidth="max-w-7xl">
  <Content />
</PageContainer>

// ❌ BAD — Spacing incohérent
<div className="mb-7">
  <Section1 />
</div>
<div className="mb-5">
  <Section2 />
</div>

// ✅ GOOD — Spacing cohérent avec space-y
<div className="space-y-8">
  <Section1 />
  <Section2 />
</div>
```

---

## 📐 Breakpoints Tailwind (référence)

| Breakpoint | Min Width | Usage |
|---|---|---|
| `sm:` | 640px | Téléphones larges |
| `md:` | 768px | Tablettes |
| `lg:` | 1024px | Desktop petit |
| `xl:` | 1280px | Desktop standard |
| `2xl:` | 1536px | Desktop large |

---

## 🎯 Résumé

**Pour harmoniser toutes vos pages:**

1. Utilisez **toujours** `<PageContainer>` pour wrapper votre contenu
2. Choisissez la `maxWidth` appropriée (par défaut `max-w-7xl`)
3. Respectez le système de spacing (`space-y-*`, `gap-*`)
4. Testez la responsivité

**Résultat:** Toutes vos pages auront un espacement cohérent, professionnel, et responsive automatiquement. 🎉
