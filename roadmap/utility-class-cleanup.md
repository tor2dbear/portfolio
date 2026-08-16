---
title: Utility-class-cleanup
status: done
tags: [css, refactor]
updated: 2026-08-16
---

## Mål
Städa utility-klasser i faser och minska utility-användningen.

## Levererat
Migrationen är genomförd — inga kvarvarande typography-utilities i `layouts/`
(undantag UI-library och `_deprecated`); sista utility flyttad till komponent-CSS.
Post-migration-validering och 2–4-veckors-cleanup avklarade.
Detaljer i `docs/migrations/utility-class-cleanup.md`.
