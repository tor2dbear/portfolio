# Breakpoints Update Plan

## Overview
Align breakpoints to a consistent scale (em-based, desktop-first) and update CSS
rules across layout, utilities, and components. Ensure bottom-sheet panels for
theme/language dropdowns only activate on Small and X-Small viewports.

## Decisions
- Units: em-based breakpoints for accessibility with user font scaling.
- Strategy: desktop-first using max-width queries (keep current approach).
- Levels: xs, sm, md, lg, xl (retain 1280+ as Large Desktop).
- Bottom sheet: only on sm and xs (<= 767px).
- Media query comments: include a short breakpoint label in each block.

### Proposed Breakpoints (base 16px)
- xs: 0-479px (max-width: 29.9375em)
- sm: 480-767px (max-width: 47.9375em)
- md: 768-1023px (max-width: 63.9375em)
- lg: 1024-1279px (max-width: 79.9375em)
- xl: 1280px+ (no max-width)

### Media Query Comment Convention
- Use a short label on each media block, for example:
  `/* sm: <= 47.9375em */`

## Architecture Notes
- Keep CSS image breakpoints pragmatic for performance; only align art-direction
  swaps to xs/sm/md/lg/xl when a crop changes.
- Avoid "gaps" between breakpoints by using the existing .9375em pattern.

## Implementation Phases
### Phase 1: Source of Truth
- [x] Document breakpoints and naming in a single doc (this file is the source).
- [ ] Confirm whether any additional token file should reference these values.

### Phase 2: Global Layout and Grid
- [x] Update `assets/css/utilities/grid.css` to map 12 -> 4 columns at md and
      confirm gaps at xs/sm.
- [x] Update `assets/css/style.css` grid overrides to match the new scale.
- [x] Ensure `assets/css/components/navigation.css` grid override matches md.

### Phase 3: Utilities and Typography
- [x] Update `assets/css/utilities/display.css` to use xs/sm/md naming correctly.
- [x] Update `assets/css/utilities/typography.css` responsive typography to align
      with xs/sm/md boundaries.

### Phase 4: Components
- [x] Footer: decide whether the 640px rule becomes sm or xs and update
      `assets/css/components/footer.css`.
- [x] Dropdowns: move bottom-sheet triggers to sm/xs only in:
      `assets/css/components/theme-dropdown.css` and
      `assets/css/components/language-dropdown.css`.
- [x] Home/UI-library: align `assets/css/pages/home.css` and
      `assets/css/pages/ui-library.css` to the new breakpoints.
- [x] Client page: consolidate 1280/1279/1023 in
      `assets/css/clientpage.css` to match lg/xl/md.

### Phase 5: Images (Optional)
- [x] Review `layouts/partials/headerimage.html` and
      `layouts/_default/_markup/render-image.html` for art-direction breakpoints
      that should align to xs/sm/md/lg/xl (no art-direction crops found).

## Success Criteria
- Layout switches 12 -> 4 columns at md (<= 63.9375em) consistently.
- No visual gaps between breakpoint ranges.
- Bottom-sheet UI appears only at sm/xs (<= 47.9375em).
- No unexpected regressions in footer or navigation.

## Validation Checklist
- [ ] Test viewport widths at 479/480, 767/768, 1023/1024, 1279/1280.
- [ ] Verify navigation and grid behavior at each breakpoint.
- [ ] Confirm dropdowns use desktop panels at md/lg/xl.
- [ ] Check footer layout at 640->sm/xs decision width.

## Rollback Plan
- Revert affected CSS files to the previous breakpoint values.
- Restore dropdown bottom-sheet to its previous trigger if UX regresses.
