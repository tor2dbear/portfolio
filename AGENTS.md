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

## Git Workflow

### Branching
- Branches should start with `claude/` for AI-assisted work
- Format: `claude/<description>-<sessionId>`
- Example: `claude/review-agent-docs-dmHfU`

### Commits
- Clear, descriptive commit messages
- Follow conventional commits when applicable
- One logical change per commit

### Pushing
- Always push with upstream: `git push -u origin <branch-name>`
- Branch must follow naming convention or push will fail (403)

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
attach_letter: "/path/to/letter.pdf"
```

---

## CSS Architecture

### Main Files
- `assets/css/style.css` - Main stylesheet
- `assets/css/atoms.css` - Utility classes
- PostCSS for processing

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
- Legacy tokens and `assets/css/dimensions/common.css` have been removed.
- Mode/palette overrides live in `assets/css/dimensions/mode/*` and `assets/css/dimensions/palette/*` and should only override canonical tokens.

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
7. **Git Conventions**: Follow `claude/` branch naming for AI work
8. **Taxonomy System**: Employers/clients use Hugo taxonomies - projects need taxonomy tags to appear on company pages
9. **Hidden Projects**: Respect `hidden: true` parameter - must be filtered in main portfolio templates

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

---

## Resources

- **Hugo Docs**: https://gohugo.io/documentation/
- **Repository**: https://github.com/tor2dbear/portfolio
- **Website**: https://www.tor-bjorn.com/
- **Contact**: tb.hedberg@gmail.com

---

Last updated: 2026-01-04
