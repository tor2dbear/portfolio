# Plan: Färgtoken-omstrukturering

**Baserad på:** COLOR_TOKEN_REVIEW.md + konversationsbeslut 2026-02-16/17
**Scope:** Semantiska tokens, komponent-CSS, palette-filer, mode-filer
**Utanför scope:** Palette-generator (JS), primitiver

---

## Verifierat nuläge (korrigeringar mot review)

Dessa saker har redan åtgärdats eller visar sig vara annorlunda än reviewen antog:

- ✅ **Tooltip** redan tokeniserad (`--bg-inverse` / `--text-inverse`)
- ✅ **Disabled i buttons/forms** redan opacity-baserad (0.6) — inga token-baserade färgbyten
- ✅ **`--sans-weight-bold`** redan 600 i primitives.css
- ✅ **`--sans-weight-medium`**-referenser i toc.css redan ändrade till `--sans-weight-bold`
- ⚠️ **`--text-disabled`, `--bg-disabled`, `--border-disabled`** är INTE definierade — de existerar bara som swatches i ui-library/single.html
- ⚠️ **`_temp-topmenu-redesign.css`** är inte importerad någonstans — helt död fil

---

## Beslut tagna

| #   | Fråga                                     | Beslut                                                                       |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Slå ihop `--brand-*` + `--accent-*`?      | Ja → `--primary` / `--secondary`                                             |
| 2   | Prefix: `--bg-*` → `--surface-*`?         | Ja                                                                           |
| 3   | Ta bort `_temp-topmenu-redesign.css`?     | Ja (dead code)                                                               |
| 4   | Tertiary accent?                          | Nej — behövs inte                                                            |
| 5   | `--status-warning-*` / `--status-info-*`? | Behåll (framtida behov), ta bort `--status-*-icon`                           |
| 6   | Disabled-strategi?                        | Opacity-only (redan implementerat)                                           |
| 7   | `--border-interactive` (steg 7)?          | Nej — onödigt med nuvarande 2-stegs-modell                                   |
| 8   | Tag-tokens?                               | Behåll i semantiska lagret (roll, inte komponent)                            |
| 9   | Nav-tokens (`--bg-nav`, `--text-nav`)?    | Ta bort (dead i produktion)                                                  |
| 10  | `--primary-hover`?                        | Nej — state-overlays täcker det                                              |
| 11  | `--border-hover`?                         | Ta bort — ersätt med `--border-strong`                                       |
| 12  | `--outline-neutral`?                      | Ta bort — ersätt med `--border-subtle`                                       |
| 13  | Border-förenkling?                        | 3 tokens: subtle, default, strong — egen kategori                            |
| 14  | Toast glassmorphism?                      | Tokenisera via component-tokens                                              |
| 15  | `--sans-weight-medium`?                   | Lägg till som 500, mappa om befintliga `--sans-weight-bold`-referenser       |
| 16  | Palette-generator border-steg?            | Out of scope (se separat sektion nedan)                                      |
| 17  | Borders — gray-låsta?                     | Nej — ska deriveras från surface-familj, inte fast gray                      |
| 18  | `--surface-ink-strong` — roll?            | Behåll under surface (surface-familjens mörka representant)                  |
| 19  | `--component-nav-cta-*`?                  | Behåll som component-tokens (duo-mode kräver det)                            |
| 20  | `--on-secondary`?                         | Ny token behövs (text på secondary-ytor)                                     |
| 21  | Fas 6 — status-klasser?                   | Ny fil `utilities/status-messages.css`                                       |
| 22  | Fas 7 — uppdelning?                       | Två separata commits: 7a (surface-rename) sedan 7b (primary/secondary-merge) |

---

## PR-strategi (uppdelad leverans)

Detta arbete delas i flera PR:er for att minska regressionsrisk och gora QA/review hanterbar.

### Status 2026-02-19

1. PR A ar genomford (fas 1-5 + border-overrides + verifiering).
2. PR B ar genomford (fas 6):
   - `assets/css/utilities/status-messages.css` finns och ar inkopplad.
3. PR C (naming migration) ar paborjad:
   - canonical `--primary/--secondary` ar etablerade i runtime och derivation.
   - `--on-secondary` ar inford i generatorflode och override-UI.
   - state-tokener ar canonicaliserade (`state-primary-*`) med legacy alias kvar.
4. Legacy alias finns fortfarande avsiktligt for bakatkompatibilitet och ska stadas i senare steg nar referenser ar helt migrerade.

### PR A (nasta steg): `refactor/color-token-consistency-followup`

Fokus: token-konsistens som direkt stoder Pantone Lab QA och den nyligen stabiliserade baseline.

Avgransning mot Pantone-kontroller:

1. `COTY role mode` och `COTY anchor step` behalls som de ar i baseline (inga nya beteendeforandringar i PR A).
2. PR A fokuserar pa token-konsistens, inte pa ny Pantone-heuristik.

**Inkludera i PR A:**

1. Fas 1-5 (utan stora namnbyten):

- trasiga tokenreferenser
- `--sans-weight-medium` + ommappning
- dead code/uppenbart oanvanda tokenreferenser enligt listan
- hardkodade varden -> tokens (toast/tabs/footer)
- button-semantikfixar (utan global rename)

2. Border-sparet pa kort sikt:

- manuella border-overrides i palette-filer (`--border-default`, `--border-strong`) for `mesa`, `forest`, `pantone`

3. Verifiering:

- lint/test + visuell QA pa representativa komponenter (form, buttons, tabs, toast, nav CTA, taggar)

**Inte i PR A:**

1. Fas 6 (status-konsolidering till ny shared utility-fil)
2. Fas 7a/7b/7c (stor namnkonventionsmigrering)
3. Full repo-wide cleanup av legacy/oanvanda tokens

### PR B: status-konsolidering

Fokus: Fas 6.

1. Ny `utilities/status-messages.css`
2. Mall/CSS-uppdateringar till gemensamma status-klasser
3. Enhetlig fallback-policy (utan naming-migrering)

### PR C: naming migration (hog risk)

Fokus: Fas 7a + 7b + 7c.

1. `--bg-*` -> `--surface-*`
2. `--brand/*accent` -> `--primary/--secondary` + `--on-secondary`
3. State-token rename (`brand` -> `primary`)
4. Uppdatering i CSS, JS (`theme-derive.js`, `palette-generator.js`) och UI-library dokumentation

Nuvarande delstatus for PR C:

1. Delvis klar: canonical runtime + UI docs + `on-secondary`.
2. Kvar: slutlig repo-wide cleanup av legacy alias och sista referenser enligt migreringstabellerna.

### Why this split

1. Mindre PR:er blir enklare att verifiera och backa vid regression.
2. Pantone Lab kan fortsatt anvandas/stabiliseras mellan stegen.
3. Stor naming-migrering isoleras till sist nar funktionell kvalitet redan ar sakrad.

---

## Målbild: Token-kategorier

```
SURFACE (ytor — deriveras från surface-familj)
├── --surface-page
├── --surface-default
├── --surface-subtle
├── --surface-elevated
├── --surface-inverse
├── --surface-tag
├── --surface-tag-hover
├── --surface-headline
└── --surface-ink-strong

TEXT (textfärger — deriveras från text-familj + blandningar)
├── --text-default
├── --text-muted              (gray-11 × surface-ink blandning)
├── --text-inverse
├── --text-link               (pekar på primary-familj)
├── --text-link-hover
├── --text-accent
└── --text-tag                (pekar på surface-familj)

PRIMARY (accentfärg — deriveras från primary-familj)
├── --primary
├── --primary-strong
└── --on-primary

SECONDARY (sekundär accent — deriveras från secondary-familj)
├── --secondary
├── --secondary-strong
└── --on-secondary            ← NY

BORDER (egen kategori — ska deriveras från surface-familj)
├── --border-subtle
├── --border-default
└── --border-strong

STATE (overlays — beräknade, inte en "färgroll")
├── --state-page-hover/active
├── --state-surface-hover/active
├── --state-primary-hover/active   (← brand-hover/active)
├── --state-focus
└── --state-selected

STATUS (fasta funktionsfärger — oberoende av palette)
├── error   (bg/border/text)
├── success (bg/border/text)
├── warning (bg/border/text)
└── info    (bg/border/text)
```

7 kategorier: 5 palette-beroende (surface, text, primary, secondary, border) + 2 fristående (state, status).

---

## Faser

### Fas 1: Fixa trasiga referenser (ingen visuell förändring)

Dessa token-namn refereras men finns inte som definierade variabler.

| Fil        | Rad      | Nuvarande               | Ersätt med           |
| ---------- | -------- | ----------------------- | -------------------- |
| `form.css` | 207      | `--radius-xs`           | `--radius-4`         |
| `form.css` | 334, 340 | `--font-size-sm`        | `--text-sm`          |
| `form.css` | 336, 342 | `--line-height-relaxed` | `--line-height-wide` |

### Fas 2: Lägg till `--sans-weight-medium` + mappa om (ingen visuell förändring)

Alla nuvarande `--sans-weight-bold`-referenser designades för vikt 500 men pekar nu på 600.
Lägg till `--sans-weight-medium: 500` och peka om.

**primitives.css** — Lägg till:

```css
--sans-weight-regular: 400;
--sans-weight-medium: 500; /* NY */
--sans-weight-bold: 600; /* redan ändrad */
```

**Filer att ändra `--sans-weight-bold` → `--sans-weight-medium`:**

Tokens/semantik:

- `semantic.css:146` — `--heading-weight`
- `editorial.css` — `--heading-weight` (om den finns)

Komponenter:

- `button.css:53`
- `form.css:405` (contact form submit)
- `navigation.css:83`
- `footer.css:35`
- `newsletter.css:81`
- `table-of-contents.css:49, 82`
- `accordion.css:80, 93`
- `language-dropdown.css:90, 114`

Utilities/sidor:

- `typography.css:487, 497`
- `style.css:69`
- `ui-library.css:87, 349`

Hardkodade `font-weight: 500` (tokenisera till `--sans-weight-medium`):

- `typography.css:126`
- `ui-library.css:508`
- `syntax.css:37`

### Fas 3: Ta bort dead code och oanvända tokens

**Ta bort fil:**

- `_temp-topmenu-redesign.css`

**Ta bort från `semantic.css`:**

- `--border-hover` (rad 37) — ersätt 4 användningar i form.css med `--border-strong`
- `--outline-neutral` (rad 38) — ersätt 1 användning i pagination.css med `--border-subtle`
- `--border-radius-sm` (rad 39) — ersätt med `--radius-4` i newsletter.css och footer.css
- `--status-error-icon` (rad 123)
- `--status-success-icon` (rad 128)
- `--status-warning-icon` (rad 133)
- `--status-info-icon` (rad 138)
- `--state-tag-hover` (rad 66)
- `--state-tag-active` (rad 67)
- `--bg-nav` (rad 27) + ta bort från mesa.css, forest.css, pantone.css
- `--text-nav` (rad 15) + ta bort från mesa.css, forest.css, pantone.css
- Legacy-aliaser: `--state-on-light-hover/active` (rad 54-55) — byt `--state-page-hover/active` till inline-uttryck
- Legacy-aliaser: `--state-on-dark-hover/active` (rad 56-57) — byt `--state-brand-hover/active` till inline-uttryck

**Ta bort från `components.css`:**

- `--component-form-border` (rad 15)

**Ta bort från `light.css`:**

- `--outline-neutral` override (om den finns)

**Ta bort från `ui-library/single.html`:**

- Swatches för `--text-disabled`, `--bg-disabled`, `--border-disabled`, `--bg-nav`, `--text-nav`

**Ersättningar i komponent-CSS:**
| Fil | Rad | Nuvarande | Ersätt med |
|-----|-----|-----------|-----------|
| `form.css` | 161 | `--border-hover` | `--border-strong` |
| `form.css` | 243 | `--border-hover` | `--border-strong` |
| `form.css` | 299 | `--border-hover` | `--border-strong` |
| `form.css` | ~140 (radio hover) | `--border-hover` | `--border-strong` |
| `pagination.css` | 37 | `--outline-neutral` | `--border-subtle` |
| `newsletter.css` | ~125 | `--border-radius-sm` | `--radius-4` |
| `footer.css` | ~126 | `--border-radius-sm` | `--radius-4` |

### Fas 4: Tokenisera hardkodade värden

**Toast** (glassmorphism → component-tokens):

Lägg till i `components.css`:

```css
--component-toast-bg: color-mix(in srgb, var(--bg-page) 52%, transparent);
--component-toast-border: color-mix(
  in srgb,
  var(--text-default) 6%,
  transparent
);
```

Lägg till i `dark.css`:

```css
--component-toast-bg: color-mix(in srgb, var(--gray-1) 52%, transparent);
--component-toast-border: color-mix(in srgb, var(--white) 8%, transparent);
```

Uppdatera `toast.css`:

- Rad 30: `background: rgba(...)` → `background: var(--component-toast-bg)`
- Rad 31: `border: 1px solid rgba(...)` → `border: 1px solid var(--component-toast-border)`
- Rad 74: `font-weight: 600` → `font-weight: var(--sans-weight-bold)`
- Ta bort `[data-mode="dark"] .toast` (rad 87-90)

**Tabs**:

- Rad 21: `font-size: 0.875rem` → `font-size: var(--text-sm)`
- Rad 22: `font-weight: 600` → `font-weight: var(--sans-weight-bold)`

**Footer**:

- Rad 96: `border: 1px solid var(--text-default)` → `border: 1px solid var(--border-strong)`

### Fas 5: Fixa button token-semantik

**Bas-button** (rad 50-51):

```css
/* Nuvarande — inverterade token-roller */
background-color: var(--text-default);
color: var(--bg-page);

/* Nytt — korrekt semantik */
background-color: var(--bg-inverse);
color: var(--text-inverse);
```

> **OBS:** `--component-nav-cta-bg/text` behålls som de är. Default-läget pekar på
> `text.default`/`surface.page` (= inverse), men duo-mode pekar om till `primary.base`/`primary.on`.
> Att byta till `--bg-inverse`/`--text-inverse` här vore fel — det bryter duo-teman.
> Component-token-lagret är rätt abstraktion för nav CTA.

**Secondary hover** (button.css rad 118-121):

```css
/* Nuvarande — solid bg */
background-color: var(--bg-surface);

/* Nytt — state-overlay (konsekvent med active) */
background-image: linear-gradient(
  var(--state-surface-hover),
  var(--state-surface-hover)
);
```

Ta bort `background-color: var(--bg-surface)` och ersätt med overlay-mönstret.

**Tertiary hover** (button.css rad 140-143):

```css
/* Nuvarande — solid bg */
background-color: var(--bg-surface);

/* Nytt — state-overlay */
background-image: linear-gradient(
  var(--state-page-hover),
  var(--state-page-hover)
);
```

### Fas 6: Konsolidera status-meddelande-CSS

**Problem:** Identisk status-meddelande-styling duplicerad i 3 filer.

Skapa ny fil `utilities/status-messages.css`:

```css
.message--success {
  background-color: var(--status-success-bg);
  color: var(--status-success-text);
  border: 1px solid var(--status-success-border);
}
.message--error {
  background-color: var(--status-error-bg);
  color: var(--status-error-text);
  border: 1px solid var(--status-error-border);
}
```

Uppdatera HTML-templates att använda dessa klasser istället.

**Ta bort alla fallbacks** — tokens definieras alltid centralt:

- `form.css:427, 433-435` — ta bort `, hsl(...)` fallbacks
- `newsletter.css:130-132, 137` — ta bort fallbacks
- `footer.css:131-133, 137-139` — ta bort fallbacks

### Fas 7: Byt namnkonvention (breaking change — stor fas)

> **Rekommendation:** Gör 7a och 7b som separata commits.
> 7a är mekanisk find-replace. 7b kräver mer eftertanke kring JS-derivation.

#### 7a: `--bg-*` → `--surface-*` (separat commit)

| Nuvarande               | Nytt                  |
| ----------------------- | --------------------- |
| `--bg-page`             | `--surface-page`      |
| `--bg-surface`          | `--surface-default`   |
| `--bg-surface-subtle`   | `--surface-subtle`    |
| `--bg-elevated`         | `--surface-elevated`  |
| `--bg-inverse`          | `--surface-inverse`   |
| `--bg-tag`              | `--surface-tag`       |
| `--bg-tag-hover`        | `--surface-tag-hover` |
| `--bg-section-headline` | `--surface-headline`  |

#### 7b: Slå ihop `--brand-*` + `--accent-*` → `--primary` / `--secondary` (separat commit)

| Nuvarande                              | Nytt                  |
| -------------------------------------- | --------------------- |
| `--accent-primary` / `--brand-primary` | `--primary`           |
| `--accent-primary-strong`              | `--primary-strong`    |
| `--brand-on-primary`                   | `--on-primary`        |
| `--brand-container`                    | Ta bort (oanvänd)     |
| `--brand-on-container`                 | Ta bort (oanvänd)     |
| `--accent-secondary`                   | `--secondary`         |
| `--accent-secondary-strong`            | `--secondary-strong`  |
| (saknas)                               | `--on-secondary` ← NY |

#### 7c: State-tokens uppdatering (del av 7b-commit)

| Nuvarande              | Nytt                     |
| ---------------------- | ------------------------ |
| `--state-brand-hover`  | `--state-primary-hover`  |
| `--state-brand-active` | `--state-primary-active` |
| `--state-mix-brand-*`  | `--state-mix-primary-*`  |

#### 7d: Filer som påverkas

**Token-filer:**

- `semantic.css` — alla definitioner
- `components.css` — newsletter-tokens
- `light.css`, `dark.css` — mode-overrides

**Palette-filer:**

- `standard.css`, `mesa.css`, `forest.css`, `pantone.css` + previews

**Komponent-CSS** (alla som refererar `--bg-*`, `--brand-*`, `--accent-*`):

- button, form, radio, checkbox, select, navigation, accordion, tabs, tags,
  toggle-switch, language-dropdown, theme-dropdown, settings-dropdown,
  footer, newsletter, toc, pagination, toast, chord-hud, grid-overlay,
  download-card, print-button, summary-card, breadcrumb

**JS-filer:**

- `theme-derive.js` — token-namn i derivation
- `palette-generator.js` — token-namn i output

**Layout/Templates:**

- `ui-library/single.html` — swatches
- Eventuella Hugo-partials med inline styles

---

## Ordning och riskbedömning

| Fas | Risk    | Visuell påverkan                                                             | Commits |
| --- | ------- | ---------------------------------------------------------------------------- | ------- |
| 1   | Ingen   | Ingen (fixar undefined tokens)                                               | 1       |
| 2   | Låg     | Ingen (500 → 500, bara tokennamn ändras)                                     | 1       |
| 3   | Låg     | Ingen (tar bort dead code)                                                   | 1       |
| 4   | Medel   | Minimal (toast/tabs ska se likadana ut, footer border marginellt annorlunda) | 1       |
| 5   | Medel   | Ingen (samma visuella värden, korrekt semantik)                              | 1       |
| 6   | Låg     | Ingen (DRY-refactor)                                                         | 1       |
| 7a  | Medel   | Ingen (ren rename)                                                           | 1       |
| 7b  | **Hög** | Ingen (ren rename), men kräver JS-ändringar                                  | 1       |

**Rekommendation:** Fas 1-6 kan implementeras sekventiellt i en session. Fas 7a sedan 7b som separata steg med verifiering emellan.

---

## Utanför scope — men kopplat

### Border-tokens i palette-filer och palette-generator

**Beslut:** Borders ska inte vara gray-låsta. De ska deriveras från surface-familjen.

**Nuläge:** Enbart `--border-subtle` override:as i palette-filer (mesa → amber-5, forest → green-5, pantone → cloud-5). `--border-default` och `--border-strong` förblir gray-6/gray-8 oavsett palette.

**Behövs:**

1. **Manuella overrides i palette-filer** — Lägg till `--border-default` och `--border-strong` i mesa.css, forest.css, pantone.css med surface-familjens steg 6 och 8:

   | Palette | `--border-default` | `--border-strong` |
   | ------- | ------------------ | ----------------- |
   | mesa    | `var(--amber-6)`   | `var(--amber-8)`  |
   | forest  | `var(--green-6)`   | `var(--green-8)`  |
   | pantone | `var(--cloud-6)`   | `var(--cloud-8)`  |

2. **Palette-generator** — Utöka `derivePaletteTokens()` i theme-derive.js med steg för `--border-default` (surface-familj steg 6) och `--border-strong` (surface-familj steg 8).

**Varför separat:** Punkt 1 kan göras snabbt som en del av denna puck om önskvärt. Punkt 2 kräver ändringar i palette-generatorn (JS) som är markerad out of scope.

---

## Alla frågor besvarade

Inga öppna frågor kvarstår. Alla beslut dokumenterade ovan.
