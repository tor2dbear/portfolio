# CSS Refactoring - Implementation Plan

## Scope (Fas 1)

### ✅ Inkluderat
- **Mode:** light, dark (2 varianter)
- **Palette:** standard, high-contrast, pantone, sepia, monochrome (5 varianter)
- **Total kombinationer:** 2 × 5 = **10 teman**
- **Antal filer:** 2 + 5 = **7 tema-filer**

### ⏳ Senare (Fas 2)
- Font dimension (default, compact, comfortable)
- Spacing dimension (tight, normal, relaxed)

---

## Målstruktur

```
assets/css/
├── tokens/
│   ├── primitives.css          # Råvärden (färger, storlekar)
│   ├── semantic.css            # Användningsbaserade tokens
│   └── components.css          # Komponent-specifika tokens
│
├── dimensions/
│   ├── mode/
│   │   ├── light.css           # data-mode="light"
│   │   └── dark.css            # data-mode="dark"
│   │
│   └── palette/
│       ├── standard.css        # data-palette="standard"
│       ├── high-contrast.css   # data-palette="high-contrast"
│       ├── pantone.css         # data-palette="pantone" (nuvarande "pant")
│       ├── sepia.css           # data-palette="sepia"
│       └── monochrome.css      # data-palette="monochrome"
│
├── utilities/
│   ├── typography.css          # Renade font utilities
│   ├── layout.css              # Grid, flex, spacing
│   └── display.css             # Visibility helpers
│
├── components/
│   └── all.css                 # Från nuvarande style.css
│
└── pages/
    ├── client.css              # Från clientpage.css
    └── print.css               # Print styles
```

---

## Steg-för-Steg Implementation

### **Steg 1: Skapa Tokens (Layer 1-3)**

#### 1.1 Primitives (`tokens/primitives.css`)
Extrahera från nuvarande `variables.css`:
- Färgpaletter (gråskala, primary, secondary, tertiary, accent, alert)
- Typografi (font families, sizes, weights, line heights)
- Spacing scale
- Layout constants

**Ändringar:**
- ❌ **TA BORT:** `--neutral-*` (duplicerad gråskala)
- ❌ **TA BORT:** Duplicerad `--colors-gray-50` definition
- ❌ **TA BORT:** Oanvända text sizes (text-3xl → text-9xl)
- ✅ **BEHÅLL:** Bara primitiva värden som ALDRIG ändras av teman

#### 1.2 Semantic (`tokens/semantic.css`)
Skapa semantiska lager:
```css
/* Text colors */
--text-primary
--text-secondary
--text-tertiary
--text-inverted
--text-link
--text-link-hover

/* Backgrounds */
--bg-primary
--bg-secondary
--bg-tertiary
--bg-inverted

/* Borders */
--border-subtle
--border-default
--border-strong
```

**Default-värden:** Light mode + Standard palette

#### 1.3 Components (`tokens/components.css`)
Konsolidera komponent-specifika tokens:
```css
/* Buttons */
--button-primary-bg
--button-primary-hover-bg
--button-primary-text

/* Forms */
--input-bg
--input-border
--input-border-focus
--input-text
--input-placeholder

/* Navigation */
--nav-bg
--nav-text
--nav-text-hover

/* Newsletter */
--newsletter-bg
--newsletter-button-bg
--newsletter-button-hover-bg
```

**Ändra:** `--newsletter-button-background` → `--newsletter-button-bg` (konsekvent naming)

---

### **Steg 2: Skapa Mode Dimension**

#### 2.1 Light Mode (`dimensions/mode/light.css`)
Migrera från nuvarande `:root[data-theme="light"]`:
```css
:root[data-mode="light"] {
  /* Text */
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-tertiary: var(--gray-500);
  --text-inverted: var(--white);

  /* Backgrounds */
  --bg-primary: var(--white);
  --bg-secondary: var(--gray-50);
  --bg-tertiary: var(--gray-100);
  --bg-inverted: var(--gray-900);

  /* Borders */
  --border-subtle: var(--gray-200);
  --border-default: var(--gray-300);
  --border-strong: var(--gray-400);

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

#### 2.2 Dark Mode (`dimensions/mode/dark.css`)
Migrera från nuvarande `:root[data-theme="dark"]`:
```css
:root[data-mode="dark"] {
  /* Text */
  --text-primary: var(--gray-50);
  --text-secondary: var(--gray-400);
  --text-tertiary: var(--gray-500);
  --text-inverted: var(--gray-900);

  /* Backgrounds */
  --bg-primary: var(--gray-900);
  --bg-secondary: var(--gray-800);
  --bg-tertiary: var(--gray-700);
  --bg-inverted: var(--white);

  /* Borders */
  --border-subtle: var(--gray-700);
  --border-default: var(--gray-600);
  --border-strong: var(--gray-500);

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}
```

---

### **Steg 3: Skapa Palette Dimension**

#### 3.1 Standard Palette (`dimensions/palette/standard.css`)
```css
:root[data-palette="standard"] {
  --color-primary: var(--primary-500);
  --color-secondary: var(--secondary-500);
  --color-accent: var(--colors-accent-500);
}
```

#### 3.2 High Contrast Palette (`dimensions/palette/high-contrast.css`)
```css
:root[data-palette="high-contrast"] {
  /* Mer intensiva färger */
  --color-primary: hsl(0, 100%, 50%);
  --color-secondary: hsl(210, 100%, 40%);
  --color-accent: hsl(160, 100%, 35%);
}

/* Öka kontrast i dark mode */
:root[data-mode="dark"][data-palette="high-contrast"] {
  --text-primary: var(--white);
  --text-secondary: var(--gray-200);
  --bg-primary: var(--black);
  --border-default: var(--gray-100);
}

/* Öka kontrast i light mode */
:root[data-mode="light"][data-palette="high-contrast"] {
  --text-primary: var(--black);
  --text-secondary: var(--gray-800);
  --border-default: var(--gray-900);
}
```

#### 3.3 Pantone Palette (`dimensions/palette/pantone.css`)
Migrera från nuvarande `data-mode="pant"`:
```css
:root[data-palette="pantone"] {
  /* Pantone-inspirerade färger */
  --color-primary: hsl(348, 83%, 47%);    /* Pantone 186 */
  --color-secondary: hsl(200, 100%, 39%); /* Pantone 3005 */
  --color-accent: hsl(163, 96%, 38%);     /* Pantone 3268 */

  /* Gråskaliga bilder med multiply blend */
  --image-filter: grayscale(100%);
  --image-blend-mode: multiply;
}
```

#### 3.4 Sepia Palette (`dimensions/palette/sepia.css`)
```css
:root[data-palette="sepia"] {
  /* Varma sepia-toner */
  --color-primary: hsl(30, 40%, 45%);
  --color-secondary: hsl(30, 30%, 35%);
  --color-accent: hsl(30, 50%, 55%);
}

/* Light sepia overrides */
:root[data-mode="light"][data-palette="sepia"] {
  --bg-primary: hsl(30, 30%, 95%);
  --bg-secondary: hsl(30, 25%, 90%);
  --bg-tertiary: hsl(30, 20%, 85%);
  --text-primary: hsl(30, 20%, 15%);
  --text-secondary: hsl(30, 15%, 35%);
}

/* Dark sepia overrides */
:root[data-mode="dark"][data-palette="sepia"] {
  --bg-primary: hsl(30, 15%, 12%);
  --bg-secondary: hsl(30, 12%, 18%);
  --bg-tertiary: hsl(30, 10%, 24%);
  --text-primary: hsl(30, 25%, 90%);
  --text-secondary: hsl(30, 20%, 70%);
}
```

#### 3.5 Monochrome Palette (`dimensions/palette/monochrome.css`)
```css
:root[data-palette="monochrome"] {
  /* Endast gråskala för färger */
  --color-primary: var(--gray-700);
  --color-secondary: var(--gray-500);
  --color-accent: var(--gray-900);

  /* Gråskaliga bilder */
  --image-filter: grayscale(100%);
}
```

---

### **Steg 4: Rensa Utilities**

#### 4.1 Typography (`utilities/typography.css`)
```diff
/* ❌ TA BORT oanvända sizes */
- .text-3xl, .text-4xl, .text-5xl, .text-6xl, .text-7xl, .text-8xl, .text-9xl

/* ✅ BEHÅLL endast använda */
+ .text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl

/* ❌ TA BORT oanvända font weights (kör audit först) */
- .font-thin, .font-extralight, .font-light, .font-black (om oanvända)
```

#### 4.2 Layout (`utilities/layout.css`)
Flytta från `atoms.css`:
- Grid utilities (`.grid-1` → `.grid-6`, `.grid-1-2`, etc.)
- Spacing utilities (`.mb-*`, `.mt-*`)
- Flex utilities (`.flex`, `.flex-grow`)
- Gap utilities (`.gap-xs`)

#### 4.3 Display (`utilities/display.css`)
Flytta från `atoms.css`:
- `.hide-on-client`, `.show-on-client`
- `.hide-on-employer`
- `.hide-above-sm`, `.hide-on-xs`

---

### **Steg 5: Migrera Components**

#### 5.1 Components (`components/all.css`)
Flytta från nuvarande `style.css`:
- Layout components (`.content`, `.client-box`, `.about-cv`)
- Navigation (`.menu`, `.menu-link`, `.hamburgare`)
- Images (`.headerimg`, `.header-image`)
- Forms (`.form-input`, `.mc-field-group`)
- Newsletter (`#newsletter-container`, etc.)
- Buttons (`button`, `.theme-icon`)

**Uppdateringar:**
```diff
/* Använd nya semantic tokens */
- background: var(--colors-white);
+ background: var(--bg-primary);

- color: var(--text-color-normal);
+ color: var(--text-primary);

- border: 1px solid var(--form-border);
+ border: 1px solid var(--input-border);
```

---

### **Steg 6: Uppdatera Build Pipeline**

#### 6.1 Hugo Head Partial (`layouts/partials/head.html`)

```html
{{- $primitives := resources.Get "css/tokens/primitives.css" -}}
{{- $semantic := resources.Get "css/tokens/semantic.css" -}}
{{- $components_tokens := resources.Get "css/tokens/components.css" -}}

{{- $mode_light := resources.Get "css/dimensions/mode/light.css" -}}
{{- $mode_dark := resources.Get "css/dimensions/mode/dark.css" -}}

{{- $palette_standard := resources.Get "css/dimensions/palette/standard.css" -}}
{{- $palette_hc := resources.Get "css/dimensions/palette/high-contrast.css" -}}
{{- $palette_pantone := resources.Get "css/dimensions/palette/pantone.css" -}}
{{- $palette_sepia := resources.Get "css/dimensions/palette/sepia.css" -}}
{{- $palette_mono := resources.Get "css/dimensions/palette/monochrome.css" -}}

{{- $typography := resources.Get "css/utilities/typography.css" -}}
{{- $layout := resources.Get "css/utilities/layout.css" -}}
{{- $display := resources.Get "css/utilities/display.css" -}}

{{- $components := resources.Get "css/components/all.css" -}}
{{- $client := resources.Get "css/pages/client.css" -}}
{{- $print := resources.Get "css/pages/print.css" -}}

{{ if eq hugo.Environment "production" }}
  {{- $all := slice
    $primitives $semantic $components_tokens
    $mode_light $mode_dark
    $palette_standard $palette_hc $palette_pantone $palette_sepia $palette_mono
    $typography $layout $display
    $components $client
  | resources.Concat "css/bundle.css"
  | minify
  | fingerprint "sha384" -}}

  <link rel="stylesheet" href="{{ $all.RelPermalink }}"
        integrity="{{ $all.Data.Integrity }}"
        crossorigin="anonymous">

  {{- $print_min := $print | minify | fingerprint -}}
  <link rel="stylesheet" href="{{ $print_min.RelPermalink }}" media="print">

{{ else }}
  <!-- Development: Individual files -->
  {{- range slice $primitives $semantic $components_tokens $mode_light $mode_dark $palette_standard $palette_hc $palette_pantone $palette_sepia $palette_mono $typography $layout $display $components $client -}}
    <link rel="stylesheet" href="{{ .RelPermalink }}">
  {{- end -}}
  <link rel="stylesheet" href="{{ $print.RelPermalink }}" media="print">
{{ end }}
```

---

### **Steg 7: Uppdatera JavaScript**

#### 7.1 Ändra Data Attributes

**Före:**
```javascript
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.setAttribute('data-mode', 'pant');
```

**Efter:**
```javascript
// Mode switching
function setMode(mode) {
  document.documentElement.setAttribute('data-mode', mode);
  localStorage.setItem('theme-mode', mode);
}

// Palette switching
function setPalette(palette) {
  document.documentElement.setAttribute('data-palette', palette);
  localStorage.setItem('theme-palette', palette);
}

// Initialize from localStorage
function initTheme() {
  const mode = localStorage.getItem('theme-mode') || 'light';
  const palette = localStorage.getItem('theme-palette') || 'standard';

  setMode(mode);
  setPalette(palette);
}

// Run on load
initTheme();
```

#### 7.2 Uppdatera Theme Switcher UI

**Nuvarande (antagligen):**
```html
<button class="theme-toggle">Toggle Dark Mode</button>
```

**Nytt:**
```html
<div class="theme-controls">
  <!-- Mode Toggle -->
  <button class="mode-toggle" data-mode="dark">
    <span class="icon-light">☀️</span>
    <span class="icon-dark">🌙</span>
  </button>

  <!-- Palette Selector -->
  <select class="palette-select">
    <option value="standard">Standard</option>
    <option value="high-contrast">High Contrast</option>
    <option value="pantone">Pantone</option>
    <option value="sepia">Sepia</option>
    <option value="monochrome">Monochrome</option>
  </select>
</div>

<script>
  // Mode toggle
  document.querySelector('.mode-toggle').addEventListener('click', (e) => {
    const currentMode = document.documentElement.getAttribute('data-mode') || 'light';
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  });

  // Palette selector
  document.querySelector('.palette-select').addEventListener('change', (e) => {
    setPalette(e.target.value);
  });

  // Set initial UI state
  const savedMode = localStorage.getItem('theme-mode') || 'light';
  const savedPalette = localStorage.getItem('theme-palette') || 'standard';
  document.querySelector('.palette-select').value = savedPalette;
</script>
```

---

### **Steg 8: Testa**

#### 8.1 Verifiera Alla Kombinationer
- [ ] Light + Standard
- [ ] Light + High Contrast
- [ ] Light + Pantone
- [ ] Light + Sepia
- [ ] Light + Monochrome
- [ ] Dark + Standard
- [ ] Dark + High Contrast
- [ ] Dark + Pantone
- [ ] Dark + Sepia
- [ ] Dark + Monochrome

#### 8.2 Tillgänglighet
- [ ] Kontrastratios (WCAG AA minimum 4.5:1 för text)
- [ ] High contrast mode: minst 7:1 (WCAG AAA)
- [ ] Keyboard navigation fungerar
- [ ] Screen reader compatibility

#### 8.3 Performance
- [ ] Bundle size före/efter
- [ ] First Contentful Paint
- [ ] Largest Contentful Paint
- [ ] Lighthouse score

#### 8.4 Cross-Browser
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## Migration Checklist

### Förberedelser
- [ ] Backup nuvarande CSS-filer
- [ ] Skapa ny branch: `css-refactor-tokens-themes`
- [ ] Lista alla template-filer som använder gamla CSS-klasser

### Tokens
- [ ] Skapa `tokens/primitives.css`
- [ ] Skapa `tokens/semantic.css`
- [ ] Skapa `tokens/components.css`
- [ ] Ta bort dupliceringar (`--neutral-*`, `--colors-gray-50`)
- [ ] Ta bort oanvända text sizes

### Dimensions
- [ ] Skapa `dimensions/mode/light.css`
- [ ] Skapa `dimensions/mode/dark.css`
- [ ] Skapa `dimensions/palette/standard.css`
- [ ] Skapa `dimensions/palette/high-contrast.css`
- [ ] Skapa `dimensions/palette/pantone.css`
- [ ] Skapa `dimensions/palette/sepia.css`
- [ ] Skapa `dimensions/palette/monochrome.css`

### Utilities
- [ ] Skapa `utilities/typography.css` (renad)
- [ ] Skapa `utilities/layout.css`
- [ ] Skapa `utilities/display.css`

### Components & Pages
- [ ] Skapa `components/all.css`
- [ ] Uppdatera till semantic tokens
- [ ] Skapa `pages/client.css`
- [ ] Behåll `pages/print.css`

### Build & JavaScript
- [ ] Uppdatera `layouts/partials/head.html`
- [ ] Uppdatera theme-switching JavaScript
- [ ] Testa development mode
- [ ] Testa production build

### Testing & QA
- [ ] Visual regression testing (alla 10 kombinationer)
- [ ] Tillgänglighetstester
- [ ] Performance audit
- [ ] Cross-browser testing

### Cleanup
- [ ] Ta bort gamla filer (`variables.css`, `atoms.css`, `typography.css`, `style.css`)
- [ ] Uppdatera dokumentation
- [ ] Code review
- [ ] Merge till main

---

## Förväntade Resultat

### Före
- **Filer:** 6 CSS-filer (2,834 rader)
- **Tokens:** 320 (många oanvända/duplicerade)
- **Teman:** 6 (alla i en fil)
- **Skalbarhet:** Svårt att lägga till nya teman

### Efter
- **Filer:** ~16 CSS-filer (välorganiserade)
- **Tokens:** ~180 (renade, i 3 lager)
- **Teman:** 10 kombinationer (från 7 filer)
- **Skalbarhet:** Lägg till nya paletter enkelt

### Metrics
- **Token reduction:** 320 → 180 (44% minskning)
- **Largest file:** 398 rader → ~120 rader (70% minskning)
- **Kombinationer:** 6 → 10 (67% ökning)
- **Underhåll:** Mycket enklare att navigera och uppdatera

---

## Tidsuppskattning

| Steg | Uppskattad tid |
|------|----------------|
| Steg 1: Tokens | 2-3 timmar |
| Steg 2: Mode | 1 timme |
| Steg 3: Palette | 2-3 timmar |
| Steg 4: Utilities | 1 timme |
| Steg 5: Components | 2 timmar |
| Steg 6: Build | 1 timme |
| Steg 7: JavaScript | 1 timme |
| Steg 8: Testing | 2-3 timmar |
| **Total** | **12-16 timmar** |

---

## Nästa Steg

**Vad vill du göra?**

1. **🚀 Kör igång direkt** - Jag börjar implementera från Steg 1
2. **🔍 Audit först** - Kör en grundlig analys av vilka tokens/klasser som faktiskt används
3. **📝 Diskutera detaljer** - Frågor om implementation?
4. **🎨 Designa paletter** - Vill du bestämma exakta färger för sepia/monochrome först?

Säg till så kör vi!
