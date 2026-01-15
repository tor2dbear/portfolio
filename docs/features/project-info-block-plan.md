# Project Info Block Implementation Plan

## Overview
Create a reusable metadata block for portfolio projects that displays Role, Details, and Client consistently across project types, using existing client-block styling.

## Goals
- Place block after project description and before gallery.
- Use semantic HTML (`dl/dt/dd`) for details.
- Responsive grid: 3 columns (desktop) → 2 columns (tablet) → 1 column (mobile).
- Support flexible details per project type without new styling patterns.

## Frontmatter Contract
- `role`: string only (comma-separated if multiple roles).
- `details`: map with snake_case keys.
- `client`: map with `name`, `url`, `about` (optional).

Example:
```yaml
role: "Art Direction, Illustration"
details:
  year: 2015
  format: "A4"
  paper: "Uncoated, 120g"
  print_method: "2 Pantone spot colors + black"
client:
  name: "Society of International Affairs"
  url: "https://www.utblick.org/"
  about: ""
```

## Rendering Rules
- Render the block only if any of `role`, `details`, or `client` is present.
- Use `humanize` for detail labels (e.g. `print_method` → `Print Method`).
- Client `about` is shown only if length ≤ 100 chars.
- Client URL is shown as `domain.tld ↗` (no protocol/www).

## File Changes
1) Add partial: `layouts/partials/project-info.html`.
2) Replace `.project-client` in `layouts/works/single.html` with the new partial.
3) Update styles in `assets/css/style.css` (migrate `.project-client` to `.project-info`).
4) Pilot frontmatter update:
   - `content/swedish/works/utblick-no-2/index.md`
   - English counterpart

## CSS Breakpoints
- Desktop: 3 columns
- ≤ 63.9375em (1024px): 2 columns
- ≤ 40em (640px): 1 column

## Edge Cases to Validate
- Only `role` → single column.
- `role` + `details` → two columns.
- `role` + `client` → two columns.
- No `details` or no `client` should not render empty columns.

## Rollout
1) Implement partial + CSS. (done)
2) Update Utblick (SV + EN) as pilot. (done)
3) Verify layout on desktop/tablet/mobile. (done)
4) Roll out to other projects incrementally. (done)
