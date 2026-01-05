# Torbjörn Hedberg - Portfolio

Personal portfolio website built with Hugo, featuring multilingual content (English/Swedish) and a sophisticated dark/light theme system.

🌐 **Live Site:** [www.tor-bjorn.com](https://www.tor-bjorn.com/)

## Features

- 🌍 **Multilingual** - Full support for English and Swedish
- 🌓 **Dark/Light/System Theme** - Advanced theme management with localStorage persistence
- 📱 **Fully Responsive** - Mobile-first design with touch gesture support
- ♿ **Accessible** - ARIA attributes, keyboard navigation, semantic HTML
- ⚡ **Fast** - Static site with optimized assets and minification
- ✅ **Tested** - 228 automated tests with 88% coverage + visual regression testing
- 🔒 **Secure** - Pre-commit hooks, linting, and security audits

## Tech Stack

- **Static Site Generator:** Hugo (v0.154.2)
- **Build Tools:** Node.js 20, npm
- **CSS:** Custom CSS with CSS Variables (no framework)
- **JavaScript:** Vanilla JS with modular architecture
- **Testing:** Jest with jsdom + Playwright for visual regression testing
- **Linting:** ESLint + Prettier
- **CI/CD:** GitHub Actions → GitHub Pages
- **Quality:** Husky pre-commit hooks, lint-staged

## Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) v0.154.2 or later
- [Node.js](https://nodejs.org/) v20 or later
- npm (comes with Node.js)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/tor2dbear/portfolio.git
cd portfolio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
hugo server -D
```

The site will be available at `http://localhost:1313`

## Development

### Available Scripts

```bash
# Development
hugo server -D              # Start Hugo dev server with drafts
hugo server                 # Start Hugo dev server (published content only)

# Testing
npm test                    # Run unit tests (Jest)
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
npm run test:visual         # Run visual regression tests (Playwright)
npm run test:visual:ui      # Run visual tests in interactive UI mode
npm run test:visual:update  # Update visual test baselines
npm run test:visual:report  # View visual test HTML report
npm run test:all            # Run both unit and visual tests

# Code Quality
npm run lint                # Run ESLint
npm run lint:fix            # Run ESLint and auto-fix issues
npm run format              # Format all files with Prettier
npm run format:check        # Check formatting without changes

# Build
hugo --minify               # Build production site (output: ./public)
```

### Project Structure

```
portfolio/
├── .github/
│   ├── workflows/          # GitHub Actions CI/CD
│   └── TESTING.md          # Testing documentation
├── archetypes/             # Content templates
├── assets/
│   ├── css/                # Source CSS files
│   │   ├── variables.css   # Design tokens
│   │   ├── atoms.css       # Utility classes
│   │   ├── typography.css  # Typography styles
│   │   └── style.css       # Main styles
│   └── js/                 # Source JavaScript files
│       ├── darkmode.js     # Theme management
│       ├── menus.js        # Navigation
│       ├── header-hide.js  # Scroll behavior
│       └── __tests__/      # Jest tests
├── content/
│   ├── english/            # English content
│   └── swedish/            # Swedish content
├── i18n/                   # Translations
├── layouts/
│   ├── _default/           # Default templates
│   ├── partials/           # Reusable components
│   └── shortcodes/         # Custom shortcodes
├── static/                 # Static assets
│   ├── img/                # Images
│   └── js/                 # Compiled JavaScript
├── config.toml             # Hugo configuration
└── package.json            # Node dependencies
```

### Adding Content

#### Create a new work/project

```bash
hugo new english/works/my-project/index.md
hugo new swedish/works/my-project/index.md
```

#### Create a new blog post

```bash
hugo new english/blog/my-post.md
hugo new swedish/blog/my-post.md
```

## Testing

This project has comprehensive test coverage with both unit tests and visual regression tests.

### Unit Tests (Jest)

Run JavaScript unit tests with Jest:

```bash
npm test                    # Run all unit tests
npm run test:coverage       # See coverage report
```

### Test coverage

- **Total:** 228 tests
- **Coverage:** 88% of interactive functionality
- **Files tested:** 9 JavaScript modules

See [.github/TESTING.md](.github/TESTING.md) for detailed testing documentation.

### Visual Regression Tests (Playwright)

Visual tests capture screenshots and compare them against baseline images to detect unintended visual changes:

```bash
npm run test:visual         # Run visual tests
npm run test:visual:ui      # Interactive UI mode
npm run test:visual:update  # Update baselines
npm run test:visual:report  # View HTML report
```

**What's tested:**
- Homepage and key pages across multiple viewports
- Dark mode styling
- Responsive design (mobile, tablet, desktop)
- Component rendering (header, menu, footer)
- Layout integrity

See [VISUAL_TESTING.md](VISUAL_TESTING.md) for complete visual testing documentation.

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `master` branch.

### GitHub Actions Workflow

1. **Lint** - ESLint checks code quality
2. **Test** - Jest runs all 228 tests
3. **Audit** - npm audit checks for vulnerabilities
4. **Build** - Hugo builds and minifies the site
5. **Deploy** - Publishes to GitHub Pages

### Manual deployment

```bash
hugo --minify               # Build the site
# Upload ./public to your hosting provider
```

## Configuration

### Site Configuration

Edit `config.toml` to update:

- Site title and description
- Base URL
- Languages
- Menu items
- Social links
- Analytics

### Theme Colors

Edit `assets/css/variables.css` to customize:

- Color palette
- Typography
- Spacing
- Breakpoints

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Modern mobile browsers

**Note:** IE11 is not supported due to modern JavaScript features.

## Contributing

This is a personal portfolio, but suggestions and bug reports are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Author

**Torbjörn Hedberg**

- Website: [www.tor-bjorn.com](https://www.tor-bjorn.com/)
- GitHub: [@tor2dbear](https://github.com/tor2dbear)

## Acknowledgments

- Built with [Hugo](https://gohugo.io/)
- Fonts from [Adobe Fonts](https://fonts.adobe.com/)
- Icons and images are custom-made

---

**Status:** ✅ Production Ready | 🧪 228 Tests Passing | 🔒 0 Vulnerabilities
