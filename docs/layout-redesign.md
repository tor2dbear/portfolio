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

## Placement API (the mechanism)

Layouts are a **data layer over a declarative placement vocabulary**, not a pile
of per-surface overrides. Markup says *what* an element is (a semantic role);
each layout defines *where* it goes (columns) and *in what order* (rows / areas)
via tokens. This keeps the existing `--col` / `.place-*` API and extends it —
adding a layout becomes "fill in a table", not "write new rules".

### Roles (vocabulary)

A small set of semantic placement roles — finalise as we go, and only tokenise
what actually varies by layout:

`hero` · `title` · `meta` · `lede` · `feature` · `card` · `figure` · `prose` · `aside` · `nav`

### Column placement — role → token

```css
/* vocabulary: defined once */
.place-figure { grid-column: var(--place-figure, col-start 1 / span 10); }

/* layout: just a table of values — no surface rules, no specificity fights */
:root[data-layout="index"]     { --place-figure: auto / span 4; }
:root[data-layout="editorial"] { --place-figure: col-start 1 / span 12; }
```

`--col` / `.place-*` stay as the escape hatch for genuine one-offs.

### Order / 2-D placement — reorder between layouts

CSS Grid decouples *visual position* from *DOM order*, so an element can move
anywhere per layout with the DOM unchanged. Two mechanisms:

1. **Named areas (structured regions)** — best for reordering a fixed set (e.g. a
   works masthead: hero / title / meta). Each layout redraws the template:
   ```css
   .works-masthead { display: grid; grid-template-areas: var(--masthead-areas); }
   .works-masthead__hero  { grid-area: hero; }
   .works-masthead__title { grid-area: title; }

   :root[data-layout="column"]    { --masthead-areas: "title" "hero"; }
   :root[data-layout="editorial"] { --masthead-areas: "hero" "title"; } /* image on top */
   ```
2. **Row token (single elements)** — `.place-x { grid-row: var(--row-x, auto); }`
   set per layout. Lighter than areas for one-off moves.

### Accessibility guard-rail

DOM / source order = **reading, tab and screen-reader order**. Grid reordering is
*visual only*. Keep the DOM in a sensible default order, and be careful moving
**focusable / interactive** elements (visual vs tab order can desync). Swapping a
hero image and a title is low-risk; large reorders of interactive content are not
— those get flagged.

### How this maps to the matrix

Every cell in the Layout × Surface matrix below is ultimately a set of token
values (`--place-*`, `--row-*` / `--*-areas`, `--layout-*`). Filling the matrix
*is* defining the tokens.

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
- Index: **compact / utilitarian** — smaller display type + tighter hero rhythm
  (scale down `--layout-hero-rhythm` / `--layout-scale-ratio`). **DECIDED**

### Home — featured works
- Column: asymmetric 8+4 / 4+8 rhythm. **DONE**
- Editorial: full-width, dramatic cards. **DONE**
- Index: **ROWS, not an image grid** — each work = a flush divided list row with a
  small **natural-ratio thumbnail** + **title (truncated) + full date + tags**.
  Reads like a filmography / index. **DONE**
  - Mechanism: `.summary-card` flattened (`display:contents`); the `<article>`
    becomes the row grid. Thumb column = `--place-card-thumb` (3rem mobile / 5rem
    desktop). Mobile: absolutely-positioned thumb (natural ratio, out of flow so
    row heights are deterministic) + stacked title/date/tags. Desktop ≥48em:
    single-line `thumb | title | meta | tags` with a uniform cover thumb.
  - **TBD:** row hover / focus treatment?

### Works listing (`/works`, tags, terms)
- Column / editorial: as today (layout-responsive grid). **DONE**
- Index: **same ROW treatment as featured** — rules live in
  `components/summary-card.css` (global bundle), so `/works`, taxonomy and terms
  all get it. Both container shapes handled (`.content.startpage` span-12 +
  `.content.list` full-width article + zeroed row-gap for flush dividers). **DONE**
  - **TBD:** a touch denser than featured, or identical? (currently identical)

### Works article (single)
- Column: standard reading. **DONE**
- Editorial: full-bleed hero, centred masthead, body measure by columns. **DONE**
- Index: body images as a uniform 3-up contact sheet (2-up mobile). **DONE**.
  Masthead (title/meta) goes **compact / list-like** to match index. **DECIDED**
- Order: title stays above the hero in **all** layouts (reordering parked). **DECIDED**

### Writing listing + article
- **Decided:** editorial = magazine reading; index = utilitarian but readable.
- Column: as today. **DONE**
- Editorial: centred article masthead (title/date/tags/description) + drop cap on
  the opening paragraph (body stays left for reading); listing cards centred with
  a larger title. **DONE**
- Index: listing is a tight full-width divided list (compact title + description +
  date + tags, flush dividers — no thumbnail, these cards are text-only); the
  article stays close to column so long-form reads well. **DONE**
  - **TBD:** narrow the editorial writing *body* measure (cols 4–9 like works),
    and/or extend the drop cap to index? (left as-is for now.)

### About / CV
- Editorial: centred display headlines; CV columns. **DONE**
- Index: about packs dense 3-up; CV multi-column. **DONE (mostly)**
  - **TBD:** does the index "rows" idea change the about/CV presentation?

### Contact
- Editorial: portrait-forward split. **DONE**
- Index: info-forward split. **DONE**

### Footer
- Gutters track the active layout. **DONE**

## Editorial — works cards + related

- Featured / listing / related cards: **full-width (one per row), centred title /
  date / tags, larger magazine-scale title.** Related drops 3-up → single column.
  Lives in `dimensions/layout/editorial.css` (global). **DONE**

## Editorial — the "bigger moves"

**Decided ambition — two moves:**

1. **Section rules + more whitespace** — thin dividers between sections riding the
   open editorial rhythm. **DONE** — hairline between consecutive `.home-section`s
   and one opening the Related block in a works article.
2. **Drop caps (anfang)** — a large initial at the start of body prose. **DONE**
   on the works article body's opening paragraph (size/leading only; keeps the
   body typeface/weight/colour → orthogonal).

*Parked (not now):* pull quotes, asymmetric / margin-note columns.

- **TBD:** extend drop caps to long-form writing/texter articles? (works body only
  for now.) Tune the cap size per typeface if needed.

## Open decisions (roll-up)

1. Index hero — **compact / utilitarian.** ✅
2. Featured / works rows — **small thumbnail (~1 col) + title + year + tags.** ✅
   (row hover treatment still TBD)
3. Index masthead on works articles — **compact / list-like.** ✅
4. Writing pages — which treatment per layout? **TBD**
5. Editorial "bigger moves" — **section rules + more whitespace, and drop caps.** ✅
6. Reordering — **parked** (title above hero everywhere); mechanism ready in the
   Placement API when wanted. ✅

## Parked / backlog

- **Terminal layout** — a 4th, image-free, text/list-only layout (pairs well with
  the mono typeface). Not now.
- **Playwright regression net** — assert no layout breaks per role/font/viewport
  once the redesign stabilises (see chat notes).

## Build order (proposal)

1. ~~**Index featured → rows** (home), verify.~~ **DONE**
2. ~~**Index works listing → rows** (reuse #1), verify.~~ **DONE** (rules moved to
   the global `summary-card.css` so they cover every summary-card surface).
3. ~~**Editorial "bigger moves"**~~ **DONE** (section rules + drop cap; plus
   editorial centred full-width works cards + related).
4. Fill remaining TBDs surface by surface (row hover, listing density, writing
   pages, drop caps on long-form writing). ← next
