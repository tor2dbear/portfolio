# Pantone Lab Separation Plan (2026-02-16)

## Purpose

Detta dokument beskriver hur vi separerar "vanlig palette generator" från ett dedikerat "Pantone Lab"-flode for COTY-ar, med fokus pa stabilitet, tydlig UX och hogre kvalitetskontroll per ar.

## Goals

1. Behalla nuvarande palette-flode intakt (roles/policies/custom palette).
2. Stodja alla COTY-ar med genererade skalor.
3. Ge ett separat Pantone-flode med per-token overrides (light + dark).
4. Ge robust persistens for granskning over hela sajten.
5. Minska otydlighet kring `role_mode` och `anchor_step`.

## Current Baseline Status (Done before PR A)

Detta ar den stabila baseline vi utgar ifran innan token-utokningen:

1. Tabs-separation i generatorn: `Palette` vs `Pantone Lab`.
2. Pantone year-flode fungerar med year-select + prev/next.
3. Per-year draft persistens fungerar (light/dark) och export patch ar kvar.
4. Diff/contrast/where-used/control-color finns i Pantone Lab for QA.
5. Bildbakgrund/blend ar stabil for mono/duo-ar (inklusive gradientfall).

Notis:

1. `COTY role mode` och `COTY anchor step` behalls i denna fas, men vidare beteendeforandringar pa dessa ar uttryckligen pausade tills senare PR.

## Next Scope: PR A (Token consistency follow-up)

PR A bygger vidare pa baseline ovan och fokuserar pa token-konsistens som behovs for Pantone QA-kvalitet.

In scope (PR A):

1. Fas 1-5 fran `docs/migrations/token_plan.md` (utan stor naming migration).
2. Kortsiktiga manuella border-overrides i palette-filer (`--border-default`, `--border-strong`) for `forest`, `mesa`, `pantone`.
3. Verifiering: lint/test + visuell kontroll av kritiska UI-block (buttons/forms/tabs/toast/nav-cta/taggar).

Out of scope (flyttas till nasta PR):

1. Fas 6 (status-konsolidering till shared utility-fil).
2. Fas 7a/7b/7c (stor naming migration: `bg->surface`, `brand/accent->primary/secondary`, state rename).
3. Optional niceties (random year, shortcuts, batch review).

## Why split now

1. Mindre regressionsrisk nar Pantone baseline redan ar stabil.
2. Tydligare review: funktionell Pantone-baseline ar redan klar, PR A fokuserar pa token-kvalitet.
3. Enklare felsokning om nagot bryts (baseline vs token-refactor).

## Current State (As-Is)

1. Pantone ar en "palette" (`data-palette="pantone"`) men COTY-skala och semantik injiceras dynamiskt via JS.
2. `data/pantone-coty.toml` innehaller ardata + valfria `role_mode`, `anchor_step`, `overrides_light`, `overrides_dark`.
3. `assets/js/coty-scale.js`:

- Genererar `--coty-1..12` (och secondary for duo-ar).
- Satter role-relaterade tokens (`--coty-role-*`, `--coty-source-step`).
- Applicerar manuella overrides for aktuell mode.

4. `assets/css/dimensions/palette/pantone.css` innehaller basmappning till semantiska tokens.
5. `assets/js/palette-generator.js` har vuxit till att hantera bade palette-bygg och Pantone-override flode.
6. `assets/js/darkmode.js` driver palette/mode-byte och tvingar palette `pantone` vid COTY-year-byte.

## Main Problems

1. Två olika arbetsmodeller blandas i samma UI och kodflode.
2. COTY base controls (`role_mode`, `anchor_step`) krockar mentalt med manuella token-overrides.
3. Oklart "source of truth" nar samma semantiska token paverkas av:

- pantone.css fallback
- coty-scale role mapping
- manual per-year override

4. Pantone-kvalitetsarbete (finjustering per ar) saknar tydlig "lab-mode" med komplett token-audit.

## Target Architecture

## 1) Two Explicit Flows

1. `Palette Builder`:

- Endast generiska teman (`standard`, `forest`, `mesa`, `custom`).
- Samma beteende som idag.

2. `Pantone Lab`:

- Enbart COTY-ar.
- Separat state, separat export, separat controls.
- Inget "save as custom palette".

## 2) Shared Runtime Contract

Pantone fortsatter skriva till samma semantiska tokens som resten av systemet, men:

1. Bas kommer fran COTY-skala + role mapping.
2. Finjustering kommer fran per-year overrides.
3. Prioritetsordning dokumenteras tydligt:

- Base scale
- Role mapping
- Theme-level fallback
- Per-year override (light/dark) (highest priority)

## 3) Persistens Model

1. Globalt aktivt COTY-ar: `theme-coty-year` (befintligt).
2. Pantone Lab draft per ar och mode:

- `pantone-lab::<year>::light`
- `pantone-lab::<year>::dark`

3. Export patch till TOML ar "source of truth" for commit.

## UX Recommendations

## A) Top-level Selection

1. Behall separationen "Palette" och "Pantone", och lat tabs vara primar kontroll.
2. Ta bort separat "Active source"-kontroll for att undvika dubbel styrning.
3. Tab byte ska styra runtime direkt:

- `Palette`-tab -> aktiv palette ar senaste icke-pantone (`standard/forest/mesa/custom`).
- `Pantone Lab`-tab -> aktiv palette blir `pantone` + valt ar.

4. Initial tab vid sidladdning ska folja aktuell aktiv palette:

- Om `data-palette="pantone"` -> oppna `Pantone Lab`.
- Annars -> oppna `Palette`.

## B) Pantone Year Selection

Rekommenderad kombination:

1. Dropdown for exakt arval.
2. Prev/Next knappar for snabb iteration.
3. Optional "Random" knapp (ej default behavior pa sidbyte).

Motivering:

1. Dropdown ar snabbast for hop mellan ar.
2. Prev/Next ar snabbast for sekventiell QA.
3. Random mode ar bra for demo, mindre bra som default QA-verktyg.

## C) Base vs Override Controls

I Pantone Lab:

1. Sektion "Base scale":

- `role_mode` (auto/surface/primary)
- `anchor_step`

2. Sektion "Token overrides":

- Gruppvis per role (Surface/Text/Primary/Secondary/State/Component)
- Light/Dark switch for editing context

Detta gor tydligt att base och finjustering ar olika lager.

## C2) Control Color for Visual Token QA

Lag till en separat "control color"-funktion i Pantone Lab for att visuellt granska tokenkopplingar i UI.

1. Syfte:

- Ge en tydlig "diagnostic color" som tillfalligt kan appliceras pa valda tokenroller.
- Snabbt avslöja var en token faktiskt används (och var fallback/alias tar over).

2. UX i Pantone Lab:

- En liten sektion: "Control color".
- Val av färg (color input + eventuellt presets).
- Toggle: "Enable control color".
- Scope-val:
  - `Primary tokens`
  - `Surface tokens`
  - `Text tokens`
  - `Selected token only` (om vi vill koppla till vald override-rad)

3. Runtime-regler:

- Galler endast i generatorn (diagnostik), inte globalt pa sajten.
- Ska ligga over vanliga Pantone overrides i prioritet under aktiv QA-session.
- Ska kunna slas av direkt utan att forandra draft-data.

4. Persistens:

- Sparas som UI-state i localStorage separat fran year-drafts (t.ex. `pantone-lab-control-color`).
- Far inte exporteras till TOML.

5. Reset:

- Nollstalls av separat "Disable control color" och av "Reset Pantone Lab UI state".
- Ska inte paverkas av "Reset year" (eftersom det ar ett QA-verktyg, inte per-year design data).

## E) Secondary Visibility (duo years only)

1. `--coty-secondary-*` ska bara visas i UI nar valt ar ar duo (t.ex. 2016, 2021).
2. For mono-ar:

- dolj secondary-sektion helt (rekommenderat), eller
- visa read-only med text "Not used for this year".

3. For runtime:

- mono-ar ska inte exponera secondary-selectors i editpanelen.
- duo-ar ska visa bade primary + secondary med tydlig markering av respektive source.

## F) Persistens for cross-page review

Malet ar att du ska kunna justera i generatorn och sedan granska samma ar pa vanliga sidor utan att forlora state.

1. Live draft (localStorage, direkt anvandning):

- `pantone-lab::<year>::light`
- `pantone-lab::<year>::dark`
- Innehaller token-overrides + base-controls for valt ar.

2. Runtime load order pa alla sidor (inte bara generatorn):

- Las COTY base for valt ar.
- Applicera mode-fallback.
- Applicera draft override for aktuell mode (om finns).

3. Save till repo:

- Manuell export/import (TOML patch) kan vara kvar som arbetsflode.
- localStorage-draft ar snabb iteration/QA; TOML ar source of truth for commit.

4. Safety:

- "Reset year" rensar bara valt ar.
- "Reset all Pantone drafts" ar separat, explicit handling.
- Rekommenderad placering:
  - "Reset year" direkt i Pantone Lab header (snabbt QA-flode).
  - "Reset all" bakom extra bekraftelse.

## D) Remove/De-prioritize

1. `image_treatment` i Pantone Lab bor inte vara valbar som fri kontroll.
2. Regeln ska vara hardkodad per COTY-typ i runtime:

- mono-ar -> pantone blend mot primary-scale (nuvarande beteende).
- duo-ar -> gradient blend mellan primary och secondary source.

3. Default for `--image-background` i Pantone ska vara mode-beroende:

- light + mono-ar -> `--image-background: var(--coty-9)`
- light + duo-ar -> `--image-background: linear-gradient(135deg, var(--coty-9), var(--coty-secondary-9))`
- dark + mono-ar -> `--image-background: var(--coty-5)`
- dark + duo-ar -> `--image-background: linear-gradient(135deg, var(--coty-5), var(--coty-secondary-5))`

4. `--image-background` maste vara manuellt styrbar i Pantone Lab override-UI (light + dark) for finjustering per ar.
5. Behall `image_treatment` som implementation detail i Pantone runtime, inte som anvandarval.
6. Status (current branch): implementerat i `assets/js/coty-scale.js` via runtime-sattning av `--image-grayscale`, `--image-blend-mode` och `--image-background` (duo = gradient, mono = single-scale fallback).

## Token Audit Needed (Pantone Lab prerequisite)

Skapa en explicit matris med:

1. Token namn.
2. Var token anvands (CSS selector/file).
3. Om token bor vara override-bar i Pantone Lab.
4. Om token bor vara auto-beraknad.

Minimalt maste foljande vara med:

1. Text: `--text-default`, `--text-muted`, `--text-link`, `--text-link-hover`, `--text-nav`, `--text-tag`, `--text-inverse`, `--text-accent`.
2. Surface: `--bg-page`, `--bg-surface`, `--bg-tag`, `--bg-tag-hover`, `--bg-nav`, `--border-subtle`, `--border-strong`, `--component-form-bg`, `--component-form-placeholder`, `--image-background`.
3. Primary/CTA: `--accent-primary`, `--accent-primary-strong`, `--brand-primary`, `--brand-on-primary`, `--component-nav-cta-bg`, `--component-nav-cta-text`.
4. Secondary/State: `--accent-secondary`, `--accent-secondary-strong`, `--state-focus`, `--state-selected`, `--component-toc-active-indicator`, `--component-section-headline-bg`.

## COTY Scale Strategy

Nuvarande strategi (OKLCH + anchor) ar i grunden rimlig, men ska ses som:

1. "Baseline generator", inte slutgiltig design.
2. Slutlig kvalitet sker via per-year overrides.

Detta ar viktigt for att undvika overengineering i generatorn och for att faktiskt bli klar med alla ar.

## Implementation Plan (Phased)

## Phase 0: Stabilize (no big behavior change)

1. Frys nya UI-forandringar tills flodesgrans ar beslutad.
2. Dokumentera final source-of-truth och prioritet.
3. Bekrafta att palette builder fungerar oforandrat.

## Phase 1: Split Flows in Code

1. Dela `palette-generator.js` i:

- `palette-builder.js`
- `pantone-lab.js`

2. Hall gemensam helper i en liten shared modul om behov finns.
3. Se till att Pantone Lab inte kan skriva custom palette.

## Phase 2: Pantone Lab MVP

1. Year selection (dropdown + prev/next).
2. Base controls (`role_mode`, `anchor_step`).
3. Full token overrides per role.
4. Secondary controls visas endast for duo-ar.
5. Light/Dark edit mode med live preview.
6. Export patch (TOML snippet).

## Phase 3: QA Tooling

1. Token usage panel (where-used).
2. Contrast quick checks pa nyckelpar:

- primary/on-primary
- bg-page/text-default
- bg-surface/text-default
- cta bg/cta text

3. "Diff against base" vy for valt ar.
4. Status (current branch): grundlaggande kontrastpanel implementerad i Pantone Lab (live ratio + AA pass/fail for nyckelpar).
5. Status (current branch): grundlaggande "Diff against base"-vy implementerad i Pantone Lab (total + light/dark/global counts och lista per token).
6. Status (current branch): grundlaggande "Token usage (where-used)"-panel implementerad i Pantone Lab (tokenval + fil/selector-referenser + live current value + klickbar tokenhoppning fran diff-listan).

## Phase 4: Optional niceties

1. Random year button.
2. Keyboard shortcuts.
3. Batch review mode (iterate all years with status).
4. Status: flyttas till nästa PR (inte del av aktuell leverans).

## Acceptance Criteria

1. Palette Builder beter sig som fore spliten.
2. Pantone Lab kan spara draft per ar och mode i localStorage.
3. Export patch innehaller endast avvikelser.
4. Samma ar kan granskas konsekvent over flera sidor utan dataforlust.
5. Alla COTY-ar kan valjas och appliceras utan att forstora standard/forest/mesa flow.

## Risks and Mitigation

1. Risk: Regression i theme dropdown/runtime.

- Mitigation: Bevara `ThemeActions` API, lagg tester pa `theme:palette-changed` och `theme:coty-year-changed`.

2. Risk: Overlap mellan pantone.css och runtime.

- Mitigation: Dokumentera fallback-only ansvar for pantone.css.

3. Risk: For mycket manuellt arbete.

- Mitigation: Prioritera token audit + per-year diff tool tidigt.

## Integration: token_plan.md (source of truth for token work)

Denna plan ar nu synkad mot `docs/migrations/token_plan.md` (inte `Color Token Review.md`).

### 0) Scope alignment

`token_plan.md` delar upp arbetet i:

1. Fas 1-5: hygiene + semantikfixar med lag/medel risk.
2. Fas 6: status-message konsolidering.
3. Fas 7a/7b: stor namnkonventionsmigrering (breaking, separata commits).
4. Separat notis om border-derivation i palette-filer och `theme-derive.js`.

### 1) Vad vi tar in i current Pantone PR

Fokus: allt som blockerar tillforlitlig Pantone QA i generatorn.

1. Token hygiene (enligt token_plan Fas 1-2):

- `--radius-xs` -> `--radius-4`
- `--font-size-sm` -> `--text-sm`
- `--line-height-relaxed` -> `--line-height-wide` (eller dokumenterad ersattning)
- `--sans-weight-medium` definierad och konsekvent anvand

2. Pantone Lab QA-stod:

- Control color (diagnostik, ej export)
- Where-used + diff mot base
- Kontrastpanel for nyckelpar

3. Pantone override-coverage for saknade nyckelroller:

- `--brand-on-primary`
- `--image-background`
- `--border-strong`

### 2) Vad som uttryckligen INTE tas i current PR

Flyttas till separat refactor-PR enligt `token_plan.md`:

1. Fas 6: delad `utilities/status-messages.css` + templateuppdateringar.
2. Fas 7a: `--bg-*` -> `--surface-*` naming migration.
3. Fas 7b (+7c): `--brand/*accent` -> `--primary/--secondary` och state-rename.
4. Full repo-stadning av oanvanda tokens efter verifiering.
5. Stor naming/alias-harmonisering over hela systemet.

### 3) Carry-over checklist till next PR (fran token_plan)

Titel-forslag: `refactor/color-token-consistency-followup`

1. Tooltip/Toast: tokenisera hardkodade farger och ersatt toast mode-selektor med component/mode tokens.
2. Tabs/Toast typografi: hardkodade `font-size`/`font-weight` -> tokens.
3. Footer newsletter border: sluta anvanda text-token som border dar det ar fel semantiskt.
4. Status CSS: deduplikera till shared utility + enhetlig fallback-policy.
5. Oanvanda tokens: full grep-baserad retain/remove-lista innan borttagning.
6. Border-sparet:

- kort sikt: manuella palette-overrides for `--border-default`/`--border-strong`
- separat beslut om border ska bli egen derive-role.

### 4) Extra acceptance criteria (synkat mot token_plan)

1. Inga kvarvarande odefinierade tokenreferenser i generator-/theme-kritiska delar.
2. Pantone override pa nyckeltoken ska ge direkt visuell effekt i representativa UI-block.
3. QA-state (control color, panelstate) far inte skrivas till TOML-export.
4. Planen innehaller explicit carry-over sa att stangning av extern review-PR inte tappar scope.

## PR Handoff (for closing `claude/review-color-tokens-EUjAu`)

Denna sektion finns for att inget arbete ska ga forlorat nar review-PR:n stangs.

### In Scope: Current Pantone PR

1. Pantone Lab separation i generatorn (Palette vs Pantone tabs, en tydlig aktiv källa).
2. Pantone year flow:

- year select
- base controls (`role_mode`, `anchor_step`)
- duo/mono-aware UI for secondary tokens

3. Per-year overrides (light/dark) + local draft persistens.
4. Control Color QA i generatorn (diagnostik, ej TOML-export).
5. Token hygiene som blockerar Pantone QA:

- saknade/inkonsistenta nyckelreferenser i generator/theme-kritiska delar
- inklusive `--border-strong` i Pantone override scope.

### Out of Scope: Next PR (must be carried over)

1. Tooltip/Toast tokenisering + toast mode-selektor cleanup (token_plan Fas 4).
2. Status-message konsolidering (token_plan Fas 6).
3. Repo-wide cleanup av oanvända tokens efter full grep-verifiering.
4. Naming migration 7a/7b/7c (`bg->surface`, `brand/accent->primary/secondary`, state rename).
5. Border-derivation follow-up i palette-filer + eventuell derive-role-beslut.

### Next PR Backlog (seed)

Titel-forslag: `refactor/color-token-consistency-followup`

1. Tooltip + toast token pass (hardcoded -> semantic/component tokens).
2. Status token consistency pass (fallback policy + shared classes).
3. Unused token audit closure:

- verifiera usage i hela repo
- dokumentera retain/remove per token

4. Naming migration pass (7a/7b/7c) med migration-notes.
5. Border role decision + implementation spike (eller beslut att avsta, med dokumentation).
6. Manuella border-overrides i palette-filer om derive-implementation skjuts.

### Stacked Follow-up Scope: Border Role in Pantone Lab

Detta ar den explicita planen for "border som egen roll" kopplat till generatorn.

1. Introducera `border` som separat roll i Pantone Lab (utover surface/text/primary/secondary).
2. Ge `border` egen tokenmappning i UI (minst `--border-subtle`, `--border-default`, `--border-strong`).
3. Koppla derive fallback till scale-steg (standardforslag):

- subtle -> step 5
- default -> step 6
- strong -> step 8

4. Behall manuella overrides per ar + mode i draft/export (light och dark var for sig).
5. Visa border-rollens val i diff/where-used-panelerna for snabb QA.
6. Avgransning:

- inga stora naming-migrationer i samma PR
- ingen full repo-wide token cleanup i samma PR

### Definition of Done for current PR

1. Pantone Lab kan anvandas for year-by-year tuning utan att bryta ordinarie palette-flode.
2. Alla justeringar for Pantone kan granskas live och sparas som draft per ar/mode.
3. Export patch innehaller endast Pantone-avvikelser (ej QA-only state).
4. Planen har tydlig carry-over-lista sa att review-PR kan stangas utan informationsforlust.

## Alternative: Manual CSS Themes per Year

Detta alternativ ar tekniskt enklare att resonera om, men dyrt att underhalla:

1. 27+ ar _ 2 modes _ manga tokens = stor CSS-yta.
2. Hog risk for inkonsistens over tid.
3. Svagare tooling for snabb iteration.

Rekommendation:

1. Behall TOML + runtime generator + manual overrides.
2. Bygg ett bra Pantone Lab ovanpa den modellen.
