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

| Token                       | Default (kolumn)                              | Konsument                                                |
| --------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| `--layout-section-rhythm`   | `clamp(2rem, 0.92rem + 4.82vw, 4rem)` (32→64) | `.home-section` padding                                  |
| `--layout-hero-rhythm`      | `clamp(4rem, 2.92rem + 4.82vw, 6rem)` (64→96) | hero padding                                             |
| `--layout-heading-gap`      | `var(--spacing-32)`                           | `.section-heading` margin-bottom                         |
| `--layout-block-gap`        | `calc(var(--spacing-32) * prose-rhythm)`      | mellan/inuti kompositionsblock (titlar, sektioner, kort) |
| `--layout-title-gap`        | `calc(var(--spacing-24) * prose-rhythm)`      | under masthead-/hero-titel                               |
| `--layout-label-gap`        | `calc(var(--spacing-16) * prose-rhythm)`      | under liten etikett/underrubrik                          |
| `--layout-content-top`      | `var(--spacing-80)`                           | `.content` padding-top (innersidor)                      |
| `--layout-hero-heading-top` | `var(--spacing-80)`                           | `.startpage-heading` padding-top (hem-hero)              |
| `--layout-about-cv-gap`     | `var(--spacing-64)`                           | `.about-cv` margin-top                                   |
| `--layout-contact-info-gap` | `var(--spacing-64)`                           | `.contact-info` margin-bottom                            |

> **Fluid rytm:** `section-rhythm` och `hero-rhythm` är `clamp()` — tokenen skalar
> själv med viewporten (min på telefon → max på desktop), så små skärmar komprimeras
> automatiskt utan egenskaps-overrides i media-queries. Varje layout re-klampar till
> sina egna min/max; `.home-section` / `.hero-section` (och kritisk CSS i `head.html`)
> läser bara tokenen. Detta ersatte de gamla `.home-section`/`.hero-section`
> padding-överskrivningarna som ignorerade layoutens rytm på små skärmar.

> **Blockrytm:** `block-gap` / `title-gap` / `label-gap` skalas av
> `--layout-prose-rhythm` (kolumn ×1 = no-op; editorial 1.25 = luftigare; index 0.8
> och terminal 0.9 = tätare). Kompositions-marginaler (about/works/contact-titlar,
> kort, project-info) läser dessa i stället för rå `--spacing`, vilket knyter
> blockrytmen till layouten. Komponent-interna småmarginaler (ikoner 4–8 px,
> specialsidor, `type-display` 160) lämnas på råa `--spacing`.

> **Hem-hero (index):** hero-sektionen bär redan `--layout-hero-rhythm`, så
> `--layout-hero-heading-top` staplade dubbelt utrymme ovanför leden. Index drar ned den till
> `var(--spacing-8)` (och editorial till `var(--spacing-24)`) så leden sitter nära toppen i stället
> för att flyta mitt på skärmen.

### B. Grid (horisontell)

| Token                    | Default (idag)         | Konsument                                                 |
| ------------------------ | ---------------------- | --------------------------------------------------------- |
| `--layout-col-gap`       | `var(--spacing-24)`    | `.page-grid` / `.use-subgrid` / `.grid-cols-2` column-gap |
| `--layout-row-gap`       | `var(--spacing-32)`    | `.page-grid` row-gap                                      |
| `--layout-default-place` | `8` (≈ `.place-prose`) | default kolumnspann för brödtext-block                    |

> Kolumn­*antalet* (12) lämnas oförändrat — variera **placering** via `.place-*` / `--col`,
> inte rasterupplösningen. Att byta 12→ annat är invasivt och onödigt.

### C. Satsbredd (measure)

| Token              | Default (idag)                | Konsument                          |
| ------------------ | ----------------------------- | ---------------------------------- |
| `--layout-measure` | `var(--measure-prose)` (70ch) | `typography.css` prose `max-width` |

### D. Typskala

| Token                  | Default (idag) | Konsument                                                                                       |
| ---------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `--layout-scale-ratio` | `1`            | multiplikator på display/heading clamp (redan finns som `--type-scale-display` i `home.css:82`) |

### E. Strukturella toggles (0/1, läses i selektorer)

| Token                 | Default | Effekt                                 |
| --------------------- | ------- | -------------------------------------- |
| `--layout-pullquotes` | `0`     | aktiverar pull-quote-utbrytning        |
| `--layout-dropcap`    | `0`     | anfang på första stycket               |
| `--layout-rule-style` | `none`  | linjal/divider-behandling mellan block |

---

## 2. "Lift list" — exakt vad som repekas (visuell no-op)

Varje rad: byt direkt primitiv-referens → `--layout-*`. Inga utseende­ändringar (defaults = dagens).

| Fil:rad                                     | Idag                                                   | Byt till                                                                              |
| ------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `assets/css/pages/home.css:11`              | `padding: var(--spacing-64) 0;`                        | `padding: var(--layout-section-rhythm) 0;`                                            |
| `assets/css/pages/home.css:74`              | hero `padding: var(--spacing-96) 0;`                   | `var(--layout-hero-rhythm) 0;`                                                        |
| `assets/css/pages/home.css:61`              | `.section-heading … margin-bottom: var(--spacing-32);` | `var(--layout-heading-gap);`                                                          |
| `assets/css/pages/home.css:26,31`           | `column-gap: var(--spacing-24);`                       | `var(--layout-col-gap);`                                                              |
| `assets/css/pages/home.css:79`              | `max-width: var(--content-max-width-narrow);`          | (lämna — hero-specifik)                                                               |
| `assets/css/pages/home.css:82`              | `* var(--type-scale-display)`                          | `* var(--layout-scale-ratio)` (alias `--type-scale-display` → `--layout-scale-ratio`) |
| `assets/css/utilities/grid.css:13`          | `.page-grid column-gap: var(--spacing-24);`            | `var(--layout-col-gap);`                                                              |
| `assets/css/utilities/grid.css:14`          | `.page-grid row-gap: var(--spacing-32);`               | `var(--layout-row-gap);`                                                              |
| `assets/css/utilities/grid.css:24,52`       | subgrid `column-gap: var(--spacing-24/16);`            | `var(--layout-col-gap);` (behåll sm-override)                                         |
| `assets/css/utilities/typography.css:425`   | `max-width: var(--measure-prose);`                     | `var(--layout-measure);`                                                              |
| `assets/css/utilities/_legacy-grid.css:5`   | `column-gap: 1.5rem;` **(rått värde)**                 | `var(--layout-col-gap);` ← enda äkta värde-extraktionen                               |
| `assets/css/style.css` `.content`           | `padding-top: var(--spacing-80);`                      | `var(--layout-content-top);` ✅                                                       |
| `assets/css/style.css` `.startpage-heading` | `padding-top: var(--spacing-80);`                      | `var(--layout-hero-heading-top);` ✅                                                  |
| `assets/css/style.css` `.about-cv`          | `margin-top: var(--spacing-64);`                       | `var(--layout-about-cv-gap);` ✅                                                      |
| `assets/css/style.css` `.contact-info`      | `margin-bottom: var(--spacing-64);`                    | `var(--layout-contact-info-gap);` ✅                                                  |

**Lämna orört:** `utilities/layout.css` `.flex { gap: 1rem }`, `.gap-xs/.gap-*` — det är en
generisk util-skala, inte komposition på sidnivå. Att koppla in dem ger brus utan vinst.

---

## 2b. Hero-radbrytning per layout × typografi (`pages/home.css`)

Rollen (`role-swapper`) släpps till egen rad när led + längsta roll slutar rymmas på en rad. Den
tidigare enda brytpunkten (`42.5em`) var kalibrerad för den stora hero-fonten och slog därför alltför
tidigt för **index** (vars hero är nedskruvad till `~text-lg`). Brytpunkten skalar nu med hero-fontens
storlek (layout) och typsnittets bredd (mono/technical bryter tidigast). Verifierat med Chrome-screenshots
mot längsta rollen vid gränsvidderna:

| Layout             | Bas (serif/sans/expressive) | + `technical` (mono) |
| ------------------ | --------------------------- | -------------------- |
| column (default)   | `≤ 38em`                    | `≤ 42em`             |
| editorial (1.15×)  | `≤ 42em`                    | `≤ 46em`             |
| index (`~text-lg`) | `≤ 26em`                    | `≤ 30em`             |

---

## 2c. Delbar komposition — `?theme=` (jfr §7 "seed")

Den delbara/reproducerbara seed som §7 pekar ut finns nu: knappen **"Share this look"** i
inställningspanelen kodar `layout, font (typography), mode, palette, pantone-år, blend, grain` till en
`?theme=`-parameter (`theme-share.js`). Avkodaren ligger i det inline-script i `partials/head.html` som
körs **före** första paint, så en delad länk målas rätt utan flash och persisteras till `localStorage`;
paramen städas därefter bort från adressfältet. Custom-palett är enhetslokal och utelämnas.

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
  --layout-heading-gap: var(--spacing-48);
  --layout-col-gap: var(--spacing-32);
  --layout-measure: var(--measure-wide); /* 45ch */
  --layout-scale-ratio: 1.18;
  --layout-default-place: col-start 3 / span 8; /* ≈ .place-article */
  --layout-pullquotes: 1;
  --layout-dropcap: 1;
  --layout-rule-style: hairline;
}
```

```css
/* dimensions/layout/index.css — tätt, modulärt, bild-framåt */
:root[data-layout="index"] {
  --layout-section-rhythm: var(--spacing-40);
  --layout-heading-gap: var(--spacing-16);
  --layout-col-gap: var(--spacing-16);
  --layout-row-gap: var(--spacing-16);
  --layout-measure: var(--measure-prose);
  --layout-scale-ratio: 0.95;
  --layout-default-place: col-start 1 / span 12; /* ≈ .place-full */
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
     applyLayout(layout); // setAttribute("data-layout", layout)
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
