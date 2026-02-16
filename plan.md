# Plan: Korrigera font-weight-tokens (ingen visuell förändring)

## Problem
`--sans-weight-bold` ändrades just från 500 → 600. Men alla ~20 ställen som refererar till den var designade för vikt 500. Allt blev visuellt fetare än avsett.

## Strategi
Inför `--sans-weight-medium: 500` (matchar CSS-standarden där 500 = "medium") och peka om alla befintliga referenser dit. Behåll `--sans-weight-bold: 600` för framtida/ny användning.

## Namnkonvention (följer CSS font-weight-spec)
| Token | Värde | Syfte |
|---|---|---|
| `--sans-weight-regular` | 400 | Brödtext (oförändrad) |
| `--sans-weight-medium` | 500 | **NY** — det som idag heter "bold" överallt |
| `--sans-weight-bold` | 600 | Riktig bold, tillgänglig vid behov |

## Ändringar

### 1. primitives.css — Lägg till medium-token
```css
--sans-weight-regular: 400;
--sans-weight-medium: 500;   /* NY */
--sans-weight-bold: 600;     /* redan ändrad */
```

### 2. Ändra alla befintliga `--sans-weight-bold`-referenser → `--sans-weight-medium`
Dessa ställen använder idag `--sans-weight-bold` men ska visuellt vara 500:

**Tokens/semantik:**
- `semantic.css:146` — `--heading-weight: var(--sans-weight-bold)` → `--sans-weight-medium`
- `editorial.css:14` — `--heading-weight: var(--sans-weight-bold)` → `--sans-weight-medium`

**Komponenter:**
- `button.css:53` — base button
- `form.css:405` — contact form submit
- `navigation.css:83` — top-menu link-button
- `footer.css:35` — footer headings
- `newsletter.css:81` — newsletter submit
- `table-of-contents.css:49` — toc items
- `table-of-contents.css:82` — toc active item
- `accordion.css:80` — accordion title
- `accordion.css:93` — accordion title open
- `language-dropdown.css:90` — language option
- `language-dropdown.css:114` — language option active

**Utilities/sidor:**
- `typography.css:487` — `.brand`
- `typography.css:497` — `.nav-link`
- `style.css:69` — `.startpage-heading__cta`
- `_temp-topmenu-redesign.css:55, 65` — topmenu redesign
- `ui-library.css:87, 349` — ui-library headings

### 3. Hardkodade `font-weight: 500` — valfritt tokenifiera
Dessa tre ställen har hårdkodat 500 (inte via token). Kan vid behov ändras till `var(--sans-weight-medium)`:
- `typography.css:126`
- `ui-library.css:508`
- `syntax.css:37`

### 4. Ingen övrig förändring
- `--sans-weight-bold: 600` finns kvar, redo att användas när riktig bold behövs
- Inga visuella förändringar — allt som var 500 förblir 500

## Resultat
Tre tydliga vikter, korrekt namngivna:
- **regular** (400) — brödtext
- **medium** (500) — UI-element, knappar, rubriker, navigering
- **bold** (600) — tillgänglig för starkare betoning vid behov
