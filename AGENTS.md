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
company_name: "deg17"           # Used in query params and filtering
preamble: "Introduction text"
body: "Main letter content"
attach_cv: "/images/cvd.pdf"
attach_portfolio: "/images/portfolio_20220812.pdf"
attach_letter: ""
taxonomy_indexes: true          # For employer pages
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
#layout.clientpage #menu { display: none; }
#layout.clientpage #main { width: 100%; }
#layout.clientpage .hide-on-client { display: none; }
#layout:not(.clientpage) .show-on-client { display: none; }

/* Employer mode */
#layout.employerpage #menu { display: none; }
#layout.employerpage #main { width: 100%; }
#layout.employerpage .hide-on-employer { display: none; }
#layout:not(.employerpage) .show-on-employer { display: none; }
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
hidden: true              # Excluded from main portfolio
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
- Example: `focus-mode.js`, `darkmode.js`, `header-hide.js`

### File Naming
- Kebab-case: `focus-mode.js`
- Descriptive names indicating function
- Tests: `<module-name>.test.js`

### Testing
- All modules should have corresponding tests in `assets/js/__tests__/`
- Use Jest with jsdom environment
- Test files mirror module names: `darkmode.js` → `darkmode.test.js`

### Code Quality
- ESLint configuration in `eslint.config.js`
- Prettier formatting
- Pre-commit hooks via Husky

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

## Git Workflow (v3)

### Core Principles (Strict)
- **Isolation**: One task = one branch = one worktree.
- **Mandatory Worktrees**: Parallel tasks MUST use separate worktrees. Branches alone are insufficient for parallel AI agents.
- **Hierarchy**: The repo root is for management ONLY. Development happens ONLY inside worktrees.
- **Verification**: Before editing any file, verify your location.

### Repository Layout & Setup
- The repository root MUST have `worktrees/` added to `.gitignore`.
- Active development occurs in `worktrees/<branch-name>/`.
- **Optional**: Add `**/worktrees/**: true` to VS Code `files.exclude` to prevent cross-contamination in searches.

### Branch Naming
- **Format**: `<type>/<slug>-<sessionId>` (e.g., `feature/login-system-a1b2`)
- **Types**: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`
- **Session ID**: Generate using `openssl rand -hex 2`.

### Creating a New Task (Automated)
Run the automation script from the repo root:
```bash
./new-task.sh <type> <slug>
# Example: ./new-task.sh feature login-page
```

### Creating a New Task (Manual Fallback)
```bash
git switch main
git pull
# Format: worktrees/<slug>-<sessionId>
git worktree add worktrees/<slug>-<sessionId> -b <type>/<slug>-<sessionId>
```

### Working in a Worktree (The "Gold" Rules)
1. **Verification Step**: Always run `pwd`, `git rev-parse --show-toplevel` and `git branch --show-current` before the first edit in a session to verify you are in a `worktrees/` subfolder.
2. **Scope**: Only modify files inside your assigned `worktrees/<branch-name>/` folder.
3. **Commits**: All `git add`, `git commit`, and `git push` commands must be executed from within the worktree directory.

### Syncing & Updates
To bring in latest changes from main (inside the worktree):
```bash
git fetch origin
git merge origin/main # Avoid rebase unless explicitly requested.
```

### Finishing a Task (Cleanup)
Once the PR is merged on GitHub:
```bash
# Remove Worktree: (from repo root).
git worktree remove worktrees/<folder-name> --force

# Delete Branch:
git branch -d <branch-name>

# Prune:
git fetch --prune
```

### Safety Guardrails
- **Never** run two agents in the same worktree folder.
- **Never** manually move files between worktrees.
- If `git status` in repo root shows untracked files in `worktrees/`, the `.gitignore` is missing or failing. Stop and fix.

---

## Content Guidelines

### Portfolio Projects (`/works/`)
Front matter structure:
```yaml
title: "Project Title"
date: 2024-01-01
tags: ["design", "branding", "ui-ux"]
featured_image: "/images/project/hero.jpg"
```

### Client Applications (`/clients/`)
Front matter structure:
```yaml
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
```

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
{{< gallery layout="1+1" >}}
![Alt](image-1.webp)
![Alt](image-2.webp)
{{< /gallery >}}
```
Supported layouts: `full`, `1+1`, `2x2` (default: `full`).

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
- `assets/css/dimensions/palette/*.css` - Palette overrides (`standard`, `pantone`)
- `assets/css/dimensions/palette/previews.css` - Palette preview tokens for dropdown (mode-aware, not tied to active palette)
- `assets/css/utilities/typography.css` - Typography utilities
- `assets/css/utilities/layout.css` - Layout utilities
- `assets/css/utilities/grid.css` - 12-column subgrid utilities
- `assets/css/utilities/display.css` - Visibility helpers
- `assets/css/utilities/icons.css` - SVG sprite icon utilities
- `assets/css/components/button.css` - Button component
- `assets/css/components/footer.css` - Footer component
- `assets/css/components/theme-dropdown.css` - Theme dropdown
- `assets/css/components/language-dropdown.css` - Language dropdown
- `assets/css/components/settings-dropdown.css` - Combined settings dropdown (xs only)
- `assets/css/pages/home.css` - Homepage styles
- `assets/css/pages/ui-library.css` - UI library page styles
- `assets/css/style.css` - Remaining component styles
- `assets/css/clientpage.css` - Client/employer page tweaks
- `assets/css/print.css` - Print styles

### Client-specific CSS
```css
/* Show/hide elements based on client context */
#layout.clientpage .hide-on-client { display: none; }
#layout:not(.clientpage) .show-on-client { display: none; }

/* Layout adjustments */
#layout.clientpage #menu { /* ... */ }
#layout.clientpage #main { /* ... */ }
```

### Token System (Current)
- Canonical tokens are defined in `assets/css/tokens/semantic.css`.
- Component exceptions live in `assets/css/tokens/components.css`.
- Mode/palette overrides live in `assets/css/dimensions/mode/*` and `assets/css/dimensions/palette/*` and should only override canonical tokens.

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
<svg class="icon icon--sm"></svg>  <!-- 1rem -->
<svg class="icon icon--lg"></svg>  <!-- 2rem -->
<svg class="icon icon--xl"></svg>  <!-- 2.5rem -->

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
  grid-template-rows: auto 1fr auto;  /* header, main (fills space), footer */
  grid-template-areas: "header" "main" "footer";
}
```
This ensures the footer stays at the bottom of the viewport even when page content is minimal (e.g., 404 page).

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
  - `data-palette="standard|pantone"`
- Add new dimensions by creating `assets/css/dimensions/<dimension>/*.css` and wiring in `layouts/partials/head.html`.
- When adding a new palette, also add its preview tokens in `assets/css/dimensions/palette/previews.css` so the theme dropdown can show palette dots in both modes.

---

## Naming Conventions

### Tokens (CSS Custom Properties)
- Prefix by domain: `text`, `bg`, `border`, `surface`, `brand`, `status`, `state`, `shadow`, `size`, `image`, `component`.
- Contrast scale order: `subtle` → `muted` → `default` → `strong`.
- Avoid overloaded prefixes like `text-*` for font sizes. Use `font-*` for typography sizes.
- Canonical tokens live in `assets/css/tokens/semantic.css`.
- Legacy aliases live in `assets/css/tokens/legacy.css` and must include `/* deprecated */`.
- Legacy aliases map one-to-one to canonical tokens; remove legacy only after confirming no references remain.
- **State-layer tokens (state-*)** must be applied as overlays (e.g. `background-image: linear-gradient(var(--state-on-light-hover), var(--state-on-light-hover))`) on top of existing backgrounds, not as replacement background colors.

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
describe('darkmode functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="layout"></div>';
  });

  test('should toggle dark mode class', () => {
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
10. **Request Handling**: Follow the "Request Handling Guidelines" section below - propose plans for analysis requests, implement directly only for clear action requests
11. **Keep AGENTS.md Current**: If you change structure, workflows, or conventions, update this file accordingly

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
5. Add PDF attachments to `static/images/`
6. Tag relevant projects: `employers: [company-slug]` in project front matter
7. Optionally mark projects as `hidden: true` to exclude from main portfolio
8. Test focus mode: `/employers/company-slug/` → verify projects display → click project → verify `?view=employer`

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
if (path.startsWith('/sv/') && !path.endsWith('/404.html')) {
  window.location.replace('/sv/404.html');
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
- **Grid Tab**: 12-column subgrid system examples
- **Components Tab**: Live component examples with meta-info (classes, files, tokens)
- **Utilities Tab**: Typography and spacing utilities

**Adding a New Component to UI Library**:
1. Extract component CSS to `assets/css/components/[component].css`
2. Import in `layouts/partials/head.html` (maintain load order)
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

Last updated: 2026-01-13
