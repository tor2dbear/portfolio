+++
title = "The Grid, Inherited"
date = "2026-05-11"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "On CSS subgrid, named lines, and the print logic that finally arrived on the web"
tags = ["css", "design", "grid", "print"]
topics = []
slug = "writing"
translationKey = "the-grid-inherited"
+++

Printed design rests on a grid that is almost invisible to the reader but impossible to do without as a designer.

Josef Müller-Brockmann's *Grid Systems in Graphic Design* (1961) codified a system already embedded in centuries of typographic practice: columns, gutters, margins, and baselines coordinating every element on the page. The grid is not a constraint but a promise — that the composition holds together, that its elements exist in relation to one another, that the structure beneath the surface remains coherent even as the content changes.

The reader rarely notices the grid directly. What they notice is coherence.

Those who came to the web from print carried this promise with them. And were met, for a long time, by its absence.

For roughly fifteen years, web layout was a sequence of workarounds. Floats. Clearfix hacks. Tables repurposed for structure. `inline-block` with mysterious whitespace artifacts. Each technique was fundamentally a misuse — a feature designed for one purpose pressed into service as a crutch for another.

There was no grammar for layout.

You could approximate a grid but never truly express one.

CSS Grid changed this in 2017. For the first time, the web had a native layout system — one that did not need to simulate a grid but actually *was* one.

## Columns with names

What separates CSS Grid from earlier layout techniques is not merely capability but grammar.

Grid introduces named lines — `[col-start]`, `[content-start]`, `[full-start]` — that function as a typographic coordinate system.

The column definition on this site looks like this:

```css
grid-template-columns:
  [full-start] var(--size-page-margins)
  [content-start] repeat(12, [col-start] 1fr)
  [content-end] var(--size-page-margins)
  [full-end];
```

Twelve columns with margin zones on either side — the geometry of a printed spread.

`full-start / full-end` defines the paper's edge. `content-start / content-end` defines the type area. Elements can be positioned anywhere along this axis:

```css
.place-article  { --col: col-start 3  / span 8; }
.place-wide     { --col: col-start 1  / span 10; }
.place-bleed    { --col: full-start   / full-end; }
```

A print designer recognizes this immediately.

The important shift is not visual but structural. Layout stops being a collection of local adjustments and becomes a shared spatial language.

## The missing piece

But CSS Grid solved only half the problem.

The problem was nesting.

When an element was placed inside another, its connection to the outer grid broke. Each new grid context created its own tracks, its own lines, its own coordinate system — and none of these related to each other.

The grid reproduced itself but did not propagate itself.

In print, this would be unthinkable. An image sitting inside a text column still belongs to the page's larger compositional system. Alignment lines persist across the entire hierarchy.

Subgrid resolves this.

With `grid-template-columns: subgrid`, a nested container inherits the parent's tracks instead of defining its own.

```css
@supports (grid-template-columns: subgrid) {
  .use-subgrid {
    grid-template-columns: subgrid;
  }
}
```

Now a nested component can position its children along the exact same column lines as the outer page. The coordinate system is shared. The grid's promise survives nesting.

Grid gave the web structure. Subgrid gives it continuity.

## A denser compositional language

The full scope of what this makes possible became clear when I began noticing a different kind of precision emerging in modern web design.

Elements no longer merely aligned *within* components; they aligned *across* them.

Sections related to each other spatially even when separated by several layers of nesting. Wide elements could bleed outward while text blocks remained locked to shared internal columns. Components behaved less like isolated boxes and more like participants in a larger compositional field.

This is remarkably close to what Karl Gerstner pursued with programme grids: systems flexible enough to support many different arrangements while preserving an underlying order.

More columns is not more complexity. More columns is more possibility.

Twelve columns remains a practical compromise. Divisible by 2, 3, 4, and 6 — halves, thirds, quarters, and sixths all resolving onto shared lines.

The result is not rigidity but compositional freedom with structure.

## Art direction as a system

What becomes genuinely interesting is what can be built on top of subgrid.

The implementation on this site uses CSS custom properties as an art-direction API. Any element can be steered by setting `--col` for desktop placement, with responsive overrides via `--col-lg`, `--col-md`, and `--col-sm`:

```html
<div style="--col: col-start 1 / span 6;
            --col-md: col-start 1 / span 12;">
```

No JavaScript. No class for every possible variation.

The compositional intent remains visible directly in the markup — almost like layout annotations in a print production document.

The fallback chain ensures responsive behavior collapses predictably rather than arbitrarily:

```css
grid-column: var(--col-md, var(--col-lg, var(--col)));
```

The system degrades level by level.

For larger editorial gestures there are placement presets — `.place-article`, `.place-wide`, `.place-bleed` — and stepped patterns that move elements rhythmically across the grid:

```css
.stepped-2-4 > :nth-child(1) { --col: col-start 1 / span 4; }
.stepped-2-4 > :nth-child(2) { --col: col-start 3 / span 4; }
.stepped-2-4 > :nth-child(3) { --col: col-start 5 / span 4; }
```

Each element shifts two columns to the right while occupying four, producing a staggered progression across the spread.

Swedish typesetters once used the term *tripp-trapp-trull* for similar offset arrangements. The name still fits.

## Print as endpoint

There is a further implication rarely discussed: CSS Grid works for print as well.

`@page` allows A4 margins, page breaks, and print-specific typography. Named grid lines — `content-start`, `full-start` — are semantic rather than visual and can be redefined in print stylesheets without touching the HTML itself.

The same structural language can govern both screen and paper.

Print and web no longer merely share the concept of a grid. With careful implementation, they can share the same grammar entirely.

Müller-Brockmann did not need browsers to formulate his system.

But the web has finally become capable of inheriting it.
