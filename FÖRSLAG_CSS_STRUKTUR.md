# CSS Struktur - Förbättringsförslag (Uppdaterad plan)

## Nuvarande Problem

1. **Flera källor till sanning** (semantic dokumenteras i `tokens/semantic.css` men definieras i `dimensions/common.css`)
2. **Krockande namnstandarder** (`--text-primary` vs `--text-color*`, `--bg-menu` vs `--background-color-menu`)
3. **Legacy + nya tokens parallellt** (`--danger-*`, `--error-*`, `--color-error-*`)
4. **Överlappande komponenttokens** (form/newsletter i både `dimensions/common.css` och `tokens/components.css`)
5. **Oklara overrides** (mode/palette skriver över olika namn)

---

## Föreslagen Struktur

### 1. Ny Filmappning (platt, tydlig, skalbar)

```
assets/css/
├── tokens/
│   ├── primitives.css          # Layer 1: Raw values (color, type, spacing)
│   ├── semantic.css            # Layer 2: Canonical semantic tokens
│   ├── components.css          # Layer 3: Component exceptions
│   └── legacy.css              # Legacy aliases (old names map to new)
├── theme/
│   ├── mode.light.css          # Mode overrides (light)
│   ├── mode.dark.css           # Mode overrides (dark)
│   ├── palette.standard.css    # Palette overrides (standard)
│   └── palette.pantone.css     # Palette overrides (pantone)
├── utilities/
│   ├── typography.css          # Font utilities (rensade)
│   ├── layout.css              # Grid, flex, spacing
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
  --font-family-sans: neue-haas-grotesk-text, ui-sans-serif, system-ui, sans-serif;
  --font-family-serif: freight-text-pro, ui-serif, Georgia, Cambria, "Times New Roman", serif;
  --font-family-mono: ui-monospace, "Courier New", Menlo, Monaco, Consolas, monospace;

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
Användningsbaserade. Dessa är de CANONICAL tokens som alla komponenter ska använda.

```css
:root {
  /* === TEXT === */
  --text-default: var(--gray-12);
  --text-muted: var(--gray-9);
  --text-inverse: var(--white);
  --text-nav: var(--brand-on-primary);
  --text-link: var(--iris-11);
  --text-link-hover: var(--iris-12);
  --text-accent: var(--iris-11);

  /* === BACKGROUND / SURFACE === */
  --bg-page: var(--white);
  --bg-surface: var(--gray-2);
  --bg-elevated: var(--gray-1);
  --bg-inverse: var(--gray-12);
  --bg-nav: var(--brand-primary);
  --bg-tag: var(--iris-3);
  --bg-tag-hover: var(--iris-4);
  --bg-section-headline: var(--iris-9);

  /* === BORDER / OUTLINE === */
  --border-subtle: var(--gray-4);
  --border-default: var(--gray-6);
  --border-strong: var(--gray-8);
  --outline-neutral: rgba(0, 0, 0, 0.08);

  /* === STATE (OVERLAYS) === */
  --state-on-light-hover: rgba(0, 0, 0, 0.04);
  --state-on-light-active: rgba(0, 0, 0, 0.08);
  --state-on-dark-hover: rgba(255, 255, 255, 0.04);
  --state-on-dark-active: rgba(255, 255, 255, 0.08);
  --state-focus: var(--iris-9);
  --text-disabled: var(--gray-7);
  --bg-disabled: var(--gray-3);
  --border-disabled: var(--gray-4);

  /* === STATUS === */
  --status-error-bg: var(--red-2);
  --status-error-border: var(--red-8);
  --status-error-text: var(--red-11);
  --status-error-icon: var(--status-error-text);

  --status-success-bg: var(--green-2);
  --status-success-border: var(--green-8);
  --status-success-text: var(--green-11);
  --status-success-icon: var(--status-success-text);

  --status-warning-bg: var(--amber-2);
  --status-warning-border: var(--amber-8);
  --status-warning-text: var(--amber-11);
  --status-warning-icon: var(--status-warning-text);

  --status-info-bg: var(--blue-2);
  --status-info-border: var(--blue-8);
  --status-info-text: var(--blue-11);
  --status-info-icon: var(--status-info-text);

  /* === BRAND === */
  --brand-primary: var(--iris-9);
  --brand-on-primary: var(--white);
  --brand-container: var(--iris-3);
  --brand-on-container: var(--iris-11);

  /* === IMAGE === */
  --image-background: var(--iris-12);
  --image-grayscale: 0%;
  --image-blend-mode: normal;

  /* === SHADOWS === */
  --shadow-01: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px,
    rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
}
```

#### **Layer 3: Component Tokens** (`tokens/components.css`)
Komponent-specifika, men fortfarande semantiska i sin form.

```css
:root {
  /* === FORMS === */
  --component-form-bg: var(--bg-surface);
  --component-form-border: transparent;
  --component-form-placeholder: var(--text-muted);

  /* === NEWSLETTER === */
  --component-newsletter-bg: var(--iris-12);
  --component-newsletter-text: var(--iris-2);
  --component-newsletter-illustration-bg: var(--iris-3);
  --component-newsletter-button-bg: var(--iris-4);
  --component-newsletter-button-text: var(--iris-11);

  /* === SIZE === */
  --size-header-height: 4.5rem;
  --size-page-margins: clamp(1.5rem, 1.3261rem + 0.8696vi, 2rem);
  --size-menu-width-xl: 24rem;
  --size-menu-width-lg: 20rem;
  --size-menu-width-md: 16rem;
}
```

---

### 3. Teman (Separata Filer)

#### **Mode: Light** (`theme/mode.light.css`)
```css
:root[data-mode="light"] {
  /* === TEXT === */
  --text-default: var(--gray-12);
  --text-muted: var(--gray-9);
  --text-inverse: var(--white);

  /* === BACKGROUND === */
  --bg-page: var(--white);
  --bg-surface: var(--gray-2);
  --bg-elevated: var(--gray-1);
  --bg-inverse: var(--gray-12);

  /* === BORDERS === */
  --border-subtle: var(--gray-4);
  --border-default: var(--gray-6);
  --border-strong: var(--gray-8);

  /* === IMAGE === */
  --image-grayscale: 0%;
  --image-blend-mode: normal;
}
```

#### **Mode: Dark** (`theme/mode.dark.css`)
```css
:root[data-mode="dark"] {
  /* === TEXT === */
  --text-default: var(--gray-12);
  --text-muted: var(--gray-9);
  --text-inverse: var(--gray-1);

  /* === BACKGROUND === */
  --bg-page: var(--gray-1);
  --bg-surface: var(--gray-2);
  --bg-elevated: var(--gray-3);
  --bg-inverse: var(--white);

  /* === BORDERS === */
  --border-subtle: var(--gray-4);
  --border-default: var(--gray-6);
  --border-strong: var(--gray-8);

  /* === IMAGE === */
  --image-grayscale: 0%;
  --image-blend-mode: normal;
}
```

#### **Palette: Pantone** (`theme/palette.pantone.css`)
```css
:root[data-palette="pantone"] {
  /* Specifika overrides för Pantone */
  --image-grayscale: 100%;
  --image-blend-mode: screen;
  --bg-page: var(--iris-2);
  --text-default: var(--iris-12);
  --text-muted: var(--iris-10);
  --text-link: var(--iris-11);
  --bg-tag: var(--iris-4);
  --bg-tag-hover: var(--iris-5);
  --border-subtle: var(--iris-5);
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

## 5. Prioriterad Plan (stegordning)

1. **Frys canonical tokenlista**: Bestam exakt naming och vilka semantic tokens som ska finnas.
2. **Skapa legacy-aliaser**: Ny fil `tokens/legacy.css` som mappar gamla namn till nya.
3. **Flytta semantiska values**: Allt in i `tokens/semantic.css`, mode/palette overrides bara overridar.
4. **Migrera användning**: Uppdatera CSS att anvanda nya tokens (en modul i taget).
5. **Stada utilities**: Ta bort oanvanda klasser/tokens.
6. **Ta bort legacy**: Nar allt ar migrerat.

### Steg 1: Skapa Ny Struktur (Parallellt)
1. Skapa nya mappar: `tokens/`, `theme/`, `utilities/`, `components/`, `pages/`
2. Flytta semantiska values från `dimensions/common.css` till `tokens/semantic.css`
3. Skapa `tokens/legacy.css` med alias (old -> new)
4. Dela upp mode/palette i `theme/`

### Steg 2: Rensa Oanvända Tokens
```bash
# Hitta oanvända tokens
grep -r "--text-[0-9]xl" assets/css/ layouts/ | grep "text-[3-9]xl"

# Hitta oanvända font weights
grep -r "font-(thin|extralight|light|black)" layouts/
```

### Steg 3: Konsolidera Duplicerade Tokens
- Bestam en canonical variant for text och background tokens
- Sammanfoga error/danger tokens till `--status-error*`
- Flytta layoutvariabler ur `assets/css/style.css` till `tokens/components.css`

### Steg 4: Uppdatera Build Pipeline
Hugo `head.html` partial behöver uppdateras:

```html
<!-- Development: Individual files -->
{{ if eq hugo.Environment "development" }}
  {{ $primitives := resources.Get "css/tokens/primitives.css" }}
  {{ $semantic := resources.Get "css/tokens/semantic.css" }}
  {{ $components := resources.Get "css/tokens/components.css" }}

  {{ $themeLight := resources.Get "css/theme/mode.light.css" }}
  {{ $themeDark := resources.Get "css/theme/mode.dark.css" }}
  {{ $paletteStandard := resources.Get "css/theme/palette.standard.css" }}
  {{ $palettePantone := resources.Get "css/theme/palette.pantone.css" }}

  {{ $utilities := resources.Get "css/utilities/typography.css" }}
  {{ $layout := resources.Get "css/utilities/layout.css" }}
  {{ $display := resources.Get "css/utilities/display.css" }}

  {{ $styles := resources.Get "css/components/all.css" }}
  {{ $print := resources.Get "css/pages/print.css" }}

  {{ range slice $primitives $semantic $components $themeLight $themeDark $paletteStandard $palettePantone $utilities $layout $display $styles }}
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
    (resources.Get "css/theme/mode.light.css")
    (resources.Get "css/theme/mode.dark.css")
    (resources.Get "css/theme/palette.standard.css")
    (resources.Get "css/theme/palette.pantone.css")
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

### Fore
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

## Nasta Steg

1. **Godkann naming**: Ska vi anvanda `--text-default` etc som canonical?
2. **Validera aliaslista**: Lagga till alla viktiga legacy-namn.
3. **Starta migrering**: Jag kan borja med form/newsletter och menu.
