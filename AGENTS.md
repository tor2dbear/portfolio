# AGENTS.md

Documentation for AI assistants working with this project.

---

## Project Overview

**Torbjörn Hedberg's Portfolio Website**

- Static site built with Hugo
- Bilingual: Swedish (primary) and English
- Portfolio showcase + client/employer application system
- URL: https://www.tor-bjorn.com/

---

## Tech Stack

- **Hugo** - Static site generator
- **JavaScript** - Vanilla JS modules (ES6+)
- **CSS** - Custom CSS with PostCSS
- **Jest** - Testing framework
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks (lint-staged)

---

## Project Structure

```
/
├── content/              # Hugo content (bilingual)
│   ├── english/         # English content
│   │   ├── about/
│   │   ├── clients/     # Client/employer applications
│   │   ├── contact/
│   │   ├── works/       # Portfolio projects
│   │   └── tags/
│   └── swedish/         # Swedish content (same structure)
│
├── assets/
│   ├── js/              # JavaScript modules
│   │   └── __tests__/   # Jest tests
│   └── css/             # Stylesheets
│
├── static/              # Static assets
│   └── js/              # Pre-compiled JS
│
├── layouts/             # Hugo templates
├── archetypes/          # Content templates
├── docs/
│   └── migrations/      # Migration/refactor plans and checklists
└── config.toml          # Hugo configuration
```

---

## Language System

Hugo multilingual setup defined in `config.toml`:

- **Default language**: English (`en`)
- **Languages**:
  - `en` → `content/english/`
  - `sv` → `content/swedish/`

Content files are mirrored across both language directories with translated content.

**Important**: When creating/editing content, update BOTH language versions unless it's language-specific content.

---

## Client/Employer Application System

Special feature for sending customized job applications with personalized styling using a query parameter-based focus mode.

### How It Works

**Focus Mode System** uses URL query parameters instead of localStorage for a stateless, shareable, SEO-friendly solution.

**1. Client Page Structure**:

```
content/english/clients/deg17/_index.md
content/english/employers/techcorp/_index.md
```

**2. Front Matter**:

```yaml
title: "Work application for UI position at Deg17"
company_name: "deg17" # Used in query params and filtering
preamble: "Introduction text"
body: "Main letter content"
attach_cv: "/images/cvd.pdf"
attach_portfolio: "/images/portfolio_20220812.pdf"
attach_letter: ""
taxonomy_indexes: true # For employer pages
```

**3. Query Parameter Flow**:

**Client Mode**:

```
/clients/deg17/ → /works/project/?view=client&ref=deg17
```

**Employer Mode**:

```
/employers/techcorp/ → /works/project/?view=employer
```

**4. JavaScript Implementation** (`focus-mode.js`):

**a) Detect context**:

- Reads URL parameters: `?view=client&ref=company` or `?view=employer`
- Backward compatibility: `?source=client` (legacy)
- Path detection: `/clients/` or `/employers/` in URL

**b) Apply styling**:

- Adds CSS class `clientpage` or `employerpage` to `#layout`
- Classes trigger CSS to hide menu and adjust layout

**c) Propagate parameters**:

- Automatically adds query params to all internal links
- Maintains focus mode context across navigation
- Updates breadcrumbs with company name from `ref` parameter

**d) Security**:

- Uses `textContent` instead of `innerHTML` to prevent XSS
- URL encoding/decoding for special characters
- Try/catch blocks for error handling

**5. CSS Styling**:

```css
/* Client mode */
#layout.clientpage #menu {
  display: none;
}
#layout.clientpage #main {
  width: 100%;
}
#layout.clientpage .hide-on-client {
  display: none;
}
#layout:not(.clientpage) .show-on-client {
  display: none;
}

/* Employer mode */
#layout.employerpage #menu {
  display: none;
}
#layout.employerpage #main {
  width: 100%;
}
#layout.employerpage .hide-on-employer {
  display: none;
}
#layout:not(.employerpage) .show-on-employer {
  display: none;
}
```

**6. Hugo Taxonomy System**:

**Employers**:

- Uses Hugo taxonomy: `employers: [techcorp]` in project front matter
- Template: `layouts/taxonomy/employer.html`
- Queries projects directly: `{{ range where .Site.RegularPages "Type" "works" }}`
- Filters by company: `{{ if in .Params.employers $companyName }}`

**Clients**:

- Uses Hugo taxonomy: `clients: [deg17]` in project front matter
- Template: `layouts/taxonomy/client.html`
- Same query pattern as employers

**7. Hidden Projects**:

Projects can be visible only on client/employer pages:

```yaml
employers: [techcorp]
hidden: true # Excluded from main portfolio
draft: false
```

Templates filter hidden projects:

- `layouts/works/works.html` - Main portfolio
- `layouts/index.html` - Featured section
- `layouts/partials/related.html` - Related suggestions

**Why Query Parameters?**

- ✅ Stateless - no browser storage needed
- ✅ Shareable URLs maintain context
- ✅ SEO-friendly with canonical tags
- ✅ Works across devices/sessions
- ✅ Easier to debug and test

---

## JavaScript Conventions

### Module Pattern

- One function/feature per file
- Vanilla JavaScript (no frameworks)
- ES6+ syntax
- Example: `focus-mode.js`, `theme.js`, `header-hide.js`, `tabs.js`

### Architecture: modules and seams

The larger subsystems are split into focused modules that talk **only through
named `window.*` seams** — never by sharing a closure. A seam is a small frozen
contract: adding members is fine, renaming or changing signatures breaks
consumers (and the tests that mock the seam ARE the spec).

```
theme.js ─┬─ window.Theme ──────→ terminal.js ─┬─ window.Terminal ──→ terminal-ai.js
          │                                    ├────────────────────→ terminal-flows.js
          ├─→ theme-custom-palette.js          └────────────────────→ terminal-nav.js
          │     (window.ThemeCustomPalette)
          └─→ theme-pantone.js ───→ coty-scale.js
                (window.ThemePantone)  (window.CotyScaleActions)
```

- **`theme.js`** — the theme core (mode, palette, typography, layout, effects,
  icon/meta, init). Publishes `window.Theme` (high-level setters + read-only
  queries) at module eval, and `window.ThemeActions` (settings-dropdown surface)
  at init.
- **`theme-custom-palette.js`** — applies a user-authored palette's runtime CSS
  tokens via `window.ThemeDerive`. One-directional: it never calls back into
  the theme. `theme.js` keeps four thin shims that no-op if it's absent.
- **`theme-pantone.js`** — the Pantone/CotY controller (state machine, playback,
  transport pill) between the settings UI and the `coty-scale.js` engine. It
  registers **no** DOMContentLoaded handler: `theme.js`'s init drives its hooks
  (`initControls`, `reconcileStartupPalette`, `rememberTransportHome`,
  `initTransportUI`) so boot order stays deterministic. The pantone members of
  `window.Theme` are lazy delegators into it.
- **`terminal.js`** — the terminal command engine. Consumes `window.Theme`
  (aliased once at IIFE eval); publishes `window.Terminal`. Its parser
  (`runTerminalCommand`) is pure — it returns `{lines, action}` and the
  executor (`applyTerminalAction`) performs the side effects.
- **`terminal-ai.js` / `terminal-flows.js` / `terminal-nav.js`** — live entirely
  behind `window.Terminal`. Input precedence in the key handler is:
  active flow → ai delegate → shell parser.

**Load order is a contract.** Scripts are listed in `layouts/partials/head.html`
twice (dev `<script>` list and the prod `resources.Concat` slice) and the two
MUST stay in sync: `theme-derive` → `theme-custom-palette` → `theme` →
`theme-pantone` → `terminal` → `terminal-flows` → … → `terminal-nav` →
`terminal-ai-data` → `terminal-ai`. Seam objects are published at module eval,
so a consumer may capture references at its own eval only from modules loaded
before it; everything else resolves lazily at call time (guarded, no-op if the
provider is absent).

**When extracting a new module:** define the seam first (thin wrappers in the
host file, one commit, tests green), then move the code behind it (second
commit). Keep the host's call sites unchanged via shims. Verify with the full
Jest suite, `no-undef` lint (it catches every missed closure reference), and —
for template/CSS changes — a byte-identical `hugo` build diff against the
pre-change baseline (install the production-pinned version:
`pip install hugo==0.154.2`).

### File Naming

- Kebab-case: `focus-mode.js`
- Descriptive names indicating function
- Tests: `<module-name>.test.js`

### Testing

- All modules should have corresponding tests in `assets/js/__tests__/`
- Use Jest with jsdom environment
- Test files mirror module names: `theme.js` → `theme.test.js`

### Code Quality

- ESLint configuration in `eslint.config.js`
- Prettier formatting
- Pre-commit hooks via Husky
- **Prettier trap:** files in `.prettierignore` are there for a reason —
  `layouts/partials/ui-library/` holds `{{ highlight }}` blocks whose
  whitespace IS the rendered output (a prettier pass reformats the page's
  code samples), and the listed layout partials leave tags open that prettier
  would auto-close. Never format them; extend the ignore list when adding
  files with the same properties.

---

## Development Workflow

### NPM Scripts

```bash
npm test              # Run Jest tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

### Hugo Commands

```bash
hugo                  # Build site
hugo server           # Dev server with live reload
hugo server -D        # Include draft content
```

### Pre-commit Hooks

Configured in `package.json` with lint-staged:

- Auto-formats `.js`, `.json`, `.md`, `.html`, `.css`
- Runs ESLint on JavaScript files

---

## Git Workflow (v4)

### Core Principles (Strict)

- **Isolation**: One task = one branch.
- **No Worktrees**: Development happens directly in the repo on a task branch.
- **Verification**: Before editing any file, verify your location and branch.

### Branch Naming

- **Format**: `<type>/<slug>-<sessionId>` (required, e.g., `feature/login-system-a1b2`)
- **Types**: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`
- **Session ID**: Generate using `openssl rand -hex 2`.

### Creating a New Task

```bash
git switch master
git pull
git switch -c <type>/<slug>-<sessionId>
```

### Working in a Branch (The "Gold" Rules)

1. **Verification Step**: Always run `pwd`, `git rev-parse --show-toplevel` and `git branch --show-current` before the first edit in a session to confirm repo root + branch.
2. **Scope**: Only modify files related to the current task branch.
3. **Commits**: All `git add`, `git commit`, and `git push` commands must be executed from the repo root.

### Syncing & Updates

To bring in latest changes from master:

```bash
git fetch origin
git merge origin/master # Avoid rebase unless explicitly requested.
```

### Finishing a Task (Cleanup)

Once the PR is merged on GitHub:

```bash
# Delete Branch:
git branch -d <branch-name>

# Prune:
git fetch --prune
```

### Pull Request Description Preference

- Default format: **English Markdown**.
- Always provide a ready-to-paste GitHub PR body (`## Summary`, `## Changes`, `## Testing`) when finishing a PR-related task, even if the user does not explicitly ask for it.

### Safety Guardrails

- **Never** run two agents in the same repo folder at the same time.

---

## Deployment & Preview System

### Production

- **URL**: https://www.tor-bjorn.com/
- **Host**: Netlify (main/master branch only)
- **Build**: Automatic on push to main/master

### Preview Builds

Preview builds use **Netlify Deploy Previews**. These are non-metered on Netlify
(they consume no credits), so there is no longer a reason to host previews on
GitHub Pages — keeping the repo free to go private without breaking previews.

**How it works**:

1. Opening/updating a PR against main/master triggers a Netlify Deploy Preview
2. Hugo builds with the deploy-preview baseURL (`--buildDrafts --buildFuture`)
3. Netlify posts the preview link as a PR check / comment automatically

The build gate lives in `scripts/netlify/ignore.sh`: production and deploy
previews always build; other branch deploys are skipped unless the commit
message contains `[netlify]`.

### Forcing a Netlify build on a non-PR branch

Branch deploys (pushes to a branch without an open PR) are skipped by default.
To force one, **add `[netlify]` to your commit message**:

```bash
git commit -m "feat: my changes [netlify]"
```

### Configuration Files

- **Netlify**: `netlify.toml` (production + deploy previews) and
  `scripts/netlify/ignore.sh` (build gate)
- **GitHub Actions**: `.github/workflows/pr-checks.yml` (lint, tests, build,
  Lighthouse/axe quality gate)

---

## Content Guidelines

### Writing Articles (`/writing/` and `/texter/`)

**Required front matter for every English writing article** (`content/english/writing/*.md`):

```toml
+++
title = "Article Title"
date = "2026-01-01"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "Subtitle / preamble shown below the title"
tags = ["design", "tools", "process"]
topics = []
slug = "writing"
translationKey = "article-slug-used-as-key"
+++
```

**Required front matter for every Swedish writing article** (`content/swedish/texter/*.md`):

```toml
+++
title = "Artikelns titel"
date = "2026-01-01"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "Underrubrik / ingress"
tags = ["design", "verktyg", "process"]
topics = []
slug = "texter"
translationKey = "article-slug-used-as-key"
+++
```

**Critical rules**:

- `slug = "writing"` is **required** on all English writing articles — without it Hugo generates a wrong URL (e.g. `/writing/article-slug/article-slug/` instead of `/writing/article-slug/`). Every file in the directory must set this explicitly.
- `slug = "texter"` is the equivalent requirement for Swedish articles.
- `translationKey` must match exactly between the EN and SV versions — this is how Hugo and the templates link them as translations of each other.

**Untranslated articles (English-only)**:
When a Swedish translation is not ready, set `hidden = true` on the Swedish file. Effects:

- The English article appears on `/sv/texter/` with an "English" badge and topic tags translated via `data/tag_translations.toml`
- A Swedish lang-notice ("Denna text finns inte på svenska.") is shown when the user arrives from the Swedish list via `?from=sv`
- The language switcher is hidden on the English article (no misleading fallback link)
- The Swedish file is preserved in the repo for future editing — change to `hidden = false` when ready to publish

**Tag translations** (`data/tag_translations.toml`): Maps English tag names to Swedish equivalents for display on the Swedish list. Update this file when new English tags are introduced.

---

### Portfolio Projects (`/works/`)

Front matter structure:

```yaml
title: "Project Title"
date: 2024-01-01
tags: ["design", "branding", "ui-ux"]
featured_image: "/images/project/hero.jpg"
```

Project info block (renders via `layouts/partials/project-info.html`):

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

- `role` is a single string (comma-separated if multiple roles).
- `details` keys use `snake_case` for consistent labels.
- Omit `client` for self-initiated/personal projects.

### Client Applications (`/clients/`)

Front matter structure:

````yaml
title: "Application title"
company_name: "company-slug"
preamble: "Introduction text"
body: "Main content"
attach_cv: "/path/to/cv.pdf"
attach_portfolio: "/path/to/portfolio.pdf"
```yaml
attach_cv: "/path/to/cv.pdf"
attach_portfolio: "/path/to/portfolio.pdf"
attach_letter: "/path/to/letter.pdf"
````

### Images

- **Responsive Images**: ALWAYS use the `headerimage` partial or Hugo's `render-image` hook.
  - **Do NOT** use raw `<img>` tags for content images.
  - The `headerimage` partial automates `srcset` generation and wraps the image in a `<picture>` tag.
  - **Styles**: The `<picture>` wrapper is REQUIRED for certain CSS effects (e.g., `::after` pseudo-elements for backgrounds).
  - **Border Radius**: Apply `border-radius` and `overflow: hidden` to the `<picture>` container (not the `<img>`). This ensures `::after` overlays and the image are clipped to the corners. Use `--radius-*` tokens.
- **Header Images**: Use `.Params.header_image` in front matter and call `{{ partial "headerimage.html" . }}` in templates.

### Gallery Shortcode

Wrap Markdown images in a layout-aware grid:

```markdown
{{< gallery layout="1+1" place="wide" >}}
![Alt](image-1.webp)
![Alt](image-2.webp)
{{< /gallery >}}
```

Supported layouts: `full`, `1+1`, `2x2` (default: `full`).

- `layout` controls internal gallery structure.
- `place` controls AD/grid placement (`full`, `wide`, `prose`, `article`, `narrow`, `aside`, `aside-left`, `bleed`).
- If `place` is omitted, default is `full` for `layout="full"` and `wide` for other layouts.

### Tag Links

- Tag URLs are section-scoped (`/works/tags/`, `/writing/tags/`, `/texter/tags/`).

---

## CSS Architecture

### File Layout

- `assets/css/tokens/primitives.css` - Raw values (never overridden by themes)
- `assets/css/tokens/semantic.css` - Canonical semantic tokens
- `assets/css/tokens/components.css` - Component exceptions
- `assets/css/tokens/legacy.css` - Legacy aliases (deprecated)
- `assets/css/dimensions/mode/*.css` - Mode overrides (`light`, `dark`)
- `assets/css/dimensions/palette/*.css` - Palette overrides (`standard`, `forest`, `mesa`, `pantone`, `coty`)
- `assets/css/dimensions/palette/previews.css` - Palette preview tokens for dropdown (mode-aware, not tied to active palette)
- **Per-project style (works pages)** — a work project can pin its own color theme, typography preset and reading layout via a `worktheme:` front matter map, set server-side in `header.html` (no FOUC, no localStorage), validated (unknown values ignored):

  ```yaml
  worktheme:
    color: rose # theme id from data/work-themes.toml
    typography: refined # editorial | refined | expressive | technical | system
    layout: editorial # column | editorial | index  (terminal excluded — session-wide mode)
  ```

  `layout` sits inside the map on purpose: a top-level `layout` key is reserved by Hugo for template selection.

  Each of the three is independent and applies differently:

  - **Color** (`data-work-theme` on `<html>`) — `assets/templates/work-theme-scales.css` + `data/work-themes.toml` generate light + dark token blocks per theme. A **base layer**: selectors carry `:not([data-palette="pantone"])` so an explicit Pantone palette wins (a custom palette's inline styles win too); on the default palette the work theme paints the page. Each theme is a full 12-step light + dark scale (`role_mode` `surface` or `primary`); a theme may also add an `accent_scale_*` for a **duo** model — a two-hue identity where the base scale paints the surface/text and the accent scale drives every accent role (primary, links, tags, action), e.g. the `utblick` theme's rose paper + green ink. Contrast-gated in both modes by `assets/css/__tests__/work-theme-contrast.test.js`.
  - **Typography** (`data-project-typography` on `.works-post`, in `works/single.html`) — **content-scoped**: it typesets only the project body (title, description, meta, tags, `.post-content`, `.project-info`), never the chrome, breadcrumbs, related items or footer. Implemented by extending each `dimensions/typography/*.css` preset's selector to a second, scoped variant — one source of truth, no duplication. It's an **overridable default**: the scoped variant is gated by `:root[data-project-typeset="on"]`, which the `head.html` pre-paint script sets only when the visitor has no stored typography choice (and `theme.js`'s `setTypography` drops the moment they pick a font). So a visitor's own font choice wins everywhere, including the project body; with no choice, the chrome stays on the site default while the project body shows its preset.
  - **Layout** (`data-work-layout` on `<html>`) — a page-wide **overridable default**. The `head.html` pre-paint script and `theme.js` init read it only when the visitor has no explicit stored choice, and never persist it — so a visitor's own selection wins and leaving the page reverts to the global default (`column`). `terminal` is excluded (session-wide mode).

- `assets/css/utilities/typography.css` - Typography utilities
- `assets/css/utilities/layout.css` - Layout utilities
- `assets/css/utilities/grid.css` - 12-column subgrid + art-direction placement API
- `assets/css/utilities/display.css` - Visibility helpers
- `assets/css/utilities/icons.css` - SVG sprite icon utilities
- `assets/css/components/button.css` - Button component
- `assets/css/components/footer.css` - Footer component
- `assets/css/components/theme-dropdown.css` - Theme dropdown
- `assets/css/components/language-dropdown.css` - Language dropdown
- `assets/css/components/settings-dropdown.css` - Combined settings dropdown (xs only)
- `assets/css/components/accordion.css` - Accordion component
- `assets/css/components/tabs.css` - Tabs component
- `assets/css/pages/home.css` - Homepage styles
- `assets/css/pages/ui-library.css` - UI library page styles
- `assets/css/pages/palette-generator.css` - Internal palette generator page styles
- `assets/css/style.css` - Remaining component styles
- `assets/css/clientpage.css` - Client/employer page tweaks
- `assets/css/print.css` - Print styles

### Client-specific CSS

```css
/* Show/hide elements based on client context */
#layout.clientpage .hide-on-client {
  display: none;
}
#layout:not(.clientpage) .show-on-client {
  display: none;
}

/* Layout adjustments */
#layout.clientpage #menu {
  /* ... */
}
#layout.clientpage #main {
  /* ... */
}
```

### Token System (Current)

- Canonical tokens are defined in `assets/css/tokens/semantic.css`.
- Component exceptions live in `assets/css/tokens/components.css`.
- Mode/palette overrides live in `assets/css/dimensions/mode/*` and `assets/css/dimensions/palette/*` and should only override canonical tokens.

### Palette System (Role-Based)

The project now uses a role-based palette model with a baseline recipe + per-palette specs.

**Data files**:

- `data/theme-baseline.toml` - Baseline role recipe (contrast steps + default sources).
- `data/themes/*.toml` - Palette specs (`standard`, `forest`, `mesa`) with:
  - `[roles]` (`text`, `surface`, `primary`, `secondary`)
  - `[policies]` (`tone_mode`, `surface_profile`, `form_policy`, `image_treatment`)
  - `[overrides]` optional token overrides
  - `[component_overrides]` optional component exceptions

**Runtime behavior**:

- `assets/js/palette-generator.js` applies role/policy output to semantic CSS vars live in browser.
- Theme menu palette selection updates both page theme and generator preset.
- A saved custom palette is persisted in `localStorage` and exposed as `custom` in the palette menu.
- Color of the Year year-selection is persisted in `localStorage` as `theme-coty-year`.

**Current role intent**:

- `text`: readable typography/contrast
- `surface`: page/surface/tag backgrounds and related muted tones
- `primary`: interactive/accent actions
- `secondary`: optional complementary accent (used mainly for duo-tone themes)
- `text-muted`: derived globally via `color-mix` from neutral gray + `--surface-ink-strong` to reduce saturation noise while keeping palette character

**Guidelines**:

- Prefer role/policy changes over per-token overrides.
- Keep component-specific overrides minimal and documented.
- Keep `standard` as reference baseline when evaluating drift in other palettes.

### CSS Load Order (head.html)

1. tokens (primitives → semantic → components → legacy)
2. dimensions (mode → palette → palette previews)
3. utilities (typography → layout → grid → display → icons)
4. components (button → footer → theme-dropdown → language-dropdown → settings-dropdown)
5. pages (home → ui-library → style → clientpage → print)

### SVG Sprite System

All icons use a centralized SVG sprite system for better performance and maintainability.

**Sprite File**: `static/img/svg/sprite.svg`

**Available Icons**:

- `icon-pdf` - PDF document icon
- `icon-download` - Download/circle icon
- `icon-new-window` - External link/new window icon
- `icon-light` - Light mode sun icon
- `icon-dark` - Dark mode moon icon
- `icon-system` - System preference icon
- `icon-mode-micro` - Micro mode icon (10x10)
- `icon-palette-micro` - Micro palette icon (10x10)
- `icon-language-micro` - Micro language icon (10x10)
- `icon-arrow-left` - Left arrow navigation
- `icon-arrow-right` - Right arrow (used in buttons)
- `icon-language` - Language selector icon

**Usage Patterns**:

```html
<!-- Direct usage with .icon class -->
<svg class="icon">
  <use href="/img/svg/sprite.svg#icon-pdf"></use>
</svg>

<!-- With size variants -->
<svg class="icon icon--sm"></svg>
<!-- 1rem -->
<svg class="icon icon--xs"></svg>
<!-- 10px -->
<svg class="icon icon--lg"></svg>
<!-- 2rem -->
<svg class="icon icon--xl"></svg>
<!-- 2.5rem -->

<!-- Legacy containers (backward compatibility) -->
<div class="pdf-icon">
  <svg><use href="/img/svg/sprite.svg#icon-pdf"></use></svg>
</div>
```

**Adding New Icons**:

1. Add `<symbol id="icon-name" viewBox="...">` to `static/img/svg/sprite.svg`
2. Use sprite reference: `<svg><use href="/img/svg/sprite.svg#icon-name"></use></svg>`
3. Optionally add legacy container class to `assets/css/utilities/icons.css`
4. Document in UI Library (`layouts/ui-library/single.html`)

**Icon Styling**:

- Icons inherit color from parent via `currentColor`
- Size controlled by `width`/`height` or `.icon` size variants
- Legacy containers (`.pdf-icon`, `.language-icon`, etc.) provide consistent 1.5rem sizing

### Sticky Footer Pattern

The site uses CSS Grid for a sticky footer that works even with short content:

```css
#layout {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto 1fr auto; /* header, main (fills space), footer */
  grid-template-areas: "header" "main" "footer";
}
```

This ensures the footer stays at the bottom of the viewport even when page content is minimal (e.g., 404 page).

### Grid Art-Direction API

The site uses a 12-column subgrid with a variable-driven placement system for editorial layout control.

**Core concept**: Every child of `.use-subgrid` reads `--col` and `--row` custom properties to determine its grid placement. Set via classes (`.place-prose`) or inline styles (`style="--col: col-start 3 / span 8;"`).

**Placement presets** (defined in `grid.css`):

- `.place-full` — col 1–12 (full content width)
- `.place-wide` — col 1–10 (images, figures)
- `.place-prose` — col 1–8 (running text, replaces max-width: 70ch)
- `.place-article` — text article flow (xl: col 3–10, lg: col 2–11, md: col 1–12, sm: full width)
- `.place-narrow` — col 2–9 (pull-quotes, callouts)
- `.place-aside` — col 9–12 (sidebar, metadata)
- `.place-aside-left` — col 1–4 (left sidebar)
- `.place-bleed` — full-start / full-end (break out of content area)

**Responsive tiers** (cascade with fallback):

- `--col` — Desktop (default)
- `--col-lg` — Large (≤79.9375em), falls back to `--col`
- `--col-md` — Tablet (≤63.9375em), falls back to `--col`
- `--col-sm` — Mobile (≤47.9375em), falls back to full width

**Stepped text** ("tripp-trapp-trull" staircase patterns):

- `.stepped-3-3` — offset 3, span 3 (clean staircase)
- `.stepped-2-4` — offset 2, span 4 (overlapping)
- `.stepped-4-4` — offset 4, span 4 (wide non-overlapping)
- `.stepped-1-6` — offset 1, span 6 (slow drift)

**Rules**:

- Text measure (width) is controlled by grid placement, not `max-width` in `ch`. The `.prose-measure` class exists as a safety net for content outside the grid.
- Rows must remain content-driven (`auto` or `max-content`). Never use `grid-auto-rows: 1fr`.
- Mobile (≤47.9375em) switches from 12 to 4 columns.

### Breakpoints

- Units: em-based, desktop-first with max-width queries.
- Naming: xs, sm, md, lg, xl.
- Values (base 16px):
  - xs: 0-479px (max-width: 29.9375em)
  - sm: 480-767px (max-width: 47.9375em)
  - md: 768-1023px (max-width: 63.9375em)
  - lg: 1024-1279px (max-width: 79.9375em)
  - xl: 1280px+ (no max-width)
- Comment convention: label each media block, e.g. `/* sm: <= 47.9375em */`.
- Bottom sheet UI for theme/language dropdowns: sm and xs only.

### Theming Dimensions (Current)

- HTML data attributes drive theming:
  - `data-mode="light|dark"`
  - `data-palette="standard|forest|mesa|pantone|coty|custom"`
  - `data-coty-year="YYYY"` (active Color of the Year scale)
- Add new dimensions by creating `assets/css/dimensions/<dimension>/*.css` and wiring in `layouts/partials/head.html`.
- When adding a new palette, also add its preview tokens in `assets/css/dimensions/palette/previews.css` so the theme dropdown can show palette dots in both modes.

### Pantone Player & Transport

- Pantone uses a separate state model from the transport UI:
  - Pantone state: `inactive | paused | playing`
  - Transport UI state: `expanded | collapsed`
- Do not treat “Pantone active” as equivalent to “playing”. `paused` keeps Pantone active and visually applied without autoplay.
- Theme/settings `Pantone` buttons (`data-js="coty-mode-toggle"`) toggle Pantone mode on/off. Activating Pantone enters `paused` by default.
- Footer transport controls handle playback (`play/pause/stop/prev/next/shuffle`) and should not be used as the source of truth for Pantone activation.
- Transport UI state is persisted in `localStorage` under `theme-pantone-transport-ui`.
- `<html>` attributes `data-theme-panel-open` and `data-settings-panel-open` are part of the transport presentation logic. The transport hides while bottom sheets are open and resumes after they close.
- The collapsed trigger must remain keyboard- and touch-accessible. The visually hidden transport body should not capture pointer events while collapsed.

### Keyboard Chords

- Keyboard chords are implemented in `assets/js/keyboard-chords.js` and rendered from `data-shortcut` hints in the UI.
- Current chord map:
  - `G` → toggle grid
  - `P` → toggle Pantone mode
  - `M + L/D/S` → mode (`light`, `dark`, `system`)
  - `T + E/R/X/T/S` → typography (`editorial`, `refined`, `expressive`, `technical`, `system`)
  - `E + P/G/B/N/M` → effects (`pantone`, `grid`, `blend`, `noise`, `motion`)
  - `L + E/S` → language (`en`, `sv`)
- If the order or naming of mode/typography/effect options changes, update both the chord logic and the visible `data-shortcut` hints in the theme/settings panels.

### Theme Baseline Data (WIP)

- Baseline role recipe lives in `data/theme-baseline.toml`.
- Per-theme role mappings live in `data/themes/*.toml` (`standard`, `forest`, `mesa`, `pantone`).
- This data model defines:
  - role families (`text`, `surface`, `primary`, `secondary`)
  - baseline contrast steps per role
  - optional per-theme overrides
  - optional component overrides for intentional exceptions
- Current status: wired to `assets/js/palette-generator.js` for live browser previews and custom palette export/save.

---

## Naming Conventions

### Tokens (CSS Custom Properties)

- Prefix by domain: `text`, `bg`, `border`, `surface`, `brand`, `status`, `state`, `shadow`, `size`, `image`, `component`.
- Contrast scale order: `subtle` → `muted` → `default` → `strong`.
- Avoid overloaded prefixes like `text-*` for font sizes. Use `font-*` for typography sizes.
- Canonical tokens live in `assets/css/tokens/semantic.css`.
- Accent roles are canonicalized as `--accent-primary`, `--accent-primary-strong`, `--accent-secondary`, and `--accent-secondary-strong`.
- Keep compatibility aliases (`--brand-primary`, `--text-accent`) mapped to accent roles unless a migration explicitly removes them.
- Use component-role tokens only for intentional exceptions (e.g. `--component-nav-cta-*`), not for general theming.
- Legacy aliases live in `assets/css/tokens/legacy.css` and must include `/* deprecated */`.
- Legacy aliases map one-to-one to canonical tokens; remove legacy only after confirming no references remain.
- **State-layer tokens (state-\*)** must be applied as overlays (e.g. `background-image: linear-gradient(var(--state-on-light-hover), var(--state-on-light-hover))`) on top of existing backgrounds, not as replacement background colors.

### Button Link Styling

When styling links, always exclude `.button` elements to prevent visited link colors from overriding button styles:

```css
a:visited:not(.button) {
  color: var(--text-default);
}
```

This pattern is used in `assets/css/utilities/typography.css`.

### CSS / HTML Naming Spec

- **Utilities**: short, functional, scale-based names (e.g. `mt-24`, `grid-1-3`, `text-sm`).
- **Components**: block + element naming (BEM-light), e.g. `brand`, `brand__link`, `brand__word`, `brand__hyphen`.
- **Variants**: modifier suffixes, e.g. `button--primary`, `brand__word--lead`.
- **State**: `is-*` / `has-*`, e.g. `is-active`, `has-client`.
- **JS hooks**: prefer `data-js="hook-name"`; avoid styling via IDs. Use IDs only for anchors or form fields.

### CSS / HTML

- Class names and IDs: kebab-case (e.g. `project-card`, `#main-nav`).
- `data-*` attributes: kebab-case (e.g. `data-focus-mode`).
- CSS custom properties: kebab-case with `--` prefix (e.g. `--bg-surface`).

---

## Testing

### Test Coverage

- Jest configuration: `jest.config.js`
- Setup: `jest.setup.js`
- Environment: jsdom (browser simulation)

### Writing Tests

```javascript
// Example from darkmode.test.js
describe("darkmode functionality", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="layout"></div>';
  });

  test("should toggle dark mode class", () => {
    // Test implementation
  });
});
```

### Running Tests

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- darkmode        # Run specific test
npm run test:coverage       # Generate coverage report
```

---

## Important Notes for AI Assistants

1. **Bilingual Content**: Always consider both English and Swedish versions when modifying content
2. **Focus Mode**: Query parameter-based system (`?view=client&ref=company` or `?view=employer`) - don't break parameter propagation
3. **CSS Classes**: The `clientpage` and `employerpage` classes are critical for focus mode styling
4. **Module Pattern**: Keep JavaScript modular - one responsibility per file
5. **Testing**: Write tests for new JavaScript functionality
6. **Hugo Context**: This is a static site - no server-side logic
7. **Git Conventions**: Follow the branch format defined in this document
8. **Taxonomy System**: Employers/clients use Hugo taxonomies - projects need taxonomy tags to appear on company pages
9. **Hidden Projects**: Respect `hidden: true` parameter - must be filtered in main portfolio templates
10. **Writing slug**: Every English writing article needs `slug = "writing"` and every Swedish texter article needs `slug = "texter"` in front matter — Hugo will generate wrong URLs without it
11. **Request Handling**: Follow the "Request Handling Guidelines" section below - propose plans for analysis requests, implement directly only for clear action requests
12. **Keep AGENTS.md Current**: If you change structure, workflows, or conventions, update this file accordingly

---

## Request Handling Guidelines

### When to Propose vs. Implement

**Key Principle**: Distinguish between requests for analysis/suggestions and requests for direct action.

### Language Cues

**Analysis/Proposal Requests** (respond with plan, wait for approval):

- "Can you analyze..."
- "What would be the best way to..."
- "How should I..."
- "Could you suggest..."
- "What do you recommend..."
- "Föreslå hur..." (Swedish: "suggest how...")
- Questions that ask "how" or "what" about approach

**Direct Action Requests** (proceed with implementation):

- "Please add..."
- "Create a..."
- "Update the..."
- "Fix the..."
- "Lägg till..." (Swedish: "add...")
- "Skapa..." (Swedish: "create...")
- Clear imperative commands

### Response Pattern for Analysis Requests

When user asks for analysis or suggestions:

1. **Analyze**: Use appropriate tools (Explore agent, Read, Grep) to understand current state
2. **Present findings**: Summarize what you discovered about the codebase
3. **Propose solution**: Present a clear implementation plan with:
   - Files to be created/modified
   - Structural changes needed
   - Configuration updates required
   - Example code/content snippets
   - Trade-offs and alternatives if applicable
4. **Ask for confirmation**: "Does this approach look good? Should I proceed with implementation?"
5. **Wait for approval**: Do not proceed until user explicitly confirms

### Response Pattern for Action Requests

When user gives clear implementation instructions:

1. **Acknowledge**: Briefly confirm what you'll do
2. **Plan** (if complex): Use TodoWrite for multi-step tasks
3. **Execute**: Implement the requested changes
4. **Report**: Summarize what was completed

### Gray Areas

When in doubt, **default to proposing first**. It's better to over-communicate than to implement unwanted changes.

**Example gray area**: "I want to add a blog section" could be:

- Analysis request: User wants to discuss options and structure first
- Action request: User has decided and wants it done immediately

**Resolution**: If the request is substantial (affects multiple files, adds new features, changes site architecture), treat it as an analysis request and propose a plan first, even if the wording seems action-oriented.

### Handling Swedish Language Requests

The same principles apply to Swedish requests. Common Swedish phrases:

- **Analysis**: "Kan du analysera...", "Hur skulle jag...", "Vad är bästa sättet...", "Föreslå hur..."
- **Action**: "Lägg till...", "Skapa...", "Uppdatera...", "Fixa...", "Implementera..."

---

## Common Tasks

### Adding a New Portfolio Project

1. Create directory: `content/english/works/project-slug/`
2. Add `index.md` with front matter
3. Mirror in Swedish: `content/swedish/works/project-slug/`
4. Add images to appropriate location
5. Test build: `hugo`

### Adding a New Client Application

1. Create directory: `content/english/clients/company-slug/`
2. Add `_index.md` with client front matter
3. Ensure `company_name` matches company slug
4. Mirror in Swedish: `content/swedish/clients/company-slug/`
5. Add PDF attachments to `static/images/`
6. Tag relevant projects: `clients: [company-slug]` in project front matter
7. Test focus mode: `/clients/company-slug/` → click project → verify `?view=client&ref=company-slug`

### Adding a New Employer Application

1. Create directory: `content/english/employers/company-slug/`
2. Add `_index.md` with employer front matter (include `taxonomy_indexes: true`)
3. Ensure `company_name` matches company slug
4. Mirror in Swedish: `content/swedish/employers/company-slug/`
5. Add PDF attachments to `static/images/` or as page bundle resources in the employer folder
6. Tag relevant projects: `employers: [company-slug]` in project front matter
7. Optionally mark projects as `hidden: true` to exclude from main portfolio
8. Test focus mode: `/employers/company-slug/` → verify projects display → click project → verify `?view=employer`
9. Optionally create portfolio-print page (see "PDF Export & Print System" section)

---

## CV System

The CV is split into modular partials for reuse across different contexts:

### Partials Structure

```
layouts/partials/
├── about_cv_base.html      # Shared sections (Work, Skills, Education, etc.)
├── about_cv.html           # Short version for about/start page
└── about_cv_extended.html  # Full version for employer/client pages
```

### Usage

- **Start page / About**: Uses `about_cv.html` (includes base only)
- **Employer/Client pages**: Uses `about_cv_extended.html` (includes base + extra sections)

### Extended CV Sections

The extended version adds (with bilingual support):

- Freelance assignments
- Non-profit work
- Languages
- Driver's license
- Software skills
- Programming skills
- Selected experience

### Language Support

Extended CV uses `{{ if eq .Language.Lang "sv" }}` conditionals for bilingual content.

### Updating CV Content

- **Shared sections**: Edit `about_cv_base.html` (updates everywhere)
- **Extended-only sections**: Edit `about_cv_extended.html`

---

## PDF Export & Print System

The site supports generating PDFs via browser print (Ctrl+P → Save as PDF).

### Print Styling

**File**: `assets/css/print.css`

**Features**:

- Hides navigation, footer, sidebar elements
- Optimizes typography for A4 print
- Adds print-header with contact info
- Adds print-footer with page URL
- Prevents orphaned headings (`break-after: avoid`)

### Print Header (Contact Info)

Uses the existing `layouts/partials/contact_info.html` partial:

- Styled differently for print (smaller fonts, border-bottom)
- Icon hidden in print
- No separate partial needed - single source of truth

### Print Footer

- Shows page URL for reference
- Uses `position: fixed` to appear on all pages (browser support varies)

### Portfolio Print Page

A dedicated page for printing all tagged projects for an employer/client.

**URL pattern**: `/employers/[company]/portfolio-print/` or `/clients/[company]/portfolio-print/`

**Content file structure**:

```yaml
# content/english/employers/techcorp/portfolio-print.md
---
title: "Portfolio – TechCorp"
type: "portfolio-print"
company_name: "techcorp"
taxonomy: "employers"
back_url: "/employers/techcorp/"
index: false
---
```

**Layout**: `layouts/portfolio-print/single.html`

### Creating Portfolio-Print for New Employer/Client

1. Create `portfolio-print.md` in the employer/client content folder
2. Set `type: "portfolio-print"`
3. Set `company_name` to match the employer/client slug
4. Set `taxonomy` to either "employers" or "clients"
5. Set `back_url` to the parent employer/client page
6. Mirror in other language folder

### PDF Generation Workflow

1. Navigate to employer/client page
2. Press Ctrl+P (Chrome recommended for best support)
3. Select "Save as PDF"
4. Upload PDF to employer/client folder as page bundle resource
5. Reference in front matter: `attach_letter: "filename.pdf"`

### Download Cards

**Partial**: `layouts/partials/download-card.html`

- Supports both absolute paths (`/images/file.pdf`) and page bundle resources (`file.pdf`)
- Used in employer/client sidebars for PDF downloads

### Modifying JavaScript

1. Edit module in `assets/js/`
2. Update/create test in `assets/js/__tests__/`
3. Run tests: `npm test`
4. Run linting: `npm run lint:fix`
5. Pre-commit hooks will format automatically

### 404 Pages

Hugo generates bilingual 404 pages:

- English: `/404.html`
- Swedish: `/sv/404.html`

**GitHub Pages Limitation**: GitHub Pages only serves `/404.html` for all 404 errors.

**Solution**: A JavaScript redirect (`static/js/404-redirect.js`) detects Swedish paths and redirects:

```javascript
// If URL starts with /sv/, redirect to Swedish 404
if (path.startsWith("/sv/") && !path.endsWith("/404.html")) {
  window.location.replace("/sv/404.html");
}
```

**Template**: `layouts/404.html`

- Uses `.Lang` to show correct language content
- Language dropdown uses `.Kind "404"` to detect 404 pages and link directly to other language's 404.html

### UI Library

**Access**: `/ui-library/` (English) or `/sv/ui-library/` (Swedish)
**Purpose**: Internal documentation of design tokens, components, and grid system
**Not Indexed**: The page has `noindex: true` and is not linked from main navigation

**Structure**:

- **Tokens Tab**: All color scales (primitives, brand, semantic), typography, spacing
- **Grid Tab**: 12-column subgrid examples, art-direction placement presets, stepped text patterns
- **Components Tab**: Live component examples with meta-info (classes, files, tokens)
- **Utilities Tab**: Typography and spacing utilities

**Adding a New Component to UI Library**:

1. Extract component CSS to `assets/css/components/[component].css`
2. Import in `layouts/partials/head.html` (maintain load order in both the dev `<link>` list and the production concat slice)
3. Add accordion in Components tab (`layouts/ui-library/single.html`)
4. Include component meta-info:
   - **Classes**: List all variant classes (e.g., `.button--primary`)
   - **File**: Path to component CSS file
   - **Tokens**: List tokens used by component
5. Add live examples showing all states (default, hover, active, disabled)
6. Test in browser at `/ui-library/`

**Component Documentation Pattern**:

```html
<div class="component-doc">
  <div class="component-meta mb-16">
    <dl class="meta-list">
      <div class="meta-item">
        <dt>Classes:</dt>
        <dd><code>.component</code>, <code>.component--variant</code></dd>
      </div>
      <div class="meta-item">
        <dt>File:</dt>
        <dd><code>assets/css/components/component.css</code></dd>
      </div>
      <div class="meta-item">
        <dt>Tokens:</dt>
        <dd><code>--token-name</code>, <code>--another-token</code></dd>
      </div>
    </dl>
  </div>
  <div class="component-examples">
    <!-- Live examples here -->
  </div>
</div>
```

---

## Resources

- **Hugo Docs**: https://gohugo.io/documentation/
- **Repository**: https://github.com/tor2dbear/portfolio
- **Website**: https://www.tor-bjorn.com/
- **Contact**: tb.hedberg@gmail.com

---

Last updated: 2026-05-09
