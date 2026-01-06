# Multi-Dimensional Theming System

## Nuvarande System vs. Framtida Behov

### Nuläge
```css
:root[data-theme="light"]                    /* 2 modes */
:root[data-theme="dark"]
:root[data-theme="light"][data-mode="pant"]  /* 2 special modes */
:root[data-theme="dark"][data-mode="pant"]
```

**Problem:** Inte skalbart för 90 kombinationer!

### Framtida Behov
- **Mode:** light, dark (2 varianter)
- **Palette:** standard, high-contrast, pantone, sepia, monochrome (5 varianter)
- **Font:** default, compact, comfortable (3 varianter)
- **Spacing:** tight, normal, relaxed (3 varianter)

**Total kombinationer:** 2 × 5 × 3 × 3 = **90 möjliga teman**

---

## 🎯 Rekommenderad Arkitektur

### Strategi: **Oberoende Dimensioner med CSS Custom Properties**

Varje dimension är **oberoende** och kan kombineras fritt. Istället för att definiera 90 teman, definiera **13 moduler** (2+5+3+3).

---

## 📁 Filstruktur

```
assets/css/
├── tokens/
│   ├── primitives.css          # Layer 1: Råvärden (ändras ALDRIG av teman)
│   ├── semantic.css            # Layer 2: Användningsbaserade (DEFAULT-värden)
│   └── components.css          # Layer 3: Komponent-specifika
│
├── dimensions/
│   ├── mode/
│   │   ├── light.css           # data-mode="light"
│   │   └── dark.css            # data-mode="dark"
│   │
│   ├── palette/
│   │   ├── standard.css        # data-palette="standard" (default)
│   │   ├── high-contrast.css   # data-palette="high-contrast"
│   │   ├── pantone.css         # data-palette="pantone"
│   │   ├── sepia.css           # data-palette="sepia"
│   │   └── monochrome.css      # data-palette="monochrome"
│   │
│   ├── font/
│   │   ├── default.css         # data-font="default"
│   │   ├── compact.css         # data-font="compact"
│   │   └── comfortable.css     # data-font="comfortable"
│   │
│   └── spacing/
│       ├── normal.css          # data-spacing="normal" (default)
│       ├── tight.css           # data-spacing="tight"
│       └── relaxed.css         # data-spacing="relaxed"
│
├── utilities/
│   ├── typography.css
│   ├── layout.css
│   └── display.css
│
├── components/
│   └── all.css
│
└── pages/
    ├── client.css
    └── print.css
```

---

## 🔧 Implementation: Data Attributes

### HTML Setup
```html
<html
  data-mode="light"                    <!-- light | dark -->
  data-palette="standard"              <!-- standard | high-contrast | pantone | sepia | monochrome -->
  data-font="default"                  <!-- default | compact | comfortable -->
  data-spacing="normal"                <!-- normal | tight | relaxed -->
>
```

### JavaScript Switching
```javascript
// Nuvarande (antagligen)
document.documentElement.setAttribute('data-theme', 'dark');

// Nytt system - byt dimension oberoende
function setMode(mode) {
  document.documentElement.setAttribute('data-mode', mode);
}

function setPalette(palette) {
  document.documentElement.setAttribute('data-palette', palette);
}

function setFont(font) {
  document.documentElement.setAttribute('data-font', font);
}

function setSpacing(spacing) {
  document.documentElement.setAttribute('data-spacing', spacing);
}

// Eller hela teman på en gång
function setTheme({ mode, palette, font, spacing }) {
  if (mode) setMode(mode);
  if (palette) setPalette(palette);
  if (font) setFont(font);
  if (spacing) setSpacing(spacing);
}

// Exempel
setTheme({
  mode: 'dark',
  palette: 'high-contrast',
  font: 'comfortable',
  spacing: 'relaxed'
});
```

---

## 📐 Token Architecture

### Layer 1: Primitives (Ändras ALDRIG av teman)

**`tokens/primitives.css`**
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

  /* === FÄRGER: Paletter (Base) === */
  /* Standard palette */
  --palette-standard-primary: hsl(0, 64%, 58%);
  --palette-standard-secondary: hsl(211, 87%, 48%);
  --palette-standard-accent: hsl(160, 62%, 50%);

  /* High contrast palette */
  --palette-hc-primary: hsl(0, 100%, 50%);
  --palette-hc-secondary: hsl(210, 100%, 40%);
  --palette-hc-accent: hsl(160, 100%, 35%);

  /* Pantone palette */
  --palette-pantone-primary: hsl(348, 83%, 47%);    /* Pantone 186 approximation */
  --palette-pantone-secondary: hsl(200, 100%, 39%); /* Pantone 3005 */
  --palette-pantone-accent: hsl(163, 96%, 38%);     /* Pantone 3268 */

  /* Sepia palette */
  --palette-sepia-primary: hsl(30, 40%, 45%);
  --palette-sepia-secondary: hsl(30, 30%, 35%);
  --palette-sepia-accent: hsl(30, 50%, 55%);

  /* Monochrome palette */
  --palette-mono-primary: var(--gray-700);
  --palette-mono-secondary: var(--gray-500);
  --palette-mono-accent: var(--gray-900);

  /* === TYPOGRAFI: Font Families === */
  /* Default fonts */
  --font-family-default-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-family-default-serif: Georgia, Cambria, "Times New Roman", serif;
  --font-family-default-mono: ui-monospace, "Cascadia Code", monospace;

  /* Compact fonts */
  --font-family-compact-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-family-compact-serif: "Times New Roman", Times, serif;
  --font-family-compact-mono: "Courier New", Courier, monospace;

  /* Comfortable fonts */
  --font-family-comfortable-sans: "Inter", "Segoe UI", sans-serif;
  --font-family-comfortable-serif: "Merriweather", Georgia, serif;
  --font-family-comfortable-mono: "Fira Code", "Consolas", monospace;

  /* === TYPOGRAFI: Font Sizes (Base Scale) === */
  --font-size-base-xs: 0.75rem;    /* 12px */
  --font-size-base-sm: 0.875rem;   /* 14px */
  --font-size-base-md: 1rem;       /* 16px */
  --font-size-base-lg: 1.125rem;   /* 18px */
  --font-size-base-xl: 1.25rem;    /* 20px */
  --font-size-base-2xl: 1.5rem;    /* 24px */
  --font-size-base-3xl: 1.875rem;  /* 30px */
  --font-size-base-4xl: 2.25rem;   /* 36px */

  /* === SPACING: Skala (Base Scale) === */
  --space-base-0: 0;
  --space-base-1: 0.25rem;   /* 4px */
  --space-base-2: 0.5rem;    /* 8px */
  --space-base-3: 0.75rem;   /* 12px */
  --space-base-4: 1rem;      /* 16px */
  --space-base-5: 1.25rem;   /* 20px */
  --space-base-6: 1.5rem;    /* 24px */
  --space-base-8: 2rem;      /* 32px */
  --space-base-10: 2.5rem;   /* 40px */
  --space-base-12: 3rem;     /* 48px */
  --space-base-16: 4rem;     /* 64px */
  --space-base-20: 5rem;     /* 80px */
}
```

---

### Layer 2: Semantic Tokens (DEFAULT-värden, överskrivs av dimensioner)

**`tokens/semantic.css`**
```css
:root {
  /* === FÄRGER: Användning (default = standard palette) === */
  --color-primary: var(--palette-standard-primary);
  --color-secondary: var(--palette-standard-secondary);
  --color-accent: var(--palette-standard-accent);

  /* === TEXT FÄRGER (default = light mode) === */
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-tertiary: var(--gray-500);
  --text-inverted: var(--white);
  --text-link: var(--color-primary);
  --text-link-hover: var(--color-secondary);

  /* === BAKGRUNDER (default = light mode) === */
  --bg-primary: var(--white);
  --bg-secondary: var(--gray-50);
  --bg-tertiary: var(--gray-100);
  --bg-inverted: var(--gray-900);

  /* === BORDERS (default = light mode) === */
  --border-subtle: var(--gray-200);
  --border-default: var(--gray-300);
  --border-strong: var(--gray-400);

  /* === TYPOGRAFI (default = default fonts) === */
  --font-family-sans: var(--font-family-default-sans);
  --font-family-serif: var(--font-family-default-serif);
  --font-family-mono: var(--font-family-default-mono);

  /* === FONT SIZES (default = normal spacing) === */
  --font-size-xs: var(--font-size-base-xs);
  --font-size-sm: var(--font-size-base-sm);
  --font-size-md: var(--font-size-base-md);
  --font-size-lg: var(--font-size-base-lg);
  --font-size-xl: var(--font-size-base-xl);
  --font-size-2xl: var(--font-size-base-2xl);
  --font-size-3xl: var(--font-size-base-3xl);
  --font-size-4xl: var(--font-size-base-4xl);

  /* === SPACING (default = normal) === */
  --space-0: var(--space-base-0);
  --space-1: var(--space-base-1);
  --space-2: var(--space-base-2);
  --space-3: var(--space-base-3);
  --space-4: var(--space-base-4);
  --space-5: var(--space-base-5);
  --space-6: var(--space-base-6);
  --space-8: var(--space-base-8);
  --space-10: var(--space-base-10);
  --space-12: var(--space-base-12);
  --space-16: var(--space-base-16);
  --space-20: var(--space-base-20);

  /* === LINE HEIGHTS (default = normal) === */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

---

## 🎨 Dimension 1: Mode (Light/Dark)

### `dimensions/mode/light.css`
```css
:root[data-mode="light"] {
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

  /* === SKUGGOR === */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### `dimensions/mode/dark.css`
```css
:root[data-mode="dark"] {
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

---

## 🎨 Dimension 2: Palette (5 Varianter)

### `dimensions/palette/standard.css`
```css
:root[data-palette="standard"] {
  --color-primary: var(--palette-standard-primary);
  --color-secondary: var(--palette-standard-secondary);
  --color-accent: var(--palette-standard-accent);
}
```

### `dimensions/palette/high-contrast.css`
```css
:root[data-palette="high-contrast"] {
  --color-primary: var(--palette-hc-primary);
  --color-secondary: var(--palette-hc-secondary);
  --color-accent: var(--palette-hc-accent);

  /* Overrides för ökad kontrast */
  --text-primary: var(--black);
  --text-secondary: var(--gray-800);
  --border-default: var(--gray-900);
  --border-strong: var(--black);
}

:root[data-mode="dark"][data-palette="high-contrast"] {
  --text-primary: var(--white);
  --text-secondary: var(--gray-200);
  --border-default: var(--gray-100);
}
```

### `dimensions/palette/pantone.css`
```css
:root[data-palette="pantone"] {
  --color-primary: var(--palette-pantone-primary);
  --color-secondary: var(--palette-pantone-secondary);
  --color-accent: var(--palette-pantone-accent);

  /* Special overrides för Pantone "look" */
  --image-filter: grayscale(100%);
  --image-blend-mode: multiply;
}
```

### `dimensions/palette/sepia.css`
```css
:root[data-palette="sepia"] {
  --color-primary: var(--palette-sepia-primary);
  --color-secondary: var(--palette-sepia-secondary);
  --color-accent: var(--palette-sepia-accent);

  /* Sepia overrides för backgrounds */
  --bg-primary: hsl(30, 30%, 95%);
  --bg-secondary: hsl(30, 25%, 90%);
  --text-primary: hsl(30, 20%, 15%);
}
```

### `dimensions/palette/monochrome.css`
```css
:root[data-palette="monochrome"] {
  --color-primary: var(--palette-mono-primary);
  --color-secondary: var(--palette-mono-secondary);
  --color-accent: var(--palette-mono-accent);

  /* Monochrome överrides */
  --image-filter: grayscale(100%);
}
```

---

## 🔤 Dimension 3: Font (3 Varianter)

### `dimensions/font/default.css`
```css
:root[data-font="default"] {
  --font-family-sans: var(--font-family-default-sans);
  --font-family-serif: var(--font-family-default-serif);
  --font-family-mono: var(--font-family-default-mono);
}
```

### `dimensions/font/compact.css`
```css
:root[data-font="compact"] {
  --font-family-sans: var(--font-family-compact-sans);
  --font-family-serif: var(--font-family-compact-serif);
  --font-family-mono: var(--font-family-compact-mono);

  /* Kompaktare font sizes */
  --font-size-xs: calc(var(--font-size-base-xs) * 0.9);
  --font-size-sm: calc(var(--font-size-base-sm) * 0.9);
  --font-size-md: calc(var(--font-size-base-md) * 0.9);
  --font-size-lg: calc(var(--font-size-base-lg) * 0.9);
  --font-size-xl: calc(var(--font-size-base-xl) * 0.9);
  --font-size-2xl: calc(var(--font-size-base-2xl) * 0.9);
  --font-size-3xl: calc(var(--font-size-base-3xl) * 0.9);

  /* Tightare line heights */
  --line-height-normal: 1.4;
  --line-height-relaxed: 1.6;
}
```

### `dimensions/font/comfortable.css`
```css
:root[data-font="comfortable"] {
  --font-family-sans: var(--font-family-comfortable-sans);
  --font-family-serif: var(--font-family-comfortable-serif);
  --font-family-mono: var(--font-family-comfortable-mono);

  /* Större font sizes */
  --font-size-xs: calc(var(--font-size-base-xs) * 1.1);
  --font-size-sm: calc(var(--font-size-base-sm) * 1.1);
  --font-size-md: calc(var(--font-size-base-md) * 1.1);
  --font-size-lg: calc(var(--font-size-base-lg) * 1.1);
  --font-size-xl: calc(var(--font-size-base-xl) * 1.1);
  --font-size-2xl: calc(var(--font-size-base-2xl) * 1.1);
  --font-size-3xl: calc(var(--font-size-base-3xl) * 1.1);

  /* Mer relaxed line heights */
  --line-height-normal: 1.6;
  --line-height-relaxed: 1.85;
}
```

---

## 📏 Dimension 4: Spacing (3 Varianter)

### `dimensions/spacing/normal.css`
```css
:root[data-spacing="normal"] {
  --space-0: var(--space-base-0);
  --space-1: var(--space-base-1);
  --space-2: var(--space-base-2);
  --space-3: var(--space-base-3);
  --space-4: var(--space-base-4);
  --space-5: var(--space-base-5);
  --space-6: var(--space-base-6);
  --space-8: var(--space-base-8);
  --space-10: var(--space-base-10);
  --space-12: var(--space-base-12);
  --space-16: var(--space-base-16);
  --space-20: var(--space-base-20);
}
```

### `dimensions/spacing/tight.css`
```css
:root[data-spacing="tight"] {
  /* Minska alla spacing med 20% */
  --space-0: var(--space-base-0);
  --space-1: calc(var(--space-base-1) * 0.8);
  --space-2: calc(var(--space-base-2) * 0.8);
  --space-3: calc(var(--space-base-3) * 0.8);
  --space-4: calc(var(--space-base-4) * 0.8);
  --space-5: calc(var(--space-base-5) * 0.8);
  --space-6: calc(var(--space-base-6) * 0.8);
  --space-8: calc(var(--space-base-8) * 0.8);
  --space-10: calc(var(--space-base-10) * 0.8);
  --space-12: calc(var(--space-base-12) * 0.8);
  --space-16: calc(var(--space-base-16) * 0.8);
  --space-20: calc(var(--space-base-20) * 0.8);

  /* Justera header height */
  --header-height: calc(3.5rem * 0.8);
}
```

### `dimensions/spacing/relaxed.css`
```css
:root[data-spacing="relaxed"] {
  /* Öka alla spacing med 25% */
  --space-0: var(--space-base-0);
  --space-1: calc(var(--space-base-1) * 1.25);
  --space-2: calc(var(--space-base-2) * 1.25);
  --space-3: calc(var(--space-base-3) * 1.25);
  --space-4: calc(var(--space-base-4) * 1.25);
  --space-5: calc(var(--space-base-5) * 1.25);
  --space-6: calc(var(--space-base-6) * 1.25);
  --space-8: calc(var(--space-base-8) * 1.25);
  --space-10: calc(var(--space-base-10) * 1.25);
  --space-12: calc(var(--space-base-12) * 1.25);
  --space-16: calc(var(--space-base-16) * 1.25);
  --space-20: calc(var(--space-base-20) * 1.25);

  /* Justera header height */
  --header-height: calc(3.5rem * 1.25);
}
```

---

## 🔄 Build Pipeline (Hugo)

**`layouts/partials/head.html`**

```html
<!-- === LAYER 1: Primitives (alltid laddad) === -->
{{ $primitives := resources.Get "css/tokens/primitives.css" }}

<!-- === LAYER 2: Semantic defaults === -->
{{ $semantic := resources.Get "css/tokens/semantic.css" }}
{{ $components := resources.Get "css/tokens/components.css" }}

<!-- === LAYER 3: Dimensions (alla laddas för att tillåta runtime switching) === -->
<!-- Mode -->
{{ $modeLight := resources.Get "css/dimensions/mode/light.css" }}
{{ $modeDark := resources.Get "css/dimensions/mode/dark.css" }}

<!-- Palette -->
{{ $paletteStandard := resources.Get "css/dimensions/palette/standard.css" }}
{{ $paletteHC := resources.Get "css/dimensions/palette/high-contrast.css" }}
{{ $palettePantone := resources.Get "css/dimensions/palette/pantone.css" }}
{{ $paletteSepia := resources.Get "css/dimensions/palette/sepia.css" }}
{{ $paletteMono := resources.Get "css/dimensions/palette/monochrome.css" }}

<!-- Font -->
{{ $fontDefault := resources.Get "css/dimensions/font/default.css" }}
{{ $fontCompact := resources.Get "css/dimensions/font/compact.css" }}
{{ $fontComfy := resources.Get "css/dimensions/font/comfortable.css" }}

<!-- Spacing -->
{{ $spacingNormal := resources.Get "css/dimensions/spacing/normal.css" }}
{{ $spacingTight := resources.Get "css/dimensions/spacing/tight.css" }}
{{ $spacingRelaxed := resources.Get "css/dimensions/spacing/relaxed.css" }}

<!-- === LAYER 4: Utilities & Components === -->
{{ $typography := resources.Get "css/utilities/typography.css" }}
{{ $layout := resources.Get "css/utilities/layout.css" }}
{{ $display := resources.Get "css/utilities/display.css" }}
{{ $styles := resources.Get "css/components/all.css" }}

{{ if eq hugo.Environment "production" }}
  <!-- Concatenate alla filer i rätt ordning -->
  {{ $all := slice
    $primitives $semantic $components
    $modeLight $modeDark
    $paletteStandard $paletteHC $palettePantone $paletteSepia $paletteMono
    $fontDefault $fontCompact $fontComfy
    $spacingNormal $spacingTight $spacingRelaxed
    $typography $layout $display $styles
  | resources.Concat "css/bundle.css"
  | minify
  | fingerprint "sha384" }}

  <link rel="stylesheet" href="{{ $all.RelPermalink }}"
        integrity="{{ $all.Data.Integrity }}"
        crossorigin="anonymous">
{{ else }}
  <!-- Development: Separata filer för enklare debugging -->
  {{ range slice $primitives $semantic $components $modeLight $modeDark $paletteStandard $paletteHC $palettePantone $paletteSepia $paletteMono $fontDefault $fontCompact $fontComfy $spacingNormal $spacingTight $spacingRelaxed $typography $layout $display $styles }}
    <link rel="stylesheet" href="{{ .RelPermalink }}">
  {{ end }}
{{ end }}
```

---

## 🎨 Användningsexempel

### Exempel 1: Dark Mode + High Contrast + Comfortable Font + Relaxed Spacing
```html
<html
  data-mode="dark"
  data-palette="high-contrast"
  data-font="comfortable"
  data-spacing="relaxed"
>
```

**Resultat:**
- Mörk bakgrund med ljus text
- Maximal färgkontrast för tillgänglighet
- Större, mer lättlästa typsnitt
- Generösare spacing mellan element

### Exempel 2: Light Mode + Sepia + Compact + Tight
```html
<html
  data-mode="light"
  data-palette="sepia"
  data-font="compact"
  data-spacing="tight"
>
```

**Resultat:**
- Ljus sepiafärgad bakgrund
- Varma, nostalgiska färger
- Kompakta typsnitt
- Tätt packad layout (mer innehåll på skärmen)

### Exempel 3: Dark Mode + Pantone + Default Font + Normal Spacing
```html
<html
  data-mode="dark"
  data-palette="pantone"
  data-font="default"
  data-spacing="normal"
>
```

**Resultat:**
- Mörkt tema med Pantone-färger
- Gråskalade bilder med multiply blend
- Standard typografi
- Normal spacing

---

## 🎛️ Theme Switcher UI (Förslag)

### Komplett Theme Switcher
```html
<!-- Theme Controls -->
<div class="theme-controls">
  <fieldset>
    <legend>Mode</legend>
    <label><input type="radio" name="mode" value="light" checked> Light</label>
    <label><input type="radio" name="mode" value="dark"> Dark</label>
  </fieldset>

  <fieldset>
    <legend>Color Palette</legend>
    <label><input type="radio" name="palette" value="standard" checked> Standard</label>
    <label><input type="radio" name="palette" value="high-contrast"> High Contrast</label>
    <label><input type="radio" name="palette" value="pantone"> Pantone</label>
    <label><input type="radio" name="palette" value="sepia"> Sepia</label>
    <label><input type="radio" name="palette" value="monochrome"> Monochrome</label>
  </fieldset>

  <fieldset>
    <legend>Font Style</legend>
    <label><input type="radio" name="font" value="default" checked> Default</label>
    <label><input type="radio" name="font" value="compact"> Compact</label>
    <label><input type="radio" name="font" value="comfortable"> Comfortable</label>
  </fieldset>

  <fieldset>
    <legend>Spacing</legend>
    <label><input type="radio" name="spacing" value="normal" checked> Normal</label>
    <label><input type="radio" name="spacing" value="tight"> Tight</label>
    <label><input type="radio" name="spacing" value="relaxed"> Relaxed</label>
  </fieldset>
</div>

<script>
  // Apply theme changes
  document.querySelectorAll('.theme-controls input').forEach(input => {
    input.addEventListener('change', (e) => {
      const dimension = e.target.name;
      const value = e.target.value;
      document.documentElement.setAttribute(`data-${dimension}`, value);

      // Save to localStorage
      localStorage.setItem(`theme-${dimension}`, value);
    });
  });

  // Restore from localStorage on load
  ['mode', 'palette', 'font', 'spacing'].forEach(dimension => {
    const saved = localStorage.getItem(`theme-${dimension}`);
    if (saved) {
      document.documentElement.setAttribute(`data-${dimension}`, saved);
      document.querySelector(`input[name="${dimension}"][value="${saved}"]`).checked = true;
    }
  });
</script>
```

---

## ✅ Fördelar med Detta System

| Aspekt | Fördelar |
|--------|----------|
| **Skalbarhet** | 13 filer istället för 90 kombinationer |
| **Underhåll** | Ändra en dimension utan att röra andra |
| **Filstorlek** | ~25KB istället för potentiellt 200KB+ |
| **Flexibilitet** | Användare kan mixa och matcha fritt |
| **Debugging** | Enkelt att isolera problem till en dimension |
| **Git** | Mindre merge conflicts, tydligare diffs |
| **Testing** | Testa varje dimension oberoende |
| **Tillgänglighet** | High contrast + Relaxed spacing kombineras fritt |

---

## 📊 Jämförelse

### Nuvarande (Monolitiskt)
```
6 teman × 65 rader = 390 rader i EN fil
```

### Multi-Dimensional System
```
Primitives:  ~200 rader
Semantic:    ~100 rader
Components:  ~50 rader
Mode (2):    2 × 40 rader = 80 rader
Palette (5): 5 × 30 rader = 150 rader
Font (3):    3 × 40 rader = 120 rader
Spacing (3): 3 × 25 rader = 75 rader
─────────────────────────────────────
TOTAL:       ~775 rader i 13+ filer
```

Men du får **90 kombinationer** istället för 6!

---

## 🚀 Migration Plan

### Steg 1: Skapa Grundstrukturen
1. Skapa mappstruktur (`tokens/`, `dimensions/`, etc.)
2. Extrahera primitives från nuvarande `variables.css`
3. Skapa semantic layer med default-värden

### Steg 2: Migrera Befintliga Teman
1. Light mode → `dimensions/mode/light.css`
2. Dark mode → `dimensions/mode/dark.css`
3. Pant mode → `dimensions/palette/pantone.css` (rename)

### Steg 3: Lägg Till Nya Dimensioner
1. Skapa palette-varianter (high-contrast, sepia, monochrome)
2. Skapa font-varianter (compact, comfortable)
3. Skapa spacing-varianter (tight, relaxed)

### Steg 4: Uppdatera JavaScript
1. Ändra `data-theme` → `data-mode`
2. Lägg till switchers för nya dimensioner
3. Spara preferenser i localStorage

### Steg 5: Testa
1. Verifiera alla 90 kombinationer fungerar
2. Testa tillgänglighet (särskilt high-contrast combos)
3. Performance audit (bundle size, render time)

---

## 💡 Nästa Steg

1. **Beslut:** Vill du implementera detta multi-dimensionella system?
2. **Prioritering:** Vilken dimension är viktigast att börja med?
3. **Timeline:** Vill du göra allt på en gång eller stegvis?

Jag kan hjälpa dig bygga detta system bit för bit!
