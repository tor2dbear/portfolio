# CSS Refactoring - Status & Sammanfattning

> Sammanfattning av genomförd CSS-omstrukturering för portfolio-projektet
> Branch: `claude/css-structure-review-TTMcH`
> Datum: 2026-01-05

---

## 🎯 Syfte

Omstrukturera CSS från en monolitisk struktur till ett skalbart 3-lagers token-system med Material Design-principer och stöd för multi-dimensionell tematisering (mode + palette).

---

## ✅ Vad Som Är Klart

### 1. **3-Lagers Token-Arkitektur** (Implementerad)

```
tokens/
├── primitives.css    (202 rader) - Råvärden som ALDRIG ändras
├── semantic.css      (113 rader) - Material Design semantik
└── components.css    (40 rader)  - Undantag från semantic layer
```

#### **tokens/primitives.css**
Innehåller ALLA råvärden:
- **Färgskalor:** `--colors-gray-*`, `--neutral-*`, `--primary-*`, `--secondary-*`, `--tertiary-*`, `--colors-accent-*`, `--colors-alert-danger-*`
- **Typografi:** `--font-sans/serif/mono`, `--text-xs` → `--text-9xl` (alla 13), `--line-height-*`, `--tracking-*`, font weights
- **Spacing:** `--spacing-0` → `--spacing-160`
- **Redundans OK:** Behåller både `--colors-gray-*` OCH `--neutral-*` för flexibilitet

#### **tokens/semantic.css**
Material Design-inspirerade semantiska tokens:
```css
/* Primary (huvudfärg) */
--primary-base              /* Huvudyta */
--primary-on-base           /* Text på huvudytan */
--primary-container         /* Sekundär yta */
--primary-on-container      /* Text på container */

/* Secondary, Background, Surface, Error - samma pattern */
--secondary-base / --secondary-on-base / --secondary-container / --secondary-on-container
--background-base / --background-on-base
--variant-surface / --variant-on-surface
--error-base / --error-on-base / --error-container / --error-on-container

/* State Layers */
--state-layer-base-hover
--state-layer-base-active
--state-layer-container-hover
--state-layer-container-active

/* Borders & Shadows */
--outline-neutral
--border-header
--shadow-01

/* Förenklad syntax (legacy compatibility) */
--text-color, --text-color-accent, --text-color-lighter
--bg-color, --bg-tag, --box-background
```

#### **tokens/components.css**
Endast för edge cases:
```css
/* Forms */
--form-bg, --form-border, --form-placeholder

/* Newsletter (högspecifik) */
--newsletter-signup-bg
--newsletter-illustration-bg
--newsletter-color
--newsletter-button-background
--newsletter-button-color

/* Error (legacy aliases) */
--color-error, --color-error-light, --color-error-dark
```

---

### 2. **Omorganiserade Utilities** (Implementerad)

```
utilities/
├── typography.css    (720 rader) - Allt typography-relaterat
├── layout.css        (200 rader) - Grid, spacing, flex
└── display.css       (50 rader)  - Visibility
```

#### **utilities/typography.css**
- Meyer CSS Reset
- Base body styles
- Font size utilities: `.text-xs` → `.text-9xl`
- Font family: `.font-sans`, `.font-serif`, `.font-mono`
- Font weights: `.font-thin` → `.font-black`
- Line heights: `.line-height-tighter/tight/normal`
- Text colors: `.text-color-default/lighter/accent/neg`
- Letter spacing: `.tracking-tighter` → `.tracking-widest`
- Text transforms: `.text-uppercase`, `.text-capitalize`
- **Semantic typography:**
  - `.type-heading` (serif, 64px)
  - `.type-headline-1/2/3/4` (h1-h4 styles)
  - `.type-caption`, `.type-body`, `.type-body-sm`, `.type-information`
  - `.post-taxonomy-tag`, `.brand`, `.menu-link`
- Element styles: `code`, `figcaption`, `blockquote`
- Hyperlink styles
- Responsive media queries

#### **utilities/layout.css**
- **Margin utilities:** `.mb-0/8/12/16/24/32/48/64/80`, `.mt-0/8/12/16/24/32/48/64/80`
- **Grid system (6-kolumner):**
  - Templates: `.grid-template-2-col`, `.grid-template-3-col`
  - Spans: `.grid-1` → `.grid-6`
  - Positions: `.grid-1-2`, `.grid-3-4`, `.grid-5-6`, `.grid-1-3/4/5/6`
- **Flex:** `.flex`, `.flex-grow`
- **Gap:** `.gap-xs`

#### **utilities/display.css**
- **Responsive:** `.hide-above-sm`, `.hide-on-xs`
- **Context-based:** `.hide-on-client`, `.show-on-client`, `.hide-on-employer`, `.show-on-employer`

---

### 3. **Uppdaterad Build Pipeline** (Implementerad)

**`layouts/partials/head.html`** laddar nu:

```html
<!-- Development Mode -->
<link href="css/tokens/primitives.css" />       <!-- 1. Råvärden -->
<link href="css/tokens/semantic.css" />         <!-- 2. Material Design semantik -->
<link href="css/tokens/components.css" />       <!-- 3. Component tokens -->
<link href="css/variables.css" />               <!-- 4. Legacy teman (överskriver semantic) -->
<link href="css/utilities/typography.css" />    <!-- 5. Typography utilities -->
<link href="css/utilities/layout.css" />        <!-- 6. Layout utilities -->
<link href="css/utilities/display.css" />       <!-- 7. Display utilities -->
<link href="css/style.css" />                   <!-- 8. Komponenter -->
<link href="css/print.css" />                   <!-- 9. Print -->

<!-- Production Mode -->
<!-- Alla filer concateneras, minifieras, fingerprints med SRI -->
```

---

## 📋 Legacy Filer (Deprecated)

Dessa filer laddas INTE längre men finns kvar i repo:
- ❌ `atoms.css` (417 rader) → Ersatt av `utilities/`
- ❌ `typography.css` (471 rader) → Ersatt av `utilities/typography.css`

Dessa kan tas bort efter verifiering.

---

## 🚧 Vad Som Återstår (Nästa Fas)

### **Fas 2: Multi-Dimensional Theming**

Skapa oberoende dimensions för Mode + Palette:

```
dimensions/
├── mode/
│   ├── light.css          # data-mode="light"
│   └── dark.css           # data-mode="dark"
└── palette/
    ├── standard.css       # data-palette="standard"
    ├── high-contrast.css  # data-palette="high-contrast"
    ├── pantone.css        # data-palette="pantone" (nuvarande "pant")
    ├── sepia.css          # data-palette="sepia" (nytt)
    └── monochrome.css     # data-palette="monochrome" (nytt)
```

**Total:** 2 modes × 5 palettes = **10 möjliga kombinationer**

#### **Hur det fungerar:**

```html
<!-- HTML -->
<html data-mode="dark" data-palette="high-contrast">

<!-- CSS -->
:root[data-mode="dark"] {
  --text-primary: var(--gray-50);
  --bg-primary: var(--gray-900);
}

:root[data-palette="high-contrast"] {
  --color-primary: hsl(0, 100%, 50%);  /* Mer intensiv färg */
}

/* Kombination: Dark + High Contrast */
:root[data-mode="dark"][data-palette="high-contrast"] {
  --text-primary: var(--white);        /* Maximal kontrast */
  --border-default: var(--gray-100);
}
```

#### **Migration från nuvarande:**

```css
/* FÖRE (variables.css) */
:root[data-theme="light"] { ... }
:root[data-theme="dark"] { ... }
:root[data-theme="light"][data-mode="pant"] { ... }

/* EFTER */
:root[data-mode="light"] { ... }         /* dimensions/mode/light.css */
:root[data-mode="dark"] { ... }          /* dimensions/mode/dark.css */
:root[data-palette="pantone"] { ... }    /* dimensions/palette/pantone.css */
```

#### **Fördelar:**
- ✅ Oberoende dimensioner (ändra mode utan att röra palette)
- ✅ Skalbart (lägg till nya paletter enkelt)
- ✅ Mindre kod (7 filer istället för 90 kombinationer)
- ✅ Bättre tillgänglighet (high-contrast + dark mode)

---

## 📊 Fullständig Arkitektur

```
CSS Loading Order:
┌─────────────────────────────────────────────────────────┐
│ 1. tokens/primitives.css   (Råvärden)                  │
│    └─> --colors-gray-500, --text-lg, --spacing-16      │
├─────────────────────────────────────────────────────────┤
│ 2. tokens/semantic.css     (Material Design)            │
│    └─> --primary-base, --background-on-base            │
├─────────────────────────────────────────────────────────┤
│ 3. tokens/components.css   (Undantag)                   │
│    └─> --form-bg, --newsletter-button-background       │
├─────────────────────────────────────────────────────────┤
│ 4. variables.css           (Legacy teman)               │
│    └─> Överskriver semantic för light/dark/pant        │
│    WILL BE REPLACED BY: dimensions/mode/* + palette/*  │
├─────────────────────────────────────────────────────────┤
│ 5. utilities/typography.css (Typography utilities)      │
│    └─> .text-lg, .font-sans, .type-heading             │
├─────────────────────────────────────────────────────────┤
│ 6. utilities/layout.css    (Layout utilities)           │
│    └─> .grid-1, .mb-24, .flex                          │
├─────────────────────────────────────────────────────────┤
│ 7. utilities/display.css   (Visibility utilities)       │
│    └─> .hide-on-client, .show-on-employer              │
├─────────────────────────────────────────────────────────┤
│ 8. style.css               (Komponenter)                │
│    └─> .menu, .button, .content                        │
├─────────────────────────────────────────────────────────┤
│ 9. print.css               (Print styles)               │
│    └─> Print-specifika styles                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Vad Material Design-Pattern Betyder

```css
/* Base = Huvudyta för komponenten */
--primary-base: var(--colors-accent-500);

/* On-Base = Text/innehåll PÅ huvudytan */
--primary-on-base: var(--colors-white);

/* Container = Sekundär/ljusare yta */
--primary-container: var(--colors-accent-50);

/* On-Container = Text/innehåll PÅ container-ytan */
--primary-on-container: var(--colors-accent-500);
```

**Exempel i praktiken:**
```css
/* Primary button */
.button-primary {
  background: var(--primary-base);      /* Mörk accent-färg */
  color: var(--primary-on-base);        /* Vit text */
}

/* Secondary button (container) */
.button-secondary {
  background: var(--primary-container);     /* Ljus accent-färg */
  color: var(--primary-on-container);       /* Mörk accent-text */
}
```

---

## 🎨 Planerade Paletter (För Fas 2)

### **Standard** (nuvarande)
Befintliga färger från `--colors-accent-*`

### **High Contrast** (WCAG AAA)
```css
--color-primary: hsl(0, 100%, 50%);      /* Mer intensiv röd */
--color-secondary: hsl(210, 100%, 40%);  /* Mer intensiv blå */
--text-primary: var(--black);             /* Ren svart (light mode) */
--text-primary: var(--white);             /* Ren vit (dark mode) */
```

### **Pantone** (nuvarande "pant" mode)
```css
--color-primary: hsl(348, 83%, 47%);     /* Pantone 186 */
--color-secondary: hsl(200, 100%, 39%);  /* Pantone 3005 */
--img-grayscale: 100%;                   /* Gråskalade bilder */
--img-blend-mode: screen;                /* Screen blend mode */
```

### **Sepia** (nostalgisk)
```css
--color-primary: hsl(30, 40%, 45%);      /* Varma toner */
--bg-primary: hsl(30, 30%, 95%);         /* Sepia bakgrund (light) */
--text-primary: hsl(30, 20%, 15%);       /* Sepia text */
```

### **Monochrome** (minimalistisk)
```css
--color-primary: var(--gray-700);
--color-secondary: var(--gray-500);
--img-grayscale: 100%;                   /* Alla bilder gråskala */
```

---

## 💡 Användningsexempel (Framtida)

```html
<!-- Dark mode + High contrast (tillgänglighet) -->
<html data-mode="dark" data-palette="high-contrast">

<!-- Light mode + Pantone (kreativt) -->
<html data-mode="light" data-palette="pantone">

<!-- Dark mode + Sepia (nostalgiskt) -->
<html data-mode="dark" data-palette="sepia">

<!-- Light mode + Monochrome (minimalistiskt) -->
<html data-mode="light" data-palette="monochrome">
```

---

## 📝 Viktiga Design-Beslut

1. **Redundans i Primitives är OK**
   - Behåller både `--colors-gray-*` och `--neutral-*`
   - Behåller alla 13 font sizes (xs → 9xl)
   - Fokus på flexibilitet, inte optimering

2. **Material Design som Semantisk Standard**
   - `*-base`, `*-on-base`, `*-container`, `*-on-container` pattern
   - Tydlig separation mellan yta och innehåll
   - Enkelt att förstå och använda

3. **Components Layer för Undantag**
   - Forms och Newsletter har unika krav
   - Bryter medvetet från semantiska mönster
   - Dokumenterat varför de är undantag

4. **Backward Compatibility**
   - `variables.css` laddas fortfarande
   - Inga breaking changes
   - Additivt system (nya lager ovanpå gamla)

---

## 🚀 Nästa Steg

### **Alternativ A: Implementera Dimensions (Rekommenderat)**
1. Skapa `dimensions/mode/light.css` och `dark.css`
2. Skapa `dimensions/palette/` med 5 paletter
3. Migrera teman från `variables.css`
4. Uppdatera `head.html` för att ladda dimensions
5. Uppdatera JavaScript för theme switching
6. Testa alla 10 kombinationer

### **Alternativ B: Rensa Legacy Först**
1. Verifiera att allt fungerar med nya strukturen
2. Ta bort `atoms.css`
3. Ta bort `typography.css`
4. Ta bort referenser i git history (om önskat)

### **Alternativ C: Migrera Komponenter**
1. Uppdatera `style.css` att använda semantiska tokens
2. Byt `var(--colors-white)` → `var(--background-base)`
3. Byt `var(--text-color-normal)` → `var(--text-primary)`
4. Etc.

---

## 📁 Git Commits

```
2aaf18b - Reorganize CSS utilities into focused modules
53f97b3 - Add 3-layer CSS token architecture (primitives → semantic → components)
1e7bf6f - Add focused implementation plan for CSS refactoring
3a3b6a9 - Add multi-dimensional theming system architecture
60a6a1c - Add comprehensive CSS structure review and improvement proposal
```

---

## 🤝 För VS Code Claude

Hej! Jag är en annan Claude-instans som tar över här. Läs sammanfattningen ovan för att förstå vad som gjorts hittills. Vi är i **Fas 1** (klart) och ska börja **Fas 2** (dimensions).

**Du kan:**
1. Fortsätta med att implementera `dimensions/mode/` och `dimensions/palette/`
2. Migrera teman från `variables.css` till nya strukturen
3. Uppdatera JavaScript för theme switching
4. Skapa UI för att välja mode + palette

**Fråga användaren vad de vill göra härnäst!**

---

**Senast uppdaterad:** 2026-01-05
**Status:** Fas 1 (Tokens + Utilities) ✅ | Fas 2 (Dimensions) ⏳
