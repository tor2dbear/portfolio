---
title: Utility-class-cleanup
status: next
tags: [css, refactor]
updated: 2026-08-15
---

## Mål
Städa utility-klasser i faser och minska utility-användningen.

## Levererat
Migrationen är genomförd — inga kvarvarande typography-utilities i `layouts/`
(undantag UI-library och `_deprecated`); sista utility flyttad till komponent-CSS.
Detaljer i `docs/migrations/utility-class-cleanup.md`.

## Kvar
- Post-migration-validering: visuell test på breakpoints, inga regressioner,
  Lighthouse/a11y oförändrad.
- Cleanup 2–4 veckor efter deploy: räkna och överväg borttagning av oanvända
  utilities (< 5 användningar).
