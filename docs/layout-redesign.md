# Layout redesign — spec

> **Status:** working draft. This is the source of truth for the editorial + index
> *visual redesign* (a follow-up to the `data-layout` dimension introduced in PR #218).
> Edit freely — decisions live here, not in chat. `TBD` = needs your call.

## How we work from this doc

1. **Fill the matrix** below (what each layout does, per surface). `TBD` cells are
   open decisions.
2. **Build incrementally against it** — one surface (or one layout) at a time,
   verify on the deploy preview, commit.
3. Column stays the **no-op reference**; only editorial + index change here.

## Layouts

| Layout | One-line intent | Image treatment |
|---|---|---|
| **Column** | Today's balanced reading composition. **No-op — do not change.** | As today |
| **Editorial** | Airy, centred, magazine. *Bigger moves than today — see TBD.* | Large, full-bleed hero |
| **Index** | Dense, list-like — a literal *index*. **Less image-centric.** | Small / rows, minimal |
| ~~Terminal~~ | *Parked* — a text-only, image-free layout. Revisit later. | None |

## Cross-cutting principles (keep)

- **Orthogonal:** layout owns composition/rhythm/image-treatment only. Colour →
  palette, font face → typography. Never touch those here.
- **Column = exact no-op.**
- **Chrome vs content:** layout changes the *content/reading* experience, not the
  nav / settings / footer utility text.
- **Desktop-first, mobile-safe** (no horizontal overflow; test the mono typeface,
  which is widest).

## The matrix — Layout × Surface

Legend: **DONE** (in PR #218) · **TARGET** (this redesign) · **TBD** (decide).

### Home — hero
- Column: as today. **DONE**
- Editorial: centred, full-width, typewriter role on its own line < breakpoint. **DONE**
- Index: as today. **TARGET?** — should the hero shrink / go more compact/utilitarian on index? **TBD**

### Home — featured works
- Column: asymmetric 8+4 / 4+8 rhythm. **DONE**
- Editorial: full-width, dramatic cards. **DONE**
- Index: **TARGET → present as ROWS, not an image grid.** Each work = a row
  (title, year/meta, tags; thumbnail small or none). Less image-centric, reads
  like a filmography / table of contents.
  - **TBD:** thumbnail — tiny (e.g. 1–2 col) or none? Row content + order?
  - **TBD:** hover/focus treatment for a row?

### Works listing (`/works`, tags, terms)
- Column / editorial: as today (layout-responsive grid). **DONE**
- Index: **TARGET → same ROW treatment as featured** (consistent index = list).
  **TBD:** identical to featured rows, or denser?

### Works article (single)
- Column: standard reading. **DONE**
- Editorial: full-bleed hero, centred masthead, body measure by columns. **DONE**
- Index: body images as a uniform 3-up contact sheet (2-up mobile). **DONE**
  - **TBD:** should the *masthead* (title/meta) also go more compact/list-like on index?

### Writing listing + article
- **TBD** across all layouts — do writing pages follow the same treatments, or
  stay closer to column for readability? (Editorial probably yes; index rows?)

### About / CV
- Editorial: centred display headlines; CV columns. **DONE**
- Index: about packs dense 3-up; CV multi-column. **DONE (mostly)**
  - **TBD:** does the index "rows" idea change the about/CV presentation?

### Contact
- Editorial: portrait-forward split. **DONE**
- Index: info-forward split. **DONE**

### Footer
- Gutters track the active layout. **DONE**

## Editorial — the "bigger moves"

You mentioned wanting *larger* changes to editorial beyond today's centred
masthead. Capture the direction here so we can build it:

- **TBD:** what's the ambition? e.g. drop caps / lead-ins, wider asymmetric
  columns, pull-quotes, larger display type, section rules, more whitespace…
- **TBD:** which surfaces get the strongest editorial treatment (home vs article)?

## Open decisions (roll-up)

1. Index hero — compact or as-is? **TBD**
2. Featured/works rows — thumbnail size (tiny/none), row anatomy, hover. **TBD**
3. Index masthead on works articles — list-like? **TBD**
4. Writing pages — which treatment per layout? **TBD**
5. Editorial "bigger moves" — the actual ambition. **TBD**

## Parked / backlog

- **Terminal layout** — a 4th, image-free, text/list-only layout (pairs well with
  the mono typeface). Not now.
- **Playwright regression net** — assert no layout breaks per role/font/viewport
  once the redesign stabilises (see chat notes).

## Build order (proposal)

1. **Index featured → rows** (home), verify.
2. **Index works listing → rows** (reuse #1), verify.
3. **Editorial "bigger moves"** once the ambition is set.
4. Fill remaining TBDs surface by surface.
