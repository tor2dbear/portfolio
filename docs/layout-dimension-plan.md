# `data-layout` — kompositions-token-kontrakt & refaktor-checklista

En fjärde, ortogonal dimension vid sidan av `palette × typography × mode × grain × intensity`.
Palett och typografi ligger kvar exakt som idag. Layout äger **spatial struktur** — inget annat.

> **Nyckelinsikt från auditen:** din komposition är redan tokeniserad — men konsumenterna pekar
> direkt på _primitiva_ tokens (`var(--spacing-64)`, `var(--measure-prose)`). Refaktorn är därför
> mest **indirektion**, inte värde-extraktion: lägg ett tunt semantiskt `--layout-*`-lager mellan
> primitives och konsumenter. Allt `--layout-*` får default = dagens värde, så lagret är en
> **visuell no-op** tills en icke-default layout väljs. Samma mönster som `--state-mix-*` redan
> använder i `semantic.css`.

---

## 1. Kontraktet — vilka `--layout-*` finns

Definieras i `:root` (defaults) i `tokens/semantic.css`, åsidosätts per `:root[data-layout="…"]`.

### A. Sektionsrytm (vertikal)
| Token | Default (idag) | Konsument |
|---|---|---|
| `--layout-section-rhythm` | `var(--spacing-64)` | `.home-section` padding |
| `--layout-hero-rhythm` | `var(--spacing-96)` | hero padding |
| `--layout-heading-gap` | `var(--spacing-32)` | `.section-heading` margin-bottom |
| `--layout-block-gap` | `var(--spacing-32)` | vertikalt mellanrum mellan content-block / row-gap |

### B. Grid (horisontell)
| Token | Default (idag) | Konsument |
|---|---|---|
| `--layout-col-gap` | `var(--spacing-24)` | `.page-grid` / `.use-subgrid` / `.grid-cols-2` column-gap |
| `--layout-row-gap` | `var(--spacing-32)` | `.page-grid` row-gap |
| `--layout-default-place` | `8` (≈ `.place-prose`) | default kolumnspann för brödtext-block |

> Kolumn­_antalet_ (12) lämnas oförändrat — variera **placering** via `.place-*` / `--col`,
> inte rasterupplösningen. Att byta 12→ annat är invasivt och onödigt.

### C. Satsbredd (measure)
| Token | Default (idag) | Konsument |
|---|---|---|
| `--layout-measure` | `var(--measure-prose)` (70ch) | `typography.css` prose `max-width` |

### D. Typskala
| Token | Default (idag) | Konsument |
|---|---|---|
| `--layout-scale-ratio` | `1` | multiplikator på display/heading clamp (redan finns som `--type-scale-display` i `home.css:82`) |

### E. Strukturella toggles (0/1, läses i selektorer)
| Token | Default | Effekt |
|---|---|---|
| `--layout-pullquotes` | `0` | aktiverar pull-quote-utbrytning |
| `--layout-dropcap` | `0` | anfang på första stycket |
| `--layout-rule-style` | `none` | linjal/divider-behandling mellan block |

---

## 2. "Lift list" — exakt vad som repekas (visuell no-op)

Varje rad: byt direkt primitiv-referens → `--layout-*`. Inga utseende­ändringar (defaults = dagens).

| Fil:rad | Idag | Byt till |
|---|---|---|
| `assets/css/pages/home.css:11` | `padding: var(--spacing-64) 0;` | `padding: var(--layout-section-rhythm) 0;` |
| `assets/css/pages/home.css:74` | hero `padding: var(--spacing-96) 0;` | `var(--layout-hero-rhythm) 0;` |
| `assets/css/pages/home.css:61` | `.section-heading … margin-bottom: var(--spacing-32);` | `var(--layout-heading-gap);` |
| `assets/css/pages/home.css:26,31` | `column-gap: var(--spacing-24);` | `var(--layout-col-gap);` |
| `assets/css/pages/home.css:79` | `max-width: var(--content-max-width-narrow);` | (lämna — hero-specifik) |
| `assets/css/pages/home.css:82` | `* var(--type-scale-display)` | `* var(--layout-scale-ratio)` (alias `--type-scale-display` → `--layout-scale-ratio`) |
| `assets/css/utilities/grid.css:13` | `.page-grid column-gap: var(--spacing-24);` | `var(--layout-col-gap);` |
| `assets/css/utilities/grid.css:14` | `.page-grid row-gap: var(--spacing-32);` | `var(--layout-row-gap);` |
| `assets/css/utilities/grid.css:24,52` | subgrid `column-gap: var(--spacing-24/16);` | `var(--layout-col-gap);` (behåll sm-override) |
| `assets/css/utilities/typography.css:425` | `max-width: var(--measure-prose);` | `var(--layout-measure);` |
| `assets/css/utilities/_legacy-grid.css:5` | `column-gap: 1.5rem;` **(rått värde)** | `var(--layout-col-gap);` ← enda äkta värde-extraktionen |

**Lämna orört:** `utilities/layout.css` `.flex { gap: 1rem }`, `.gap-xs/.gap-*` — det är en
generisk util-skala, inte komposition på sidnivå. Att koppla in dem ger brus utan vinst.

---

## 3. Dimensionsfiler (stubs)

Ny mapp `assets/css/dimensions/layout/`. Tre att börja med — namngivna efter _spatial karaktär_,
medvetet **inte** typografi-namnen (signalerar oberoende).

```css
/* dimensions/layout/column.css — explicit baseline (= dagens utseende) */
:root[data-layout="column"] {
  /* allt ärver defaults från :root; filen får finnas för tydlighet/UI */
}
```

```css
/* dimensions/layout/editorial.css — asymmetriskt, luftigt, redaktionellt */
:root[data-layout="editorial"] {
  --layout-section-rhythm: var(--spacing-96);
  --layout-heading-gap:    var(--spacing-48);
  --layout-col-gap:        var(--spacing-32);
  --layout-measure:        var(--measure-wide);   /* 45ch */
  --layout-scale-ratio:    1.18;
  --layout-default-place:  col-start 3 / span 8;  /* ≈ .place-article */
  --layout-pullquotes:     1;
  --layout-dropcap:        1;
  --layout-rule-style:     hairline;
}
```

```css
/* dimensions/layout/index.css — tätt, modulärt, bild-framåt */
:root[data-layout="index"] {
  --layout-section-rhythm: var(--spacing-40);
  --layout-heading-gap:    var(--spacing-16);
  --layout-col-gap:        var(--spacing-16);
  --layout-row-gap:        var(--spacing-16);
  --layout-measure:        var(--measure-prose);
  --layout-scale-ratio:    0.95;
  --layout-default-place:  col-start 1 / span 12; /* ≈ .place-full */
}
```

---

## 4. Registrering & inkoppling (spegla typografi-dimensionen)

1. **CSS-bundle** — `layouts/partials/head.html`, efter typografi-blocket (rad ~148):
   ```go-html-template
   {{ $dimensions_layout_column    := resources.Get "css/dimensions/layout/column.css" }}
   {{ $dimensions_layout_editorial := resources.Get "css/dimensions/layout/editorial.css" }}
   {{ $dimensions_layout_index     := resources.Get "css/dimensions/layout/index.css" }}
   ```
   Lägg dem i samma `slice … | resources.Concat`-lista som de andra dimensionerna.

2. **Pre-paint (no-FOUC)** — `head.html:~541`, direkt efter typografi-raden:
   ```js
   var storedLayout = localStorage.getItem("theme-layout") || "column";
   document.documentElement.setAttribute("data-layout", storedLayout);
   ```

3. **JS** — `assets/js/darkmode.js`: spegla `setTypography`/`applyTypography`/`updateTypographyUI`,
   **minus hela `TYPOGRAPHY_FONTS`-förladdningen** (layout har inga webbfonter → enklare):
   ```js
   function setLayout(layout) {
     localStorage.setItem("theme-layout", layout);
     updateLayoutUI(layout);
     applyLayout(layout);                 // setAttribute("data-layout", layout)
     if (window.Toast) window.Toast.show(layoutCategoryLabel, layoutLabel);
   }
   ```

4. **Dropdown-markup** — `layouts/partials/settings-dropdown.html`: ny "Layout"-grupp med
   `[data-js="layout-option"][data-layout="column|editorial|index"]` + `data-toast-category="layout"`.

5. **Footer-label** (valfritt) — spegla `updateFooterTypographyLabel`.

---

## 5. Den enda riktiga designfrågan: ortogonalitet

Börja **rent ortogonalt** — alla `layout × typography × palette`-kombinationer tillåts. Token-stegen
garanterar att inget blir _trasigt_; i värsta fall _oväntat_. Lägg till mjuk koppling eller
kuraterade par först om en specifik kombination skaver.

---

## 6. Ordnad refaktor (varje steg verifierbart)

1. Lägg `--layout-*` defaults i `:root` (= dagens värden). **Visuell no-op.** Bygg, verifiera.
2. Repeka de ~11 konsumenterna i §2 till `--layout-*`. Fortfarande no-op. Lighthouse + visuell diff.
3. Skapa `dimensions/layout/{column,editorial,index}.css`.
4. Registrera i `head.html` (§4.1) + pre-paint (§4.2).
5. Koppla JS + dropdown (§4.3–4.4).
6. Testa matrisen: varje layout × 2 typografier × ljus/mörk + ett pantone-tema → bekräfta att
   oberoendet håller.

---

## 7. Var det generativa kommer in (efteråt)

När `layout` är en ren parameter: `komposition = f(layout)`. I steg 1 sätter dropdownen värdet
(konfiguration). Det blir **procedurellt generativt UI** när något _annat_ sätter parametern:
innehåll (`f(antal bilder, bildförhållanden)`), en seed (delbar/reproducerbar), eller — bryggan
till den modelldrivna grenen — intent.
