+++
title = "The Grid, Inherited"
date = "2026-05-11"
author = "Torbjörn Hedberg"
draft = true
hidden = false
description = "On CSS subgrid, named lines, and the print logic that finally arrived on the web"
tags = ["css", "design", "grid", "print"]
topics = []
slug = "writing"
translationKey = "the-grid-inherited"
+++

Printed design rests on a grid that is almost invisible to the reader but impossible to do without as a designer.

Josef Müller-Brockmann's *Grid Systems in Graphic Design* (1961) codified a system already embedded in centuries of typographic tradition: columns, gutters, margins, and baselines coordinating every element on the surface. The grid is not a constraint but a promise — that the page holds together, that its elements are in conversation with each other, that the logic of the composition is legible.

Those who came to the web from print carried this promise with them. And were met, for a long time, by its absence.

For a decade and a half, web layout was a sequence of workarounds. Floats. Clearfix hacks. Tables repurposed for structure. `inline-block` with mysterious whitespace artifacts. Each technique was fundamentally a misuse — a feature designed for one purpose pressed into service as a crutch for another. There was no grammar for layout. You could approximate a grid but never express one.

CSS Grid changed this in 2017. For the first time, the web had a native layout system — one that did not need to simulate a grid but actually *was* one.

---

**Columns with names**

What separates CSS Grid from prior layout techniques is not just capability but grammar. Grid introduces named lines — `[col-start]`, `[content-start]`, `[full-start]` — that function as a typographic coordinate system.

The column definition on this site looks like this:

```css
grid-template-columns:
  [full-start] var(--size-page-margins)
  [content-start] repeat(12, [col-start] 1fr)
  [content-end] var(--size-page-margins)
  [full-end];
```

Twelve columns with margin zones on either side — the geometry of a printed spread. `full-start / full-end` is the paper's edge. `content-start / content-end` is the type area. Elements can be placed anywhere along this axis:

```css
.place-article  { --col: col-start 3  / span 8; }
.place-wide     { --col: col-start 1  / span 10; }
.place-bleed    { --col: full-start   / full-end; }
```

A print designer recognizes this immediately.

---

**The missing piece**

But CSS Grid solved only half the problem.

The problem was nesting. When an element was placed inside another, its connection to the outer grid broke. Each new grid context created its own columns, its own lines, its own coordinate system — and none of these related to each other. The grid reproduced itself but did not propagate itself.

In print, this is unthinkable. An image sitting in a text column is still positioned within the page's overall grid. Column lines are shared across the entire compositional hierarchy.

Subgrid resolves this. With `grid-template-columns: subgrid`, a nested element inherits the parent's tracks instead of defining its own.

```css
@supports (grid-template-columns: subgrid) {
  .use-subgrid {
    grid-template-columns: subgrid;
  }
}
```

Now a nested container can place its children along the exact same column lines as the outer page. The coordinate system is shared. The grid's promise holds across the entire compositional hierarchy, not only at the top level.

---

**A portal into what's possible**

The full scope of what this makes possible crystallized when I came across stripe.dev — found through Josh W. Comeau's thorough walkthrough of the subgrid specification. What struck me about the site was not any single design decision but the density of control: elements snapping to a fine-grained column structure with a precision that ordinary nested grids simply cannot achieve.

It was a reminder of what Karl Gerstner was after with his programme grids — systems generous enough to contain a large number of compositional variations within a single coherent structure. More columns is not more complexity. More columns is more possibility.

Twelve columns is a practical compromise. Divisible by 2, 3, 4, and 6 — halves, thirds, quarters, and sixths all landing on shared lines.

---

**Art direction as a system**

What becomes genuinely interesting is what you can build on top of subgrid.

The implementation on this site uses CSS custom properties as an art-direction API. Any element can be steered by setting `--col` for desktop, with responsive overrides via `--col-lg`, `--col-md`, and `--col-sm`:

```html
<div style="--col: col-start 1 / span 6; --col-md: col-start 1 / span 12;">
```

No JavaScript. No class for every possible configuration. The compositional intent is readable directly in the HTML — much like a layout specification in a print production document.

The fallback chain ensures responsive behavior collapses to defined defaults rather than to an unpredictable stack:

```css
grid-column: var(--col-md, var(--col-lg, var(--col)));
```

The system degrades predictably, level by level.

For larger editorial gestures there are placement presets — `.place-article`, `.place-wide`, `.place-bleed` — and stepped patterns that arrange elements in a staircase across the grid:

```css
.stepped-2-4 > :nth-child(1) { --col: col-start 1 / span 4; }
.stepped-2-4 > :nth-child(2) { --col: col-start 3 / span 4; }
.stepped-2-4 > :nth-child(3) { --col: col-start 5 / span 4; }
```

Each element shifts two columns to the right and occupies four, producing an overlapping staircase across a twelve-column spread. Swedish typesetters once called similar offset patterns *tripp-trapp-trull*. The name still fits.

---

**Print as endpoint**

There is a further dimension rarely discussed: CSS Grid works for print as well.

`@page` lets you define A4 margins, page breaks, and print-specific typography. Grid's named lines are semantic — `content-start`, `full-start` — and can be overridden in a print stylesheet without touching the HTML. The grid that structures the screen becomes the grid that structures the page.

Print and web no longer merely share the concept of a grid. With careful implementation, they can share the same grammar entirely.

Müller-Brockmann did not need browsers to formulate his system. But his system has finally found a home.
