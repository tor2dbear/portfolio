# Subgrid Migration Plan

Status: draft

## Goal
Move to a 12-column root grid with named lines and use subgrid utilities for consistent alignment across pages.

## Scope
- Introduce a new grid utility layer in `assets/css/utilities/grid.css`.
- Update `#main` to be the root grid.
- Migrate homepage layout to the new utilities.
- Clean up old grid utilities once all usages are migrated.

## Assumptions / Preconditions
- Required spacing tokens exist (confirm exact names in tokens before applying):
  - `--size-page-margins`
  - `--spacing-24`
  - `--spacing-32`
- Utilities load order remains: tokens -> dimensions -> utilities -> components -> pages.

## Phase 0: Legacy Grid Cleanup Strategy

### Problem
The codebase currently has ~40+ legacy 6-column grid rules that will conflict with the new 12-column system. These must be identified and addressed.

### Strategy: Two-track migration

#### Track A: Move legacy utilities (SAFE)
- Create `assets/css/utilities/_legacy-grid.css`.
- Move all `.grid-1` through `.grid-6` utilities from `assets/css/utilities/layout.css`.
- Move `.grid-1-2`, `.grid-3-4`, `.grid-5-6`, etc.
- Keep this file temporarily during migration.

#### Track B: Identify hard-coded grid rules (CRITICAL)
Files with legacy `grid-column: span X` rules to migrate:
- `assets/css/style.css` (~30 rules)
  - `.content { grid-column: 1 / span 6; }`
  - `.content:is(.startpage)` article selectors
  - `.content.post > *` selectors
- `assets/css/pages/home.css` (~5 rules)
  - `.works-grid` definition (REMOVE completely)
  - `.works-grid > :nth-child(n)` selectors
- `assets/css/clientpage.css` (~5 rules)

Action: Document each rule's purpose before removal.

## Phase 1: Create the new grid system
Create: `assets/css/utilities/grid.css`

### Contents

#### Core Grid System
```css
/* 12-column root grid with named lines */
#main {
  display: grid;
  grid-template-columns:
    [full-start] var(--size-page-margins)
    [content-start] repeat(12, [col-start] 1fr) [content-end]
    var(--size-page-margins) [full-end];
  column-gap: var(--spacing-24);
  row-gap: var(--spacing-32);
}
```

#### Subgrid Utilities
```css
.use-subgrid {
  grid-column: content-start / content-end;
  display: grid;
}

/* Fallback for browsers without subgrid support */
@supports not (grid-template-columns: subgrid) {
  .use-subgrid {
    grid-template-columns: repeat(12, 1fr);
    column-gap: var(--spacing-24);
  }
}

/* Modern browsers */
@supports (grid-template-columns: subgrid) {
  .use-subgrid {
    grid-template-columns: subgrid;
  }
}
```

#### Named Area Utilities (NEW)
```css
.col-full { grid-column: full-start / full-end; }
.col-content { grid-column: content-start / content-end; }
```

#### Span Utilities
```css
/* 12-column spans */
.col-span-12 { grid-column: span 12; }
.col-span-8 { grid-column: span 8; }
.col-span-6 { grid-column: span 6; }
.col-span-4 { grid-column: span 4; }
.col-span-3 { grid-column: span 3; }
.col-span-2 { grid-column: span 2; }

/* Semantic aliases */
.col-half { grid-column: span 6; }
.col-third { grid-column: span 4; }
.col-two-thirds { grid-column: span 8; }
.col-quarter { grid-column: span 3; }
```

Note: Additional utilities may be added later as layout needs evolve.

#### Responsive Strategy: 12 → 12 → 4
Desktop/Tablet (>768px): 12 columns. Mobile (<768px): 4 columns.

```css
@media (max-width: 63.9375em) {
  #main {
    column-gap: var(--spacing-16); /* Reduce gap on tablet */
  }
}

@media (max-width: 47.9375em) {
  #main {
    grid-template-columns:
      [full-start] var(--size-page-margins)
      [content-start] repeat(4, [col-start] 1fr) [content-end]
      var(--size-page-margins) [full-end];
    column-gap: var(--spacing-16);
  }

  @supports not (grid-template-columns: subgrid) {
    .use-subgrid {
      grid-template-columns: repeat(4, 1fr);
      column-gap: var(--spacing-16);
    }
  }

  @supports (grid-template-columns: subgrid) {
    .use-subgrid {
      grid-template-columns: subgrid;
    }
  }

  /* Mobile overrides */
  .col-span-full-sm { grid-column: 1 / -1; }
  .col-span-4-sm { grid-column: span 4; }
  .col-span-2-sm { grid-column: span 2; }

}
```

### Critical Notes
- NEVER set `column-gap: 0` in subgrid - gaps are inherited automatically.
- Use `grid-column: content-start / content-end` NOT `grid-column: content`.

## Phase 2: Update main layout
Edit: `assets/css/style.css`

### Change `#main` to 12-column root grid
Before:
```css
#main {
  grid-area: main;
  max-width: var(--content-max-width);
  margin: 0 auto;
  width: 100%;
  grid-template-columns: var(--size-page-margins) 1fr var(--size-page-margins);
}
```
After:
```css
#main {
  grid-area: main;
  max-width: var(--content-max-width);
  margin: 0 auto;
  width: 100%;
  display: grid;
  grid-template-columns:
    [full-start] var(--size-page-margins)
    [content-start] repeat(12, [col-start] 1fr) [content-end]
    var(--size-page-margins) [full-end];
  column-gap: var(--spacing-24);
  row-gap: var(--spacing-32);
}
```

### Remove old `.content` grid definition
- Replace with `.use-subgrid` in templates.

### Critical Rules to Remove/Update

#### 1. Remove base `.content` grid definition
```css
/* REMOVE THIS */
.content {
  grid-template-columns: repeat(6, 1fr);
  column-gap: 1.5rem;
  display: grid;
}
```

#### 2. Update `.content.startpage` selectors
Before:
```css
.content:is(.startpage) article:nth-of-type(1),
.content:is(.startpage) article:nth-of-type(4),
.content:is(.startpage) article:nth-of-type(5) {
  grid-column: span 4;
}
```
After: Remove these selectors entirely - replaced by HTML classes:
```html
<article class="col-span-8">...</article>
```

#### 3. Update `.content.post` rules
Keep for now (will migrate in later phase):
```css
.content.post > * {
  grid-column: 1 / span 5; /* Still on 6-column system */
}
```
TODO: Convert to 12-column equivalent: `grid-column: col-start 2 / span 10;`

#### 4. Remove `.content.list` grid rules
These will be replaced by subgrid utilities in templates.

## Phase 3: Migrate homepage
Files:
- `assets/css/pages/home.css`
- `layouts/index.html`
- `layouts/partials/startpage.html`

### Update homepage grid
Remove `.works-grid` and replace with subgrid classes in HTML.

Before:
```css
.works-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--spacing-24);
}

.works-grid > :nth-child(1),
.works-grid > :nth-child(4),
.works-grid > :nth-child(5) {
  grid-column: span 4;
}
```

After (HTML):
```html
<section class="use-subgrid">
  <article class="col-span-8">...</article>
  <article class="col-span-4">...</article>
</section>
```

### Startpage partial
- Replace `.grid-1-5` with an equivalent new utility.

## Phase 3.5: Full-bleed vs Content-bleed Checklist

### Definition
- **Full-bleed**: Edge-to-edge, including page margins (`full-start / full-end`)
- **Content-bleed**: Within page margins, all 12 columns (`content-start / content-end`)

### Per-section decisions

#### Homepage sections
- [ ] **Hero** (`#hero`): Content-bleed
- [ ] **Works** (`#works`): Content-bleed → Items use `.col-span-*`
- [ ] **About** (`#about`): Content-bleed
- [ ] **Contact** (`#contact`): Content-bleed → Use `.col-span-*` for layout
- [ ] **Subscribe** (`#subscribe`): Full-bleed → Newsletter spans edge-to-edge

#### Other pages
- [ ] **Blog posts**: Content-bleed with reading width for text
- [ ] **Client/Employer pages**: Content-bleed
- [ ] **Full-width images**: Use `.col-full` explicitly

### Implementation pattern
```html
<!-- Full-bleed example -->
<section class="col-full">
  <div class="newsletter">Edge to edge content</div>
</section>

<!-- Content-bleed with subgrid -->
<section class="use-subgrid">
  <article class="col-span-8">...</article>
</section>
```

## Phase 4: Cleanup
Files:
- `assets/css/utilities/layout.css`
- `assets/css/style.css`

### Remove legacy grid utilities
- Only remove when all templates are migrated.
- If needed, move legacy grid utilities to `assets/css/utilities/_legacy-grid.css` temporarily.

## Verification Checklist

### Pre-migration
- [ ] All legacy grid rules documented in Phase 0
- [ ] `_legacy-grid.css` created with old utilities
- [ ] All CSS variables confirmed to exist

### Post-Phase 1
- [ ] `utilities/grid.css` created with full system
- [ ] Fallback for non-subgrid browsers works
- [ ] Mobile (4-col) and Desktop (12-col) both render

### Post-Phase 2
- [ ] `#main` has 12-column grid with named lines
- [ ] `.top-menu > *` and `footer > *` use `content-start / content-end`
- [ ] No visual regression on any page

### Post-Phase 3
- [ ] Homepage sections align to root grid
- [ ] `.works-grid` removed from CSS
- [ ] `.startpage` article selectors removed
- [ ] Mobile stacking works correctly

### Post-Phase 3.5
- [ ] Full-bleed elements reach edge of viewport
- [ ] Content-bleed elements stay within margins
- [ ] Newsletter is full-bleed

### Post-Phase 4
- [ ] No remaining usage of removed `.grid-*` utilities
- [ ] `_legacy-grid.css` can be deleted (or kept as reference)
- [ ] All pages tested on 3 breakpoints (mobile/tablet/desktop)
- [ ] No layout regressions in client/employer pages
- [ ] Related items still display correctly

## Rollback Strategy
### During migration
1. Keep `assets/css/utilities/_legacy-grid.css` active.
2. Don't delete any CSS until all templates migrated.
3. Test each phase in Hugo dev server before proceeding.

### If issues occur
1. **Phase 1-2 issues**: Comment out new grid system in `assets/css/style.css`.
2. **Phase 3 issues**: Revert specific template files via git.
3. **Phase 4 issues**: Re-enable `_legacy-grid.css` import.

### Emergency rollback
```bash
git checkout HEAD -- assets/css/style.css
git checkout HEAD -- assets/css/pages/home.css
git checkout HEAD -- layouts/index.html
```

Post-migration: Only delete `_legacy-grid.css` after 2 weeks of stable production.

## Change Summary

| Section | Change | Why |
|---------|--------|-----|
| **Phase 0 (NEW)** | Legacy cleanup strategy | Conflict warning for 6-column rules |
| **Phase 1** | Improved `grid.css` with fallback | Subgrid support coverage |
| **Phase 1** | 12 → 12 → 4 responsive strategy | Consistent column count |
| **Phase 2** | Specific removal instructions | Known conflict rules |
| **Phase 3.5 (NEW)** | Full-bleed checklist | Edge-to-edge clarity |
| **Verification** | Per-phase checklist | Better tracking |
| **Rollback** | Clearer steps | Safer recovery |
