---
title: Färgtoken-omstrukturering
status: later
tags: [css, tokens]
updated: 2026-08-16
order: 50
---

## Mål
Omstrukturera semantiska färgtokens (surface/primary/secondary-namn, död kod,
status-konsolidering) i staged PR:er.

## Levererat
PR A (fas 1–5) och PR B (fas 6) genomförda.

## Kvar
PR C (naming-migration) delvis klar — legacy-alias (`--bg-*`/`--brand-*`/`--accent-*`)
kvar avsiktligt; slutlig repo-wide cleanup av alias + sista referenser återstår.
Underlag: `docs/migrations/token_plan.md`.
