# Plan: Färgtoken-omstrukturering

**Baserad på:** COLOR_TOKEN_REVIEW.md + konversationsbeslut 2026-02-16/17
**Scope:** Semantiska tokens, komponent-CSS, palette-filer, mode-filer
**Utanför scope:** Palette-generator (JS), prisma-primitiver

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

| # | Fråga | Beslut |
|---|-------|--------|
| 1 | Slå ihop `--brand-*` + `--accent-*`? | Ja → `--primary` / `--secondary` |
| 2 | Prefix: `--bg-*` → `--surface-*`? | Ja |
| 3 | Ta bort `_temp-topmenu-redesign.css`? | Ja (dead code) |
| 4 | Tertiary accent? | Nej — behövs inte |
| 5 | `--status-warning-*` / `--status-info-*`? | Behåll (framtida behov), ta bort `--status-*-icon` |
| 6 | Disabled-strategi? | Opacity-only (redan implementerat) |
| 7 | `--border-interactive` (steg 7)? | Nej — onödigt med nuvarande 2-stegs-modell |
| 8 | Tag-tokens? | Behåll i semantiska lagret (roll, inte komponent) |
| 9 | Nav-tokens (`--bg-nav`, `--text-nav`)? | Ta bort (dead i produktion) |
| 10 | `--primary-hover`? | Nej — state-overlays täcker det |
| 11 | `--border-hover`? | Ta bort — ersätt med `--border-strong` |
| 12 | `--outline-neutral`? | Ta bort — ersätt med `--border-subtle` |
| 13 | Border-förenkling? | 3 tokens: subtle, default, strong |
| 14 | Toast glassmorphism? | Tokenisera via component-tokens |
| 15 | `--sans-weight-medium`? | Lägg till som 500, mappa om befintliga `--sans-weight-bold`-referenser |
| 16 | Palette-generator border-steg? | Out of scope |

---

## Faser

### Fas 1: Fixa trasiga referenser (ingen visuell förändring)

Dessa token-namn refereras men finns inte som definierade variabler.

| Fil | Rad | Nuvarande | Ersätt med |
|-----|-----|-----------|-----------|
| `form.css` | 207 | `--radius-xs` | `--radius-4` |
| `form.css` | 334, 340 | `--font-size-sm` | `--text-sm` |
| `form.css` | 336, 342 | `--line-height-relaxed` | `--line-height-wide` |

### Fas 2: Lägg till `--sans-weight-medium` + mappa om (ingen visuell förändring)

Alla nuvarande `--sans-weight-bold`-referenser designades för vikt 500 men pekar nu på 600.
Lägg till `--sans-weight-medium: 500` och peka om.

**primitives.css** — Lägg till:
```css
--sans-weight-regular: 400;
--sans-weight-medium: 500;   /* NY */
--sans-weight-bold: 600;     /* redan ändrad */
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
--component-toast-border: color-mix(in srgb, var(--text-default) 6%, transparent);
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

**Nav CTA** (semantic.css rad 114-115):
```css
/* Nuvarande */
--component-nav-cta-bg: var(--text-default);
--component-nav-cta-text: var(--bg-page);

/* Nytt */
--component-nav-cta-bg: var(--bg-inverse);
--component-nav-cta-text: var(--text-inverse);
```

**Secondary hover** (button.css rad 118-121):
```css
/* Nuvarande — solid bg */
background-color: var(--bg-surface);

/* Nytt — state-overlay (konsekvent med active) */
background-image: linear-gradient(var(--state-surface-hover), var(--state-surface-hover));
```
Ta bort `background-color: var(--bg-surface)` och ersätt med overlay-mönstret.

**Tertiary hover** (button.css rad 140-143):
```css
/* Nuvarande — solid bg */
background-color: var(--bg-surface);

/* Nytt — state-overlay */
background-image: linear-gradient(var(--state-page-hover), var(--state-page-hover));
```

### Fas 6: Konsolidera status-meddelande-CSS

**Problem:** Identisk status-meddelande-styling duplicerad i 3 filer.

Skapa gemensamma utility-klasser i en lämplig plats (t.ex. `utilities/status-messages.css` eller liknande):
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

> **OBS:** Denna fas påverkar ~20+ komponentfiler, alla palette-filer, JS-filer (theme-derive.js, palette-generator.js), och eventuellt Hugo-templates. Bör göras som en separat commit/PR eller brytas ned ytterligare.

#### 7a: `--bg-*` → `--surface-*`

| Nuvarande | Nytt |
|-----------|------|
| `--bg-page` | `--surface-page` |
| `--bg-surface` | `--surface-default` |
| `--bg-surface-subtle` | `--surface-subtle` |
| `--bg-elevated` | `--surface-elevated` |
| `--bg-inverse` | `--surface-inverse` |
| `--bg-tag` | `--surface-tag` |
| `--bg-tag-hover` | `--surface-tag-hover` |
| `--bg-section-headline` | `--surface-headline` |

#### 7b: Slå ihop `--brand-*` + `--accent-*` → `--primary` / `--secondary`

| Nuvarande | Nytt |
|-----------|------|
| `--accent-primary` / `--brand-primary` | `--primary` |
| `--accent-primary-strong` | `--primary-strong` |
| `--brand-on-primary` | `--on-primary` |
| `--brand-container` | Ta bort (oanvänd) |
| `--brand-on-container` | Ta bort (oanvänd) |
| `--accent-secondary` | `--secondary` |
| `--accent-secondary-strong` | `--secondary-strong` |

#### 7c: State-tokens uppdatering

| Nuvarande | Nytt |
|-----------|------|
| `--state-brand-hover` | `--state-primary-hover` |
| `--state-brand-active` | `--state-primary-active` |
| `--state-mix-brand-*` | `--state-mix-primary-*` |

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

| Fas | Risk | Visuell påverkan | Commits |
|-----|------|-----------------|---------|
| 1 | Ingen | Ingen (fixar undefined tokens) | 1 |
| 2 | Låg | Ingen (500 → 500, bara tokennamn ändras) | 1 |
| 3 | Låg | Ingen (tar bort dead code) | 1 |
| 4 | Medel | Minimal (toast/tabs ska se likadana ut, footer border marginellt annorlunda) | 1 |
| 5 | Medel | Ingen (samma visuella värden, korrekt semantik) | 1 |
| 6 | Låg | Ingen (DRY-refactor) | 1 |
| 7 | **Hög** | Ingen (ren rename), men stort antal filer | 1-2 |

**Rekommendation:** Fas 1-6 kan implementeras sekventiellt i en session. Fas 7 bör diskuteras och eventuellt brytas ned i delfaser (7a separat från 7b etc.).

---

## Öppna frågor

1. **Fas 6 — var ska shared status-klasser bo?** Ny fil `utilities/status-messages.css` eller i befintlig utility-fil?
2. **Fas 7 — allt i ett eller delfaser?** `--bg-*` → `--surface-*` kan göras oberoende av brand/accent-ihopslagningen.
3. **`--surface-ink-strong`** — Behålla under surface-gruppen eller byta till `--primary-ink`? (Den pekar på iris-11 och används för state-overlays.)
4. **`--component-nav-cta-*`** — Behövs dessa som separata component-tokens, eller ska nav CTA bara använda `--surface-inverse` / `--text-inverse` direkt? (Samma värden idag.)
