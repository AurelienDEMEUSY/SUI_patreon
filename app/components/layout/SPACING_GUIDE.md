# 📏 Quick Spacing Guide — Copy-Paste Ready

## Standard Page Template

```tsx
import { PageContainer } from '@/components/layout';

export default function YourPage() {
  return (
    <PageContainer>
      {/* Your content here — spacing is automatic */}
    </PageContainer>
  );
}
```

---

## Spacing Scale (à utiliser systématiquement)

```
2  = 8px   — Micro spacing (labels, badges)
4  = 16px  — Small spacing (form fields, buttons)
6  = 24px  — Medium spacing (sections, cards)
8  = 32px  — Large spacing (major sections)
12 = 48px  — XL spacing (page sections)
16 = 64px  — XXL spacing (hero sections)
```

---

## Common Patterns

### Sections verticales

```tsx
<PageContainer>
  <div className="space-y-8">
    <Section1 />
    <Section2 />
    <Section3 />
  </div>
</PageContainer>
```

### Grid de cards

```tsx
<PageContainer>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card />
    <Card />
    <Card />
  </div>
</PageContainer>
```

### Layout 2 colonnes (main + sidebar)

```tsx
<PageContainer>
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
    <MainContent />
    <Sidebar />
  </div>
</PageContainer>
```

### Hero Section + Content

```tsx
<PageContainer>
  <section className="mb-12">
    <HeroContent />
  </section>

  <div className="space-y-8">
    <ContentSection1 />
    <ContentSection2 />
  </div>
</PageContainer>
```

### Form Layout

```tsx
<PageContainer maxWidth="max-w-4xl">
  <form className="space-y-6">
    <FormField />
    <FormField />
    <FormField />

    <div className="flex gap-4 pt-4">
      <Button>Cancel</Button>
      <Button>Submit</Button>
    </div>
  </form>
</PageContainer>
```

---

## Loading States

```tsx
<PageContainer>
  <div className="flex items-center justify-center min-h-[50vh]">
    <Spinner />
  </div>
</PageContainer>
```

---

## Empty States

```tsx
<PageContainer>
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
    <Icon />
    <h2>No content found</h2>
    <p>Description text</p>
    <Button>Call to action</Button>
  </div>
</PageContainer>
```

---

## Error States

```tsx
<PageContainer>
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
    <span className="material-symbols-outlined text-4xl text-red-500 mb-4">error</span>
    <h1 className="text-xl font-bold text-white mb-2">Error Title</h1>
    <p className="text-gray-400">Error description</p>
  </div>
</PageContainer>
```

---

## 🎯 Quick Decision Tree

**Question: Quelle largeur utiliser ?**

- Formulaire simple → `max-w-4xl`
- Page de contenu texte → `max-w-5xl`
- Profile avec sidebar → `max-w-6xl`
- **Default / Grid de cards** → `max-w-7xl` ✅
- Dashboard complexe → `max-w-full`

**Question: Quel spacing vertical ?**

- Entre major sections → `space-y-8` ou `space-y-12`
- Entre cards/items → `space-y-6`
- Entre form fields → `space-y-4`
- Entre labels et inputs → `space-y-2`

**Question: Quel gap pour grid ?**

- Grid de cards → `gap-6`
- Colonnes de layout → `gap-8`
- Buttons group → `gap-4`

---

## 🚀 Migration Checklist

Pour migrer une page existante :

1. ✅ Import `PageContainer`
2. ✅ Replace custom wrapper div avec `<PageContainer>`
3. ✅ Remove custom `max-w-*`, `mx-auto`, `px-*`, `pb-*`
4. ✅ Review spacing vertical → use `space-y-*`
5. ✅ Review grid gaps → use `gap-*`
6. ✅ Test responsive
