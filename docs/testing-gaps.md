# Testing gaps — follow-ups from the `codex-fixes` review

Context: the `codex-fixes` branch resolved five findings raised by the Codex/
Dependabot review (A–E below). While fixing them we asked "which tests should
have caught this?" — this doc captures the answer and the follow-up work to
close the gaps. Intended as the agenda for a dedicated review session.

## What was fixed on `codex-fixes`

| Ref | Fix                                                                                                                                                                        | Commit                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| A   | Employer-view href leaked template whitespace into the query string; added Go-template trim markers (`-}}` / `{{-`)                                                        | `Trim whitespace from employer-view href query string` |
| B   | Language switcher linked to `hidden` (noindex) translation stubs; now filtered out                                                                                         | `Skip hidden translations in the language switcher`    |
| C   | Pantone activated before the lazy CotyScale engine loaded stuck on the stale fallback year; now re-applies the true latest year on load                                    | `Correct Pantone year after lazy CotyScale load`       |
| D   | Global `minimatch@10` override left `test-exclude@6` calling the v10 namespace object as a function (`minimatch is not a function`); upgraded consumer to `test-exclude@7` | `Patch dev-toolchain advisories via scoped overrides`  |
| E   | Four dev-only npm-audit advisories (@babel/core, ajv, js-yaml, yaml); resolved with version-scoped overrides, no cascade, `npm audit` → 0                                  | `Patch dev-toolchain advisories via scoped overrides`  |

## The gaps, by category

### 1. No Hugo template-render tests exist at all (covers A + B)

Both A and B are pure template bugs. The entire JS suite runs in jsdom against
`assets/js/*`; the CSS suite only checks contrast ratios. Nothing renders a Hugo
partial and asserts on the output, so there was no place these could have been
caught.

Tests that would have caught them:

- **A** — render `layouts/_default/summary-employer.html` for a page with a
  `company_name` parent param and assert the generated `href` contains no
  whitespace/newlines (`?view=employer&ref=...`, not `?view=employer\n  &ref=`).
- **B** — render `layouts/partials/settings-dropdown.html` with one visible and
  one `hidden: true` translation and assert the language radio does not link to
  the hidden translation's permalink.

This is the largest gap but also the most work: it needs a Hugo-render test
harness (e.g. `hugo` against small content fixtures, then parse the emitted HTML
and assert with a DOM/query lib). **Recommend scoping this as its own task.**

### 2. C was reachable in jsdom — we just hadn't written the case (DONE)

The existing `darkmode-pantone.test.js` mocks `window.CotyScaleActions`
synchronously, so the engine is always "already loaded" and the
activate-before-load race never ran.

**Added** `activating pantone before CotyScale loads snaps to the latest year
once it does` — it deletes `window.CotyScaleActions`, sets `window.__cotyScaleSrc`
so `ensureCotyLoaded` injects a `<script>`, activates Pantone with a stale
`theme-coty-year`, then fires the script's `load` event and asserts the year
corrects to the real latest. Verified it fails without the fix (`2024` vs `2026`).

While writing it, also made the suite's `beforeEach` hermetic: `innerHTML` only
replaces `<head>`/`<body>`, so stale `data-*` attributes on `<html>` leaked
palette/pantone/year state between tests. Now cleared (plus `sessionStorage`).

### 3. D + E are CI gaps, not unit-test gaps

- **E (advisories)** are only caught by `npm audit` / Dependabot. CI has a
  `Security audit` step but it is (a) push-job only, (b) `--audit-level=high`
  (our advisories are moderate/low), and (c) `continue-on-error: true` — so it
  can never surface or block these.
- **D** would be caught by actually running `npm run test:coverage` in CI (it is
  not run today), and/or a one-line test that calls `test-exclude`'s
  `shouldInstrument` directly.

## Follow-up todo (for the review session)

- [x] Add the Pantone lazy-load regression test (C) — done on `codex-fixes`.
- [x] Make `darkmode-pantone.test.js` `beforeEach` hermetic (strip `<html>`
      data-attrs + `sessionStorage`) — done on `codex-fixes`.
- [x] **Run coverage in CI** — done. Added both guards for the D-class bug:
      `__tests__/toolchain-instrumentation.test.js` drives `test-exclude`'s
      `shouldInstrument` directly (fast, hugo-independent, part of `npm test`),
      and a `npm run test:coverage` step now runs in both the `quick` and
      `quality` CI jobs so the full istanbul/test-exclude pipeline is exercised.
- [x] **Build a Hugo template-render harness** — done. `test/` holds a tiny
      self-contained Hugo fixture site (`test/fixture/`) plus
      `test/hugo-render.test.js`, which injects the real `summary-employer.html`
      and
      `settings-dropdown.html` (and real `i18n/`) into a throwaway copy, runs
      `hugo`, and asserts on the emitted HTML. Covers both original cases
      (employer href has no whitespace; hidden-translation stubs are not linked)
      plus a visible-translation control. Skips gracefully when Hugo is absent
      (set `HUGO_PATH` or install Hugo to run it locally). Verified it fails
      against the pre-fix templates. Grow it by adding fixture pages + probe
      layouts for the next template under test.
- [x] **CI audit policy — surface advisories in the dev loop** — done. The goal
      was reach, not gating: a dependency advisory should show up where the work
      happens (the PR), not be buried in a green job's logs. `npm audit` now runs
      in the `quality` job and `scripts/quality/audit-summary.mjs` folds the
      moderate/high/critical counts into the sticky PR quality comment
      (non-blocking; catches the moderate/low class the push-job
      `--audit-level=high` step ignores). Dependabot (maintainer email / auto
      PRs) was deliberately skipped — that reaches a person, not the PR loop.
- [x] **Static whitespace guard for template query strings** — done.
      `test/template-whitespace-guard.test.js` scans every layout
      for the gap-A shape (a multi-line query-string href whose whitespace is
      trimmed by neither `-}}` nor `{{-`). Token-aware, so the fixed multi-line
      form passes; verified it finds 4 leaks in the pre-fix summary-employer and
      0 today. Defence-in-depth alongside the render harness, for new templates
      nobody has written a render test for yet.
