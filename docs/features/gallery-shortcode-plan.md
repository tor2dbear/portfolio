# Gallery Shortcode Plan

## Overview
Introduce a `gallery` shortcode that wraps Markdown images in a layout-aware grid without changing the Markdown image syntax. This keeps authoring simple while enabling consistent multi-image layouts.

## Goals
- Allow layout grouping using a single shortcode with a `layout` parameter.
- Keep Markdown images intact and processed through Hugo’s pipeline.
- Use existing grid utilities (`use-subgrid`, `grid-cols-2`, `col-span-*`) with minimal new CSS.

## Non-Goals
- No lightbox/zoom behavior in this phase.
- No custom image processing beyond existing render hooks/shortcodes.

## Proposed Shortcode API
```markdown
{{< gallery layout="1+1" >}}
![Alt](image-1.webp)
![Alt](image-2.webp)
{{< /gallery >}}
```

Supported layouts:
- `full`
- `1+1`
- `2x2`

Default layout (if omitted): `full`.

## Layout Mapping (Draft)
- `full`
  - Wrapper: `gallery gallery--full use-subgrid`
  - Each image: `col-span-12` (content width, not full-bleed).
- `1+1`
  - Wrapper: `gallery gallery--1-1 use-subgrid grid-cols-2`
  - Each image: `col-span-6`
- `2x2`
  - Wrapper: `gallery gallery--2x2 use-subgrid grid-cols-2`
  - Each image: `col-span-6`

## Implementation Steps
1) Create `layouts/shortcodes/gallery.html`.
2) Render `.Inner | markdownify` inside the wrapper.
3) Map `layout` to wrapper classes.
4) (Optional) Add minimal CSS if spacing or row behavior needs adjustment.
5) Add usage guidance to `AGENTS.md`.

## Open Questions
- For `2x2`, do we enforce exactly four images or allow any count? (Decision: allow any count for now.)

## Success Criteria
- Authors can group images with the shortcode and keep Markdown syntax.
- Layouts render correctly across desktop and mobile using existing grid utilities.
- No visual regressions on existing pages.

## Testing
- Manual: add gallery blocks to a work page with webp/svg/gif images.
- Verify mobile stacking behavior at sm breakpoint.

## Rollback
- Remove `layouts/shortcodes/gallery.html`.
- Remove any added CSS for `.gallery*` if introduced.
