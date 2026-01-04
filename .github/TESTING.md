# Testing Guide

This document explains how to run tests for the portfolio website.

## Test Infrastructure

The project uses:

- **Jest** - JavaScript testing framework
- **jsdom** - DOM implementation for testing
- **@testing-library/jest-dom** - Custom matchers for DOM testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

## Running Linter

### Check for linting errors

```bash
npm run lint
```

### Auto-fix linting errors

```bash
npm run lint:fix
```

## Code Formatting

### Format all files

```bash
npm run format
```

### Check formatting without changing files

```bash
npm run format:check
```

## Pre-commit Hooks

The project uses Husky to run checks before each commit:

- Lints and formats staged JavaScript files
- Formats staged JSON, Markdown, HTML, and CSS files

This ensures code quality and consistency.

## Writing Tests

### Test File Location

Place test files in `__tests__` directories next to the code they test:

```
assets/js/
├── darkmode.js
└── __tests__/
    └── darkmode.test.js
```

### Example Test

```javascript
describe("My Component", () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="app"></div>';
  });

  test("should do something", () => {
    const element = document.getElementById("app");
    expect(element).toBeDefined();
  });
});
```

### Available Mocks

The following are automatically mocked in `jest.setup.js`:

- `localStorage`
- `window.matchMedia`
- `fetch`

## CI/CD Integration

Tests run automatically on every push and pull request via GitHub Actions:

1. Install dependencies
2. Run linter
3. Run tests
4. Run security audit
5. Build Hugo site
6. Deploy (on master branch only)

## Current Coverage

Check the latest coverage report by running:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Coverage Goals

- **Short-term (3 months):** 50%+ coverage on critical JS files
- **Medium-term (6 months):** 70%+ overall coverage
- **Long-term (12 months):** 80%+ overall coverage

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
