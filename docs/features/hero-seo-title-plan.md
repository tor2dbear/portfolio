# Hero SEO Title and Role Animation Plan

## Overview
Improve home page SEO signals by fixing the home `<title>` and then, in a separate step, adjust the hero H1 role animation markup.

## Goals
- Home page `<title>` is explicit and not derived from section headings.
- Home page description stays consistent with site params.
- Role animation changes are isolated so we can evaluate impact.

## Scope
In-scope:
- Home `<title>` logic in `layouts/partials/head.html`.
- Hero H1 role animation markup + JS/CSS in a later branch.

Out-of-scope:
- Global SEO changes for all templates.

## Plan
### Phase A: Home title (done)
- Update home `<title>` to use `.Site.Params.title`.
- Keep existing description behavior for home (uses site params).
- Files:
  - `layouts/partials/head.html`

### Phase B: Hero H1 role animation (done)
- Render all roles in H1 and toggle visibility with JS.
- Add ARIA toggling for active role.
- Adjust CSS to avoid layout shift.
- Update role-swapper tests.
- Files:
  - `layouts/partials/startpage.html`
  - `assets/js/role-swapper.js`
  - `assets/css/pages/home.css`
  - `assets/js/__tests__/role-swapper.test.js`

## Validation
- Lighthouse SEO: confirm title/description are as expected for home.
- Search Console URL inspection preview for home.

## Rollback
- Revert the Phase A change in `layouts/partials/head.html` if the SERP title becomes worse.
- Keep Phase B isolated to a separate branch so it can be discarded without touching Phase A.
