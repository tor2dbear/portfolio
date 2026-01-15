# Brand mark morph plan

## Overview
Create a morphing brand loop (curl) that transitions between two knot shapes while keeping the left/right lines locked to the loop endpoints. The scroll progress should still expand the overall mark width, pushing `tor` and `bjorn.com` apart like before.

## Constraints
- Keep the loop endpoints aligned on the same baseline (`y`) so the lines stay connected.
- Avoid layout shifts: expansion should not reflow other header items.
- Keep the implementation framework-free by default; allow a JS-based morph if needed.

## Architecture decisions
- Keep the loop and lines as **separate SVG elements** so line geometry stays stable.
- Apply morphing to **loop path only**, not to the entire group.
- Use a fixed loop width/height (24x24) and move the loop with JS, so changes in shape do not affect line Y alignment.

## Implementation phases

### Phase 1: Prepare SVG assets
- Create two loop variants: `loop-a` (current curl) and `loop-b` (knot).
- Ensure both paths share:
  - Same `viewBox` (24x24)
  - Same start/end coordinates (must remain on baseline `y=14` to match line Y)
  - Same direction and number of path commands for morphing

### Phase 2: Integrate morph strategy
Pick one of two morph strategies:

**A) Path morph (preferred)**
- Use SMIL `<animate attributeName="d">` for simple morphs.
- If SMIL support is insufficient, use JS morphing (Flubber or a tiny custom interpolator).

**B) Crossfade fallback**
- Keep both paths in the same SVG.
- Crossfade between them when the loop animates.

### Phase 3: Wire animation trigger
- Trigger on hover or on scroll progress threshold.
- Ensure reduced motion disables morphing.

### Phase 4: QA and refinements
- Verify loop stays connected to lines at all scroll positions.
- Check small screens and reduced motion.
- Adjust easing and duration.

## How to create the SVGs (important details)
- **Use `path`, not `line`** for the loop itself. Lines are fine for the straight segments.
- **Same number of path segments** in both shapes for morphing. If using vector tools, export as paths and ensure point counts are consistent.
- **Same start/end points** for both paths. The first and last points must sit on baseline `y=14` and align with line endpoints.
- **No transforms** baked into the path (avoid `transform` on the path itself).
- Keep the loop inside a 24x24 viewBox.

## Tooling notes
- Flubber.js can normalize mismatched paths, but produces more complex path data.
- Framer Motion + Flubber is a viable option if you are OK with adding runtime JS.
- If you prefer no dependencies, consider SMIL for a single morph.

## Success criteria
- Loop morphs without breaking contact with the lines.
- Scroll expansion still pushes the text apart as before.
- No layout jump on load or resize.

## Rollback plan
- Revert to the non-morph loop SVG and keep the line expansion logic intact.
- Remove morph JS/CSS hooks if any regressions appear.
