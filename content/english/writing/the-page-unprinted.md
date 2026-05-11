+++
title = "The Page Unprinted"
date = "2026-05-11"
author = "Torbjörn Hedberg"
draft = true
hidden = false
description = "Exploring the possibilities and frustrations of CSS print styling"
tags = ["css", "print", "web-development"]
topics = []
translationKey = "the-page-unprinted"
+++

There's something poetic about print. A PDF is a promise—a fixed moment, a document that won't reflow or rerender. Yet the web, built for screens, treats print as an afterthought.

## The Gap Between Screen and Page

When I set out to create print-ready exports for my portfolio, I expected CSS to handle it gracefully. After all, we have `@media print`, `@page` rules, and break properties. The specification exists. The reality is messier.

### What Works

**Page size and margins.** Basic `@page` rules work across browsers:

```css
@page {
  size: A4;
  margin: 20mm 15mm;
}
```

**Hiding elements.** Screen-only navigation, footers, and UI chrome disappear predictably with `display: none` in print media queries.

**Break control.** Properties like `break-inside: avoid` mostly work—keeping images with their captions, headers with their content.

### What Doesn't

**Running headers and footers.** The CSS specification describes 16 margin boxes per page—slots for page numbers, chapter titles, document headers. No browser implements them natively.

**Page counters.** `counter(page)` and `counter(pages)` exist in the spec. They don't work without JavaScript polyfills.

**Consistent rendering.** Safari renders fonts thinner. Chrome handles page breaks differently than Firefox. Each browser interprets the same CSS with slight variations.

## The Polyfill Promise

Libraries like paged.js attempt to bridge the gap, implementing CSS Paged Media specifications in JavaScript. The promise is compelling: running headers, page numbers, precise pagination.

The reality is fragile. During my implementation:

- Certain CSS selectors (`nth-of-type`) crashed the library entirely
- Content loaded correctly, then disappeared during rendering
- Debugging became archaeology—digging through transformed DOM structures

After multiple attempts with isolated CSS, minimal dependencies, and various configurations, I returned to simple print stylesheets. Sometimes the reliable solution beats the ambitious one.

## What I Learned

**Isolation helps.** Print layouts benefit from separate, minimal CSS—fewer cascade issues, fewer surprises.

**Design for constraints.** Print isn't a degraded screen view. It's a different medium with fixed dimensions, no interaction, and no second chances. Design for it intentionally.

**Accept limitations.** Without running headers or dynamic page numbers, structure your content to work without them. Clear visual hierarchy, consistent spacing, and logical flow matter more than pagination features.

## The Future, Maybe

CSS Paged Media is a working draft from 2018. Browser vendors prioritize screen experiences. Print remains niche.

Perhaps that's fine. The web excels at fluid, responsive, interactive content. Print excels at permanence. They don't need to be the same.

For now, I'll keep my print stylesheets simple, my expectations modest, and my PDFs functional. The page, unprinted, remains a compromise—but a workable one.
