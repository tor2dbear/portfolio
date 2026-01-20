# Typography Plan (Phase 1)

## Goal
Improve readability and consistency with minimal risk:
- Keep body text at **18px** for prose.
- Keep **h1/h2/h3 as sans headlines**; serif stays for display/hero.
- Keep current “caption” styling but **rename the class to preamble/ingress**.
- Add one intermediate size: **`--text-1-5xl` = 32px**.

## Scope (Phase 1 only)
Low‑risk changes to tokens and prose styling, plus class renames in templates.

## Decisions
- **Body text size**: 18px (unchanged)
- **Headlines**: h1/h2/h3 remain sans
- **Caption** → **Preamble** (same visuals)
- **Scale**: add only `--text-1-5xl` (32px)

## Status
**Done**
- Added `--text-1-5xl` token (32px) and `.text-1-5xl` utility.
- Introduced `.prose` with vertical rhythm, lists, tables, blockquotes.
- Replaced `.type-caption` with `.type-preamble` (caption alias removed).
- Added `.type-display-1`, `.type-display-2`, `.type-lead`.
- Applied `.prose` and `.type-preamble` in templates.
- Switched writing/texter/post description to `.type-lead`.
- Added clamp sizing for `.type-display-1/2`, `h1/h2`, `.type-lead`, `.type-preamble`.
- Adjusted headline scale: `.type-headline-3` now uses `--text-1-5xl` (32px), `.type-headline-4` uses `--text-xl` (20px).
- About section cleanup: removed `<br>` and standardized paragraph styling.

**Open questions**
- Do we want `.type-headline-3` back at 24px (`--text-2xl`) or keep 32px?
- Should `.type-heading` remain removed or reintroduced as legacy alias?

## Implementation Steps (original)
1) **Add new token**
   - File: `assets/css/tokens/primitives.css`
   - Add `--text-1-5xl: 2rem; /* 32px */` near existing text sizes.

2) **Introduce `.prose` container**
   - File: `assets/css/utilities/typography.css`
   - Move body paragraph styling (`font-family`, `font-size: var(--text-lg)`, `line-height`, `max-width`, `text-wrap-style`) into `.prose p`.
   - Add minimal defaults for `.prose ul/ol`, `.prose li`, `.prose blockquote`, `.prose table`, `.prose code`.
   - Keep global `p` styling minimal to avoid UI bleed.
   - Add vertical rhythm:
     - `.prose p { margin-bottom: var(--spacing-24); }`
     - `.prose h2 { margin-top: var(--spacing-48); margin-bottom: var(--spacing-16); }`
     - `.prose h3 { margin-top: var(--spacing-32); margin-bottom: var(--spacing-12); }`
     - `.prose ul, .prose ol { margin-bottom: var(--spacing-24); }`
     - `.prose li { margin-bottom: var(--spacing-8); }`
     - `.prose blockquote { margin: var(--spacing-32) 0; }`

3) **Rename `.type-caption` → `.type-preamble`**
   - File: `assets/css/utilities/typography.css`
   - Keep the same styles but create `.type-preamble` class.
   - Make `.type-caption` an alias for now (deprecated but functional).

4) **Apply `.prose` + `.type-preamble` in templates**
   - Files to update:
     - `layouts/works/single.html`
     - `layouts/post/single.html` (writing)
     - `layouts/_default/single.html`
     - `layouts/_default/legal.html`
   - Wrap rendered markdown with `.prose`.
   - Replace `.type-caption` usage where it represents ingress/preamble.

5) **Optional: refine blockquote**
   - Keep conservative styling (e.g. `text-xl`, italic, left border).
   - Only apply inside `.prose` so it doesn’t affect UI.

## Out of Scope (Later)
- Full typographic scale rewrite beyond the current headline/preamble adjustments.
- Deep letter‑spacing refactor.

## Risks
- Template changes could alter spacing; keep updates scoped to `.prose`.
- Removing legacy aliases may affect any custom content that still uses them.

## Validation Checklist
- Writing pages: body text stays at 18px and 70ch.
- Works pages: ingress uses `.type-preamble` and looks unchanged.
- UI elements (cards, menus) are **not** affected by global `p` styling.
- Legal pages: prose styles applied and consistent.

## Rollback
- Revert changes in `assets/css/utilities/typography.css` and updated templates.
- Remove `--text-1-5xl` and `.text-1-5xl` if we revert headline adjustments.
