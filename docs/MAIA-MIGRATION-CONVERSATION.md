# Maia Design System Migration

## Overview

This document captures the migration from the original shadcn/ui setup to the **Maia style system**.

## What Changed

### Before (Original)
- **Font**: Plus Jakarta Sans Variable
- **Icons**: Lucide React
- **Colors**: HSL/hex with `#00cccc` accent
- **Components**: Radix UI primitives
- **Button pattern**: `<Button asChild><Link>...</Link></Button>`

### After (Maia)
- **Font**: DM Sans Variable
- **Icons**: HugeIcons (`@hugeicons/react`, `@hugeicons/core-free-icons`)
- **Colors**: OKLCH format with `oklch(0.75 0.12 195)` primary
- **Components**: Base UI primitives
- **Button pattern**: `<Button render={<Link to="..." />}>...</Button>`

---

## Configuration Files

### components.json
```json
{
  "style": "base-maia",
  "iconLibrary": "hugeicons",
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true
  }
}
```

### src/styles.css (Key Variables)
```css
:root {
  --primary: oklch(0.75 0.12 195);  /* #00cccc cyan */
  --primary-foreground: oklch(0.145 0 0);
  --radius: 0.625rem;  /* Base radius */
  /* ... other OKLCH variables */
}

.dark {
  --primary: oklch(0.75 0.12 195);  /* Same cyan in dark mode */
  /* ... dark mode overrides */
}
```

---

## Component Patterns

### Button with Link
```tsx
// Use render prop (Base UI pattern)
<Button render={<Link to="/apply" />} size="lg">
  Apply To Work With Us
  <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2} data-icon="inline-end" />
</Button>

// DO NOT use asChild (Radix pattern - not supported)
// <Button asChild><Link>...</Link></Button>  // WRONG
```

### HugeIcons
```tsx
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

<HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2} />
```

### Card Component
```tsx
<Card className="group">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Icon Containers
```tsx
<div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10">
  <HugeiconsIcon icon={Brain01Icon} size={20} strokeWidth={1.5} className="text-primary" />
</div>
```

---

## Icon Mapping

| Lucide | HugeIcons |
|--------|-----------|
| ArrowRight | ArrowRight01Icon |
| ArrowLeft | ArrowLeft01Icon |
| ArrowDown | ArrowDown01Icon |
| Check | Tick02Icon |
| ChevronDown | ArrowDown01Icon |
| Menu | Menu01Icon |
| X | Cancel01Icon |
| Sun | Sun01Icon |
| Moon | Moon01Icon |
| Plus | PlusSignIcon |
| Search | Search01Icon |
| ExternalLink | LinkSquare01Icon |

---

## Border Radius Scale

| Class | Size | Usage |
|-------|------|-------|
| `rounded-4xl` | 32px | Buttons, inputs, badges |
| `rounded-2xl` | 24px | Cards, dropdowns |
| `rounded-xl` | 16px | Icon containers |
| `rounded-lg` | 10px | Nav items |

---

## Color Conventions

- **`primary`** = Brand/action color (cyan `#00cccc`)
- **`accent`** = Neutral gray for subtle backgrounds
- **`muted`** = Subdued backgrounds and text
- **`secondary`** = Alternative button style

---

## Files Modified

### Configuration
- `package.json` - Added HugeIcons, Base UI, DM Sans; removed Lucide
- `components.json` - Changed to base-maia style
- `src/styles.css` - OKLCH color system

### Components (16 total)
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/accordion.tsx`
- `src/components/ui/slider.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/field.tsx`
- `src/components/ui/input-group.tsx`
- `src/components/ui/combobox.tsx`

### Shared Components
- `src/components/Navigation.tsx` - HugeIcons, render prop
- `src/components/Footer.tsx` - render prop
- `src/components/ThemeToggle.tsx` - HugeIcons, Maia styling

### Pages Migrated
- `src/routes/index.tsx` - Full migration (reference implementation)

### Pages Pending Migration
- Service pages (seo.tsx, geo.tsx, pm.tsx)
- Resource pages (about.tsx, customers.tsx, case-studies.tsx, etc.)
- Solutions pages (12 files)
- BlogEditor.tsx
- NotFound.tsx

---

## Reference Implementation

The homepage (`src/routes/index.tsx`) serves as the reference implementation for the Maia design system. When migrating other pages, follow its patterns for:

- Section spacing (`py-16 lg:py-24`)
- Card usage and structure
- Button styling with icons
- Icon containers
- Typography scale
- Color usage

---

*Last updated: December 19, 2025*
