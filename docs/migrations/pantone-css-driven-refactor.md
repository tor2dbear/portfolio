# Pantone CSS-driven Refactor

**Datum:** 2026-05-17
**Status:** Plan — ej påbörjad

## Bakgrund

Pantone COTY-systemet har tre lager som alla hanterar tokens vid olika tidpunkter:

1. **Hugo-template** (byggtid) → genererar `--coty-1..12` som CSS-attributselektorer
2. **coty-scale.js** (körtid, JS) → beräknar role-tokens, applicerar overrides, injicerar inline styles
3. **TOML overrides** (körtid, via JS) → år-specifika semantic-token-overrides

Inline styles har högre specificitet än CSS-regler, vilket kräver att JS aktivt rensar gamla värden vid år-byte. Testerna kan bara verifiera lager 1 direkt — lager 2 och 3 kräver att testlogiken reimplementerar JS-logiken, med risk för drift.

## Mål

- **Enkelt:** JS sätter bara `data-coty-year` och `data-mode`. Inga inline styles.
- **Tydligt:** CSS-filen är källan till sanning vid körtid. Läsbar och debuggbar.
- **Performant:** Inga tokens beräknas i JS — allt är redan i CSS när sidan laddas.
- **Flexibelt:** Lägga till 2027 innebär ett nytt TOML-block, ingenting annat.
- **Testbart:** Kontrasttester parsar genererad CSS direkt, ingen JS-logik dupliceras.

## Målarkitektur

```
TOML (källdata)
  └─ Hugo-template (byggtid)
       └─ coty-scales-generated.css
            ├── --coty-1..12          (primitiv skala, redan idag)
            ├── --coty-role-*         (NYT: role-tokens per år+mode)
            └── semantic overrides    (NYT: --surface-page, --border-* etc.)

coty-scale.js (körtid)
  ├── Metadata: år, namn, isDuo      (Hugo-genererat JS-konstant)
  ├── Sätter data-coty-year
  ├── Sätter data-mode
  └── Palette player UI
```

JS injicerar **inga** inline styles. CSS-kaskaden hanterar allt.

## TOML-tillägg som krävs

### 1. `anchor_step` för alla 27 år

Idag saknar 20 av 27 år ett explicit `anchor_step`. JS beräknar det via
`resolveAnchorStep()` (source-färgens L-värde mot LIGHT_L-kurvan). Dessa
behöver läggas till explicit i TOML.

**År som saknar anchor_step:**
2000, 2001, 2002, 2003, 2005, 2007, 2008, 2010, 2011, 2012, 2013, 2014,
2015, 2017, 2018, 2019, 2020, 2022, 2023, 2025

Bestäm steg genom att hitta vilket `scale_light`-steg som är närmast
source-färgens hex-värde (källsteg = steg vars L-värde är närmast hex-L).

### 2. `on_primary_step` (light och dark) för alla 27 år

JS beräknar om knapptext ska vara `--coty-1` eller `--coty-12` via
kontrastjämförelse mot primary-steget. Enkelt att avgöra och koda explicit:

```toml
on_primary_step_light = 1   # ljus text på mörk primary-knapp
on_primary_step_dark  = 12  # mörk text på ljus primary-knapp
```

### 3. `role_mode` för "auto"-år

12 år saknar explicit `role_mode`. JS väljer "primary" om source-hex ger
≥ 4.5:1 kontrast mot vitt. Dessa år är alla mid-to-dark mättade färger
som passar som primary. Sätt `role_mode = "primary"` explicit.

**År utan role_mode:** 2001, 2002, 2007, 2008, 2015, 2017, 2018, 2019,
2020, 2022, 2023, 2025

## Hugo-template: vad som ska genereras

Utöka `assets/templates/coty-scales.css` med role-tokens och overrides
per år och mode.

### Light-block (utökat)

```css
:root[data-palette="pantone"][data-coty-year="{{ $year }}"] {
  /* Primitiv skala — redan idag */
  --coty-1: {{ .scale_light["1"] }};
  /* ... */
  --coty-12: {{ .scale_light["12"] }};

  /* Role-tokens — NYT */
  {{ if eq .role_mode "surface" }}
  --coty-role-surface:        var(--coty-{{ .anchor_step }});
  --coty-role-surface-strong: var(--coty-{{ add .anchor_step 1 }});
  --coty-role-primary:        var(--coty-9);
  --coty-role-primary-strong: var(--coty-11);
  --coty-role-on-primary:     var(--coty-{{ .on_primary_step_light }});
  {{ else }}
  --coty-role-primary:        var(--coty-{{ .anchor_step }});
  --coty-role-primary-strong: var(--coty-11);
  --coty-role-on-primary:     var(--coty-{{ .on_primary_step_light }});
  --coty-role-surface:        var(--coty-4);
  --coty-role-surface-strong: var(--coty-5);
  {{ end }}

  /* Semantic overrides — NYT */
  {{ range $key, $val := .overrides_light }}
  --{{ replace $key "_" "-" }}: {{ $val }};
  {{ end }}
}
```

### Dark-block (utökat på samma vis)

Separata role-token-beräkningar för dark mode baserat på `scale_dark`
och inverterade steg (anchor_step i dark = `source_step_dark` från TOML).

### Secondary-scale (duo-år: 2016, 2021)

Redan implementerat för `secondary_scale_light` och `secondary_scale_dark`.
Lägg till secondary role-tokens på samma vis.

## coty-scale.js efter refaktor

### Vad som tas bort

- `resolveRoleTokens()` — beräknas i CSS
- `buildScale()` / `getExplicitScaleForMode()` — behövs ej
- `normalizeScaleDefinition()` — behövs ej
- `PANTONE_RUNTIME_TOKEN_NAMES` — inline styles injiceras inte längre
- All inline `style.setProperty()` för token-injektion
- `clearPantoneRuntimeTokens()` inline-rensning (data-attribut räcker)
- `applyPreviewTokens()` — preview-tokens går via CSS eller `getComputedStyle`

### Vad som finns kvar

```js
// Hugo-genererat vid byggtid
var COTY_YEARS = [
  { year: 2026, name: "Cloud Dancer", isDuo: false },
  { year: 2021, name: "Ultimate Gray / Illuminating", isDuo: true },
  // ...
];

function applyCoty(year, mode) {
  var root = document.documentElement;
  root.setAttribute("data-coty-year", String(year));
  // data-mode hanteras av befintlig mode-logik
  persistCoty(year, mode);
}

function clearCoty() {
  document.documentElement.removeAttribute("data-coty-year");
}
```

Plus befintlig palette player UI-kod (prev/next/shuffle/play).

## Teststrategin efter refaktor

Med all token-resolution i CSS försvinner drift-problemet.

### Nytt testupplägg

```js
// coty-contrast.test.js — ny approach
function loadGeneratedCSS() {
  // Läs assets/css/coty-scales-generated.css (eller bygg den i testet)
  // Parsa alla :root[data-coty-year="YYYY"] block
  // Bygg tokenMap per år+mode
}

const PAIRS = [
  {
    text: "--text-default",
    bg: "--surface-page",
    ratio: 4.5,
    label: "body text",
  },
  { text: "--text-accent", bg: "--surface-accent", ratio: 4.5, label: "tag" },
  {
    text: "--text-default",
    bg: "--surface-default",
    ratio: 4.5,
    label: "card text",
  },
  {
    text: "--on-primary",
    bg: "--primary",
    ratio: 3.0,
    label: "primary button",
  },
];
```

Testet löser token-kedjor direkt i CSS-datan. Ingen JS-logik dupliceras.
Nya token-par är triviala att lägga till.

## Migrationssteg

### Fas 1 — TOML kompletteras

Lägg till `anchor_step`, `on_primary_step_light`, `on_primary_step_dark`
och explicit `role_mode` för alla år. Inga kodändringar — bara data.
Verifiera med befintliga tester.

### Fas 2 — Hugo-template utökas

Generera role-tokens och semantic overrides i CSS-blocken.
JS injicerar fortfarande samma saker — inga JS-ändringar ännu.
Verifiera visuellt att ingenting ändrats (inline styles override CSS).

### Fas 3 — JS slutar injicera

Ta bort inline style-injektion i `applyForMode`. CSS tar över.
Verifiera visuellt och med tester.

### Fas 4 — JS-rensning

Ta bort `resolveRoleTokens`, `buildScale` och relaterade funktioner.
Uppdatera tester till CSS-parsing.

### Fas 5 — Testutökning

Lägg till fler token-par (tag, card, etc.) i kontrasttesterna.
Verifiera alla 27 × 2 × N par.

## Vad som inte ändras

- TOML-formatet i övrigt (scale_light, scale_dark, overrides-struktur)
- pantone.css semantiska token-definitioner
- Preload-strategin för coty-scales-generated.css
- Palette generator (separat system, berörs ej)
- Alla 347 befintliga tester ska passera genom hela migrationen

## Risker

**anchor_step auto-resolution:** 20 år behöver rätt steg bestämmas manuellt.
Fel steg ger felaktig role-token → visuell regression. Verifiera steg för
steg mot nuvarande rendering.

**Overrides i CSS vs inline:** I fas 2 (template utökas men JS finns kvar)
har inline styles fortfarande högre specificitet. Inga konflikter uppstår
men det är redundant. Löses i fas 3.

**dark mode role-logic:** Dark mode har ibland inverserade roller jämfört
med light. Säkerställ att dark-blocken i templaten beräknar rätt steg
(anchor från `source_step_dark`, inte `anchor_step`).
