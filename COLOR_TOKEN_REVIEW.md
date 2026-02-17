# Color Token Review — Komplett analys

**Datum:** 2026-02-16
**Scope:** Alla 23 komponentfiler, 3 token-lager (primitives → semantic → components), 2 mode-filer (light/dark), 5 palette-filer

---

## 1. Arkitekturöversikt

### Token-lager (3-tier)

```
┌─────────────────────────────────────────────────────────────┐
│  PRIMITIVES  (tokens/primitives.css)                        │
│  Råa värden: färgskalor, typsnitt, spacing, radier          │
│  Aldrig ändrade av teman                                    │
├─────────────────────────────────────────────────────────────┤
│  SEMANTIC    (tokens/semantic.css)                           │
│  Rollbaserade tokens: --text-default, --bg-page, etc.       │
│  Refererar till primitives                                  │
├─────────────────────────────────────────────────────────────┤
│  COMPONENT   (tokens/components.css)                        │
│  Undantag per komponent: --component-form-bg, etc.          │
│  "Use sparingly"                                            │
└─────────────────────────────────────────────────────────────┘
```

### Dimensioner (theme-axes)

| Dimension   | Filer | Vad de gör |
|-------------|-------|------------|
| **Mode**    | `light.css`, `dark.css` | Definierar primitiva färgskalor (gray-1..12, iris-1..12 etc.) + mode-specifika overrides |
| **Palette** | `standard`, `pantone`, `forest`, `mesa` + `previews` | Ompekar accent-, text-, bg-, border-tokens till annan färgfamilj |
| **Typography** | `editorial`, `refined`, `expressive`, `technical`, `system` | Font-families och vikter |

---

## 2. Fullständig token-användning per komponent

### 2.1 Bakgrundsfärger (--bg-*)

| Token | Används i | Antal |
|-------|-----------|-------|
| `--bg-page` | navigation, accordion, radio, checkbox, select, toggle-switch, chord-hud, grid-overlay, language-dropdown, theme-dropdown, footer | 11 |
| `--bg-surface` | tabs, download-card, print-button, settings-panel, navigation (.active) | 5 |
| `--bg-surface-subtle` | form (disabled), radio (disabled), checkbox (disabled), select (disabled) | 4 |
| `--bg-elevated` | shortcut-key (toggle-switch) | 1 |
| `--bg-inverse` | language-overlay, theme-overlay, settings-overlay (via color-mix) | 3 |
| `--bg-tag` | tags | 1 |
| `--bg-tag-hover` | tags (:hover) | 1 |
| `--bg-section-headline` | (definierad i semantic, använd via component-token) | 0 direkt |
| `--bg-nav` | (definierad men ej direkt använd i CSS — kanske via JS/templates) | 0 direkt |
| `--bg-disabled` | (definierad i semantic, aldrig refererad i komponent-CSS) | **0** |

### 2.2 Textfärger (--text-*)

| Token | Används i | Antal |
|-------|-----------|-------|
| `--text-default` | form, radio, checkbox, select, footer, navigation, summary-card, language-dropdown, theme-dropdown, settings-dropdown, toggle-switch, chord-hud, toast, pagination, download-card, print-button, tabs, breadcrumb, palette-preview (border) | **~18** |
| `--text-muted` | form (disabled, help), radio (disabled), checkbox (disabled), toc, breadcrumb, summary-card, pagination, tabs, footer, theme-dropdown, toggle-switch, shortcut-key, language-dropdown, contact-form | **~14** |
| `--text-inverse` | (definierad i semantic, använd indirekt via state-overlays) | 0 direkt |
| `--text-link-hover` | article-card, download-card, print-button | 3 |
| `--text-accent` | (definierad, använd som fallback i toggle-switch) | 1 |
| `--text-tag` | tags, tag-list | 2 |
| `--text-link` | (definierad, ej använd i komponent-CSS — troligen i content/prose) | 0 i komp. |
| `--text-nav` | (definierad, ej direkt i CSS — kanske via --brand-on-primary alias) | 0 direkt |
| `--text-disabled` | (definierad i semantic, aldrig refererad i komponent-CSS) | **0** |

### 2.3 Border-tokens (--border-*)

| Token | Används i | Antal |
|-------|-----------|-------|
| `--border-default` | form, radio, checkbox, select, accordion, language/theme/settings-dropdown, tabs, print-button, chord-hud, toc, toggle-switch track, shortcut-key, mobile-sheet grab handles | **~15** |
| `--border-subtle` | navigation (.bottom-line), radio/checkbox (disabled), toc (::before), theme-dropdown (divider), typography-preview, shortcut-key | 6 |
| `--border-strong` | language/theme/settings-toggle (:hover) | 3 |
| `--border-hover` | form (:hover), radio (:hover), checkbox (:hover), select (:hover) | 4 |
| `--border-disabled` | (definierad i semantic, aldrig refererad i komponent-CSS) | **0** |

### 2.4 State/Interaction tokens (--state-*)

| Token | Används i | Antal |
|-------|-----------|-------|
| `--state-surface-hover` | navigation, tabs, download-card, print-button, language/theme/settings dropdown options, accordion-nested, typography-preview | **~9** |
| `--state-surface-active` | tabs, accordion-nested, typography-preview | 3 |
| `--state-page-hover` | accordion | 1 |
| `--state-page-active` | accordion | 1 |
| `--state-brand-hover` | navigation CTA button | 1 |
| `--state-focus` | language/theme/settings toggle focus, tabs | 4 |
| `--state-selected` | theme-dropdown (active mode/typography) | 2 |
| `--state-tag-hover/active` | (definierade i semantic, ej direkt använda — tags använder --bg-tag-hover istället) | **0** |

### 2.5 Brand-tokens (--brand-*)

| Token | Används i | Antal |
|-------|-----------|-------|
| `--brand-primary` | form (:focus border), radio (checked), checkbox (checked), select (:focus), tabs (.is-active bg), toggle-switch (on-track), toc (focus outline, active indicator), toggle-switch (focus ring) | **~8** |
| `--brand-on-primary` | tabs (.is-active text) | 1 |
| `--brand-container` | (definierad, aldrig refererad) | **0** |
| `--brand-on-container` | (definierad, aldrig refererad) | **0** |

### 2.6 Component-tokens (--component-*)

| Token | Definierad i | Använd i |
|-------|-------------|----------|
| `--component-form-bg` | components.css | form.css (input bg) |
| `--component-form-border` | components.css | **Aldrig refererad i CSS** |
| `--component-form-placeholder` | components.css | form.css (::placeholder) |
| `--component-nav-cta-bg` | semantic.css | navigation.css |
| `--component-nav-cta-text` | semantic.css | navigation.css |
| `--component-toc-active-indicator` | semantic.css | table-of-contents.css |
| `--component-section-headline-bg` | semantic.css | (ej i komponent-CSS, troligen i layout/templates) |
| `--component-newsletter-bg` | components.css | newsletter.css |
| `--component-newsletter-text` | components.css | newsletter.css |
| `--component-newsletter-illustration-bg` | components.css | newsletter.css |
| `--component-newsletter-button-bg` | components.css | newsletter.css |
| `--component-newsletter-button-text` | components.css | newsletter.css |

### 2.7 Status-tokens (--status-*)

| Token | Används i | Antal |
|-------|-----------|-------|
| `--status-error-bg` | form (error), newsletter, footer-newsletter, ring-error (semantic) | 4 |
| `--status-error-border` | form (error, required label), newsletter, footer-newsletter | 4 |
| `--status-error-text` | form, newsletter, footer (med fallback) | 3 |
| `--status-success-bg` | form, newsletter, footer (alla med fallback) | 3 |
| `--status-success-border` | form, newsletter, footer (alla med fallback) | 3 |
| `--status-success-text` | form, newsletter, footer (alla med fallback) | 3 |
| `--status-warning-*` | (definierade, aldrig använda i komponent-CSS) | **0** |
| `--status-info-*` | (definierade, aldrig använda i komponent-CSS) | **0** |
| `--status-*-icon` | (definierade, aldrig använda i komponent-CSS) | **0** |

### 2.8 Ring/Shadow-tokens

| Token | Används i |
|-------|-----------|
| `--ring-focus` | form, radio, checkbox, select | 4 |
| `--ring-error` | form (error focus) | 1 |
| `--ring-selected-emphasis` | theme-dropdown (active palette) | 1 |
| `--shadow-01` | language/theme/settings panel, chord-hud, tabs, mobile sheets | ~6 |
| `--shadow-02` | toast | 1 |
| `--shadow-03` | toggle-switch thumb | 1 |

---

## 3. Identifierade problem

### 3.1 Hardkodade värden (bör vara tokens)

| Komponent | Rad | Hardkodat värde | Förslag |
|-----------|-----|-----------------|---------|
| **tooltip.css** | 20 | `background-color: black` | `--bg-inverse` eller ny `--component-tooltip-bg` |
| **tooltip.css** | 21 | `color: #fff` | `--text-inverse` |
| **tooltip.css** | 54,72,88,110,128,145 | `border-color: black transparent...` | `--bg-inverse` |
| **toast.css** | 30 | `background: rgba(255,255,255,0.52)` | Saknar token — bör använda `color-mix(in srgb, var(--bg-page) 52%, transparent)` |
| **toast.css** | 31 | `border: 1px solid rgba(0,0,0,0.06)` | `--outline-neutral` eller liknande |
| **toast.css** | 88 | `[data-mode="dark"] .toast { background: rgba(24,24,27,0.52) }` | Direkt mode-selektor istället för token — bör följa token-systemet |
| **toast.css** | 89 | `border-color: rgba(255,255,255,0.08)` | Hardkodat dark mode-värde |
| **tabs.css** | 22 | `font-size: 0.875rem` | `var(--text-sm)` |
| **tabs.css** | 23 | `font-weight: 600` | `var(--sans-weight-bold)` (notera: bold=500 i systemet, 600 avviker) |
| **toast.css** | 74 | `font-weight: 600` | Bör använda en token |
| **footer.css** | 96 | `border: 1px solid var(--text-default)` | Ovanligt att använda text-token som border — bör vara `--border-strong` eller `--border-default` |

### 3.2 Oanvända definierade tokens

Dessa tokens definieras i `semantic.css` eller `components.css` men refereras aldrig i någon komponentfil:

| Token | Definierad i |
|-------|-------------|
| `--text-disabled` | semantic.css |
| `--bg-disabled` | semantic.css |
| `--border-disabled` | semantic.css |
| `--brand-container` | semantic.css |
| `--brand-on-container` | semantic.css |
| `--component-form-border` | components.css |
| `--component-section-headline-bg` | semantic.css (möjligen i layout-CSS utanför scope) |
| `--status-warning-*` (bg/border/text/icon) | semantic.css |
| `--status-info-*` (bg/border/text/icon) | semantic.css |
| `--status-*-icon` (alla 4) | semantic.css |
| `--state-tag-hover` | semantic.css |
| `--state-tag-active` | semantic.css |

**Notering:** Vissa av dessa kan användas i layout-CSS, prose-CSS eller Hugo-templates utanför komponentmappen. En fullständig sökning i hela repot rekommenderas innan borttagning.

### 3.3 Fallback-inkonsekvens vid status-meddelanden

Status-tokens (`--status-success-*`) har inkonsekvent fallback-mönster:

- **form.css** rad 443-446: `var(--status-success-bg, hsl(142 76% 94%))` — har fallback
- **newsletter.css** rad 130-133: Samma fallbacks
- **footer.css** rad 130-134: Samma fallbacks
- **Men** `--status-error-bg` i newsletter.css rad 136: Ingen fallback
- **Och** `--status-error-bg` i form.css rad 436: Ingen fallback

**Problem:** Success-tokens har fallbacks medan error-tokens inte har det. Antingen borde alla ha fallbacks (defensivt) eller inga (om tokens alltid finns). Rekommendation: ta bort alla fallbacks eftersom tokens definieras centralt.

### 3.4 Duplicerad status-styling

Identisk status-meddelande-CSS återfinns i tre filer:

1. `form.css` rad 435-446 (`.contact-form__message--error/success`)
2. `newsletter.css` rad 129-139 (`.mc-response--success/error`)
3. `footer.css` rad 130-140 (`.footer-newsletter__responses .mc-response--*`)

**Rekommendation:** Extrahera till en delad `.message--error` / `.message--success` klass.

### 3.5 Token-namnkonflikt / inkonsekvent namning

| Problem | Detalj |
|---------|--------|
| `--radius-xs` vs `--radius-4` | checkbox.css rad 212 använder `--radius-xs` som inte definieras i primitives.css. Borde vara `--radius-4`. |
| `--border-radius-sm` | footer.css rad 126 och newsletter.css rad 125 använder `--border-radius-sm` med fallback `4px`. Denna token definieras i semantic.css som alias till `--radius-4`, men namnen är inkonsekvent med det övriga `--radius-*` mönstret. |
| `--font-size-sm` vs `--text-sm` | form.css rad 344, 350 använder `--font-size-sm` som inte definieras. Borde vara `--text-sm`. |
| `--line-height-relaxed` | form.css rad 347, 352 — inte definierad i primitives. Närmaste är `--line-height-wide` (1.75). |
| `--sans-weight-medium` | toc.css rad 82 — inte definierad i primitives. Bara `regular` (400) och `bold` (500) finns. |

### 3.6 Toast bryter token-systemet med direkt mode-selektor

`toast.css` rad 87-90 använder `[data-mode="dark"] .toast` för att sätta hårdkodade rgba-värden istället för att lösa det via tokens. Alla andra komponenter undviker mode-selektorer — toast bör göra samma.

**Lösning:** Definiera `--component-toast-bg` och `--component-toast-border` i `components.css`, med overrides i `light.css`/`dark.css`.

---

## 4. Positiva mönster

### 4.1 Konsekvent state-layer-modell
Nästan alla interaktiva komponenter använder `linear-gradient(var(--state-*-hover), var(--state-*-hover))` som `background-image` för hover/active. Detta möjliggör overlay-effekter utan att störa bakgrundsfärgen. Utmärkt mönster.

### 4.2 Semantiska tokens dominerar
Flertalet komponenter refererar aldrig primitiva färgskalor (iris-*, gray-*). De går via semantic-lagret. De enda undantagen är tooltip och toast.

### 4.3 Palette-dimensioner fungerar väl
Forest-paletten visar att ompekning via token-overrides fungerar smidigt. Genom att byta `--accent-primary`, `--bg-surface`, `--text-tag` etc. ändras hela utseendet utan att röra komponent-CSS.

### 4.4 Motion-tokens konsekvent använda
Alla komponenter använder `--motion-duration-*` och `--motion-ease-*` tokens. Inget hardkodat förutom tooltip (0.3s) och toast (keyframes).

---

## 5. Rekommenderade åtgärder

### Prioritet 1 — Buggar / saknade tokens

| # | Åtgärd | Fil(er) |
|---|--------|---------|
| 1a | Ersätt `--radius-xs` med `--radius-4` | checkbox (form.css:212) |
| 1b | Ersätt `--font-size-sm` med `--text-sm` | form.css:344, 350 |
| 1c | Ersätt `--line-height-relaxed` med `--line-height-wide` eller definiera token | form.css:347, 352 |
| 1d | Definiera `--sans-weight-medium: 450` eller mappa till befintlig vikt | primitives.css + toc.css:82 |

### Prioritet 2 — Tokenisera hardkodade värden

| # | Åtgärd | Fil(er) |
|---|--------|---------|
| 2a | Tokenisera tooltip-färger | tooltip.css |
| 2b | Tokenisera toast-bakgrund/border via component-tokens + mode-overrides, ta bort `[data-mode]`-selektor | toast.css, components.css, light.css, dark.css |
| 2c | Ersätt `font-size: 0.875rem` → `var(--text-sm)` och `font-weight: 600` → token | tabs.css:22-23, toast.css:74 |
| 2d | Footer newsletter input border: `--text-default` → `--border-default` eller `--border-strong` | footer.css:96 |

### Prioritet 3 — Rensa / konsolidera

| # | Åtgärd | Detalj |
|---|--------|--------|
| 3a | Verifiera `--component-form-border` — ta bort om oanvänd | components.css |
| 3b | Konsolidera status-meddelande-CSS till delade utility-klasser | form.css, newsletter.css, footer.css |
| 3c | Harmonisera fallback-mönster: ta bort fallbacks från success-tokens | form.css, newsletter.css, footer.css |
| 3d | Ersätt `--border-radius-sm` med `--radius-4` konsekvent | newsletter.css, footer.css |

### Prioritet 4 — Oanvända tokens (review & eventuell borttagning)

Gör en fullständig grep i hela repot (inkl. layouts, partials, JS) innan borttagning:

- `--text-disabled`, `--bg-disabled`, `--border-disabled`
- `--brand-container`, `--brand-on-container`
- `--status-warning-*`, `--status-info-*`
- `--status-*-icon` (alla 4)
- `--state-tag-hover`, `--state-tag-active`

---

## 6. Sammanfattning

**Totalt granskade:** 23 komponenter, 3 token-filer, 7 dimensions-filer
**Allvarlighetsgrad:** Inga brytande problem, men 4 token-referenser pekar på icke-definierade variabler (1a-1d)
**Hardkodade färger:** 2 komponenter (tooltip, toast) — tooltip helt utan tokens, toast blandar tokens och hårdkodade rgba
**Oanvända tokens:** ~15 definierade tokens utan referens i komponent-CSS
**Duplikation:** Status-meddelande-styling kopierad i 3 filer

Systemet är generellt välstrukturerat med tydlig separation mellan primitives → semantic → components. De identifierade problemen är isolerade och enkla att åtgärda.
