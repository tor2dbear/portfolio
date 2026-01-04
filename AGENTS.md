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

Special feature for sending customized job applications with personalized styling.

### How It Works

**1. Client page structure**:
```
content/english/clients/deg17/_index.md
```

**2. Front matter**:
```yaml
title: "Work application for UI position at Deg17"
company_name: "deg17"           # Used in localStorage
attach_cv: "/images/cvd.pdf"
attach_portfolio: "/images/portfolio_20220812.pdf"
attach_letter: ""
```

**3. JavaScript flow**:

**a) Set localStorage** (`client-set-cookie.js`):
- Runs when visitor lands on `/clients/deg17/`
- Extracts:
  - `clientUrl` - Full URL to client page (without hash)
  - `clientName` - From `.company_name` element in HTML
- Stores in localStorage:
  - `lsClientUrl` → URL
  - `lsClient` → Company name

**b) Check and apply styling** (`client-check.js`):
- Detects if page is a client page by checking:
  - URL contains `?source=client`, OR
  - URL contains `/clients/`
- If yes → Adds CSS class `clientpage` to `#layout`

**c) Get and use data** (`client-get-cookie.js`):
- Reads from localStorage
- Sets up navigation with hash anchors:
  - `#letter`, `#portfolio`, `#cv`, `#download`, `#contact`
- Updates breadcrumb back-link

**4. CSS styling**:
```css
#layout.clientpage #menu { /* Hide menu */ }
#layout.clientpage #main { /* Custom layout */ }
.clientpage .content.post { /* Custom content styling */ }
```

**Why localStorage?**
- Maintains client context across page navigation
- Visitor can browse different sections (CV, portfolio, contact)
- Styling and breadcrumb persist

---

## JavaScript Conventions

### Module Pattern
- One function/feature per file
- Vanilla JavaScript (no frameworks)
- ES6+ syntax
- Example: `client-check.js`, `darkmode.js`, `header-hide.js`

### File Naming
- Kebab-case: `client-set-cookie.js`
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
2. **localStorage Usage**: The client system relies on localStorage - don't break this functionality
3. **CSS Classes**: The `clientpage` class is critical for client styling
4. **Module Pattern**: Keep JavaScript modular - one responsibility per file
5. **Testing**: Write tests for new JavaScript functionality
6. **Hugo Context**: This is a static site - no server-side logic
7. **Git Conventions**: Follow `claude/` branch naming for AI work

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
4. Add PDF attachments to `static/images/`
5. Test localStorage flow in browser

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
