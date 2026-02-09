# Content Markdown Cleanup

## Overview
Standardize Markdown content to avoid inline HTML (e.g. `<br>`, `<i>`) so new Hugo rendering defaults stay clean and warnings go away.

## Scope
- Convert inline HTML in content files to Markdown equivalents.
- Focus on client/employer application content first, then other sections as needed.

## Architecture Decisions
- Keep `render-image` hook for responsive images and `srcset`.
- Prefer Markdown formatting over HTML in content bodies.

## Implementation Phases
1) Inventory files containing inline HTML (search for `<br>`, `<i>`, `<span>`, etc.).
2) Convert formatting:
   - `<br>` → blank line or new paragraph
   - `<i>` → `*italic*`
   - `<strong>` → `**bold**`
3) Spot-check output on key pages (clients, about, contact).

## Success Criteria
- No `warning-goldmark-raw-html` warnings in dev server logs.
- Visual layout matches current pages.

## Rollback Plan
- Revert content changes in git if formatting regressions appear.
