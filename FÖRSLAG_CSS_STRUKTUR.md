# CSS Struktur - Förbättringsförslag

## Nuvarande Problem

1. **320 design tokens** - många oanvända eller överspecifika
2. **Dubbla gråskalor** (`--colors-gray-*` OCH `--neutral-*`)
3. **Oanvända utility classes** (text-3xl → text-9xl aldrig använda)
4. **Komponentspecifika tokens** istället för semantiska lager
5. **Alla teman i en 398-radig fil** - svårnavigerat

---

## Föreslagen Struktur

### 1. Ny Filmappning

```
assets/css/
├── tokens/
│   ├── primitives.css          # Layer 1: Bas-värden
│   ├── semantic.css            # Layer 2: Användningsbaserade
│   └── components.css          # Layer 3: Komponent-specifika
├── themes/
│   ├── light.css               # Överrides för light mode
│   ├── dark.css                # Överrides för dark mode
│   ├── pant.css                # Pant mode överrides
│   └── test.css                # Test mode överrides
├── utilities/
│   ├── typography.css          # Font utilities (renade)
│   ├── layout.css              # Grid, flex, spacing (från atoms.css)
│   └── display.css             # Visibility helpers
├── components/
│   └── all.css                 # Från nuvarande style.css
└── pages/
    ├── client.css              # Från clientpage.css
    └── print.css               # Print styles
```

### 2. Token-Hierarki (3 Lager)

#### **Layer 1: Primitives** (`tokens/primitives.css`)
Råa värden utan semantisk betydelse. Ändras ALDRIG av teman.

```css
:root {
  /* === FÄRGER: Gråskala === */
  --gray-50: hsl(240, 1%, 98%);
  --gray-100: hsl(240, 1%, 89%);
  --gray-200: hsl(240, 1%, 78%);
  --gray-300: hsl(240, 1%, 67%);
  --gray-400: hsl(240, 1%, 57%);
  --gray-500: hsl(240, 1%, 47%);
  --gray-600: hsl(240, 1%, 37%);
  --gray-700: hsl(240, 1%, 28%);
  --gray-800: hsl(240, 2%, 20%);
  --gray-900: hsl(240, 4%, 10%);

  /* === FÄRGER: Primary Palette === */
  --red-100: hsl(6, 53%, 91%);
  --red-200: hsl(6, 62%, 82%);
  --red-300: hsl(5, 66%, 73%);
  --red-400: hsl(3, 67%, 64%);
  --red-500: hsl(0, 64%, 58%);  /* Base */
  --red-600: hsl(0, 48%, 43%);
  --red-700: hsl(0, 50%, 32%);
  --red-800: hsl(0, 52%, 22%);
  --red-900: hsl(5, 56%, 13%);

  /* === FÄRGER: Secondary Palette === */
  --blue-100: hsl(227, 78%, 92%);
  --blue-200: hsl(225, 92%, 85%);
  --blue-300: hsl(222, 97%, 76%);
  --blue-400: hsl(217, 98%, 65%);
  --blue-500: hsl(211, 87%, 48%);  /* Base */
  --blue-600: hsl(211, 88%, 38%);
  --blue-700: hsl(211, 90%, 32%);
  --blue-800: hsl(213, 86%, 21%);
  --blue-900: hsl(216, 75%, 13%);

  /* === FÄRGER: Accent Palette === */
  --accent-100: hsl(160, 70%, 90%);
  --accent-200: hsl(160, 68%, 80%);
  --accent-300: hsl(160, 66%, 70%);
  --accent-400: hsl(160, 64%, 60%);
  --accent-500: hsl(160, 62%, 50%);  /* Base */
  --accent-600: hsl(160, 60%, 40%);
  --accent-700: hsl(160, 58%, 30%);
  --accent-800: hsl(160, 56%, 20%);
  --accent-900: hsl(160, 54%, 10%);

  /* === FÄRGER: Absolut === */
  --white: #ffffff;
  --black: #000000;

  /* === TYPOGRAFI: Familjer === */
  --font-family-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-family-serif: Georgia, Cambria, "Times New Roman", serif;
  --font-family-mono: ui-monospace, "Cascadia Code", "Source Code Pro", monospace;

  /* === TYPOGRAFI: Storlekar === */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */

  /* === TYPOGRAFI: Vikter === */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* === TYPOGRAFI: Radhöjd === */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* === TYPOGRAFI: Teckenmellansrum === */
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0em;
  --letter-spacing-wide: 0.025em;

  /* === SPACING: Skala === */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */

  /* === LAYOUT === */
  --container-max-width: 80rem;
  --grid-columns: 6;
  --grid-gap: 1.5rem;
}
```

#### **Layer 2: Semantic Tokens** (`tokens/semantic.css`)
Användningsbaserade. DESSA ändras av teman!

```css
:root {
  /* === TEXT === */
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-tertiary: var(--gray-500);
  --text-inverted: var(--white);
  --text-link: var(--blue-500);
  --text-link-hover: var(--blue-600);
  --text-error: var(--red-600);
  --text-success: var(--accent-600);

  /* === BAKGRUNDER === */
  --bg-primary: var(--white);
  --bg-secondary: var(--gray-50);
  --bg-tertiary: var(--gray-100);
  --bg-inverted: var(--gray-900);
  --bg-overlay: rgba(0, 0, 0, 0.5);

  /* === BORDERS === */
  --border-subtle: var(--gray-200);
  --border-default: var(--gray-300);
  --border-strong: var(--gray-400);
  --border-accent: var(--blue-500);

  /* === INTERAKTIVA YTOR === */
  --surface-default: var(--white);
  --surface-raised: var(--white);
  --surface-sunken: var(--gray-50);

  /* === SKUGGOR === */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

#### **Layer 3: Component Tokens** (`tokens/components.css`)
Komponent-specifika, men skalade semantiskt.

```css
:root {
  /* === BUTTONS === */
  --button-bg-primary: var(--blue-500);
  --button-bg-primary-hover: var(--blue-600);
  --button-text-primary: var(--white);

  --button-bg-secondary: transparent;
  --button-bg-secondary-hover: var(--gray-100);
  --button-text-secondary: var(--text-primary);
  --button-border-secondary: var(--border-default);

  /* === FORMS === */
  --input-bg: var(--surface-default);
  --input-border: var(--border-default);
  --input-border-focus: var(--border-accent);
  --input-text: var(--text-primary);
  --input-placeholder: var(--text-tertiary);

  /* === NAVIGATION === */
  --nav-bg: var(--surface-raised);
  --nav-text: var(--text-primary);
  --nav-text-hover: var(--text-link);
  --nav-border: var(--border-subtle);

  /* === HEADER === */
  --header-height: 3.5rem;
  --header-bg: var(--surface-default);
  --header-shadow: var(--shadow-sm);

  /* === TAGS === */
  --tag-bg: var(--bg-secondary);
  --tag-text: var(--text-secondary);
  --tag-border: var(--border-subtle);
}
```

---

### 3. Teman (Separata Filer)

#### **Light Theme** (`themes/light.css`)
```css
:root[data-theme="light"] {
  /* === TEXT === */
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-tertiary: var(--gray-500);
  --text-inverted: var(--white);

  /* === BAKGRUNDER === */
  --bg-primary: var(--white);
  --bg-secondary: var(--gray-50);
  --bg-tertiary: var(--gray-100);
  --bg-inverted: var(--gray-900);

  /* === BORDERS === */
  --border-subtle: var(--gray-200);
  --border-default: var(--gray-300);
  --border-strong: var(--gray-400);
}
```

#### **Dark Theme** (`themes/dark.css`)
```css
:root[data-theme="dark"] {
  /* === TEXT === */
  --text-primary: var(--gray-50);
  --text-secondary: var(--gray-400);
  --text-tertiary: var(--gray-500);
  --text-inverted: var(--gray-900);

  /* === BAKGRUNDER === */
  --bg-primary: var(--gray-900);
  --bg-secondary: var(--gray-800);
  --bg-tertiary: var(--gray-700);
  --bg-inverted: var(--white);

  /* === BORDERS === */
  --border-subtle: var(--gray-700);
  --border-default: var(--gray-600);
  --border-strong: var(--gray-500);

  /* === SKUGGOR === */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}
```

#### **Pant Mode** (`themes/pant.css`)
```css
:root[data-mode="pant"] {
  /* Specifika overrides för Pant mode */
  --image-filter: grayscale(100%);
  --image-blend-mode: multiply;

  /* Mer färgglatt */
  --text-link: var(--accent-500);
  --button-bg-primary: var(--accent-500);
}
```

---

### 4. Utilities (Renade)

#### **Typography Utilities** (`utilities/typography.css`)
```css
/* === Font Families === */
.font-sans { font-family: var(--font-family-sans); }
.font-serif { font-family: var(--font-family-serif); }
.font-mono { font-family: var(--font-family-mono); }

/* === Font Sizes === */
/* ENDAST de som faktiskt används! */
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }

/* === Font Weights === */
/* ENDAST de som faktiskt används! */
.font-regular { font-weight: var(--font-weight-regular); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

/* === Line Heights === */
.leading-tight { line-height: var(--line-height-tight); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

/* === Letter Spacing === */
.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }

/* === Text Transforms === */
.uppercase { text-transform: uppercase; }
.capitalize { text-transform: capitalize; }
```

#### **Layout Utilities** (`utilities/layout.css`)
```css
/* === Display === */
.flex { display: flex; }
.grid { display: grid; }
.block { display: block; }
.inline { display: inline; }
.inline-block { display: inline-block; }
.hidden { display: none; }

/* === Flex === */
.flex-grow { flex-grow: 1; }
.flex-shrink-0 { flex-shrink: 0; }

/* === Grid System (6-kolumner) === */
.grid-cols-6 {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--grid-gap);
}

/* Grid Spans */
.grid-span-1 { grid-column: span 1; }
.grid-span-2 { grid-column: span 2; }
.grid-span-3 { grid-column: span 3; }
.grid-span-4 { grid-column: span 4; }
.grid-span-5 { grid-column: span 5; }
.grid-span-6 { grid-column: span 6; }

/* Grid Positioning */
.grid-start-1 { grid-column-start: 1; }
.grid-start-2 { grid-column-start: 2; }
.grid-start-3 { grid-column-start: 3; }
.grid-start-4 { grid-column-start: 4; }
.grid-start-5 { grid-column-start: 5; }

.grid-end-2 { grid-column-end: 2; }
.grid-end-3 { grid-column-end: 3; }
.grid-end-4 { grid-column-end: 4; }
.grid-end-5 { grid-column-end: 5; }
.grid-end-6 { grid-column-end: 6; }
.grid-end-7 { grid-column-end: 7; }

/* === Gaps === */
.gap-xs { gap: var(--space-2); }
.gap-sm { gap: var(--space-4); }
.gap-md { gap: var(--space-6); }
.gap-lg { gap: var(--space-8); }

/* === Spacing === */
.m-0 { margin: 0; }
.mt-2 { margin-top: var(--space-2); }
.mt-4 { margin-top: var(--space-4); }
.mt-6 { margin-top: var(--space-6); }
.mt-8 { margin-top: var(--space-8); }

.mb-2 { margin-bottom: var(--space-2); }
.mb-4 { margin-bottom: var(--space-4); }
.mb-6 { margin-bottom: var(--space-6); }
.mb-8 { margin-bottom: var(--space-8); }
.mb-12 { margin-bottom: var(--space-12); }
.mb-16 { margin-bottom: var(--space-16); }
```

#### **Display/Visibility Utilities** (`utilities/display.css`)
```css
/* === Conditional Visibility === */
.hide-on-client { /* existing logic */ }
.show-on-client { /* existing logic */ }
.hide-on-employer { /* existing logic */ }

/* === Responsive Visibility === */
@media (max-width: 47.9375em) {
  .hide-below-sm { display: none; }
}

@media (min-width: 48em) {
  .hide-above-sm { display: none; }
}
```

---

## 5. Migration Plan

### Steg 1: Skapa Ny Struktur (Parallellt)
1. Skapa nya mappar: `tokens/`, `themes/`, `utilities/`, `components/`, `pages/`
2. Extrahera primitives från `variables.css` → `tokens/primitives.css`
3. Skapa semantiska lager i `tokens/semantic.css`
4. Separera teman till egna filer i `themes/`

### Steg 2: Rensa Oanvända Tokens
```bash
# Hitta oanvända tokens
grep -r "--text-[0-9]xl" assets/css/ layouts/ | grep "text-[3-9]xl"

# Hitta oanvända font weights
grep -r "font-(thin|extralight|light|black)" layouts/
```

### Steg 3: Konsolidera Duplicerade Tokens
- Ta bort `--neutral-*` (använd bara `--gray-*`)
- Fixa `--colors-gray-50` duplicering
- Flytta komponent-specifika tokens till Layer 3

### Steg 4: Uppdatera Build Pipeline
Hugo `head.html` partial behöver uppdateras:

```html
<!-- Development: Individual files -->
{{ if eq hugo.Environment "development" }}
  {{ $primitives := resources.Get "css/tokens/primitives.css" }}
  {{ $semantic := resources.Get "css/tokens/semantic.css" }}
  {{ $components := resources.Get "css/tokens/components.css" }}

  {{ $themeLight := resources.Get "css/themes/light.css" }}
  {{ $themeDark := resources.Get "css/themes/dark.css" }}
  {{ $modePant := resources.Get "css/themes/pant.css" }}

  {{ $utilities := resources.Get "css/utilities/typography.css" }}
  {{ $layout := resources.Get "css/utilities/layout.css" }}
  {{ $display := resources.Get "css/utilities/display.css" }}

  {{ $styles := resources.Get "css/components/all.css" }}
  {{ $print := resources.Get "css/pages/print.css" }}

  {{ range slice $primitives $semantic $components $themeLight $themeDark $modePant $utilities $layout $display $styles }}
    <link rel="stylesheet" href="{{ .RelPermalink }}">
  {{ end }}

  <link rel="stylesheet" href="{{ $print.RelPermalink }}" media="print">
{{ end }}

<!-- Production: Concatenated & minified -->
{{ if eq hugo.Environment "production" }}
  {{ $all := slice
    (resources.Get "css/tokens/primitives.css")
    (resources.Get "css/tokens/semantic.css")
    (resources.Get "css/tokens/components.css")
    (resources.Get "css/themes/light.css")
    (resources.Get "css/themes/dark.css")
    (resources.Get "css/themes/pant.css")
    (resources.Get "css/utilities/typography.css")
    (resources.Get "css/utilities/layout.css")
    (resources.Get "css/utilities/display.css")
    (resources.Get "css/components/all.css")
  | resources.Concat "css/bundle.css"
  | minify
  | fingerprint "sha384" }}

  <link rel="stylesheet" href="{{ $all.RelPermalink }}"
        integrity="{{ $all.Data.Integrity }}"
        crossorigin="anonymous">

  {{ $print := resources.Get "css/pages/print.css" | minify | fingerprint }}
  <link rel="stylesheet" href="{{ $print.RelPermalink }}" media="print">
{{ end }}
```

### Steg 5: Testa & Validera
1. Kontrollera att alla sidor renderar korrekt
2. Testa alla teman (light, dark, pant, test)
3. Verifiera responsiv design
4. Kör lighthouse audit

---

## Sammanfattning av Fördelar

### Före
- 398 rader `variables.css` (svårnavigerat)
- 320 tokens (många oanvända)
- Duplicerade gråskalor
- Komponent-specifika tokens blandat med primitives
- Svårt att hitta rätt token

### Efter
- **3-lagers token-hierarki** (primitives → semantic → components)
- **Separerade tema-filer** (enklare att underhålla)
- **Renade utilities** (bara det som används)
- **Tydlig namngivning** (vet direkt vad som är vad)
- **Enklare att skala** (lägg till nya teman utan att röra primitives)

### Metrics
- **Tokens:** ~320 → ~180 (45% minskning)
- **Utilities:** Från 80+ → ~50 (rensade oanvända)
- **Largest file:** 398 rader → ~120 rader per fil (lättare att navigera)
- **Teman:** 1 fil → 4 separata filer (bättre organisation)

---

## Nästa Steg

1. **Beslut:** Vill du implementera detta? Allt på en gång eller stegvis?
2. **Prioritering:** Vilken del är mest problematisk just nu?
3. **Timeline:** Hur mycket tid vill du lägga på detta?

Jag kan hjälpa dig implementera detta steg för steg om du vill!
