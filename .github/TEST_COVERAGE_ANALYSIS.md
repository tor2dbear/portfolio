# Test Coverage Analysis

**Date:** 2026-01-02
**Repository:** tor2dbear/portfolio
**Current Test Coverage:** 0% (No tests implemented)

## Executive Summary

This Hugo-based portfolio website currently has **no automated testing infrastructure**. The codebase contains approximately 11 custom JavaScript files (~22KB of code) and 36+ HTML partial templates (~2,820 lines), all without test coverage.

## Current State

### Test Infrastructure
- ❌ No test framework configured
- ❌ No test files exist
- ❌ `package.json` contains placeholder test script: `"test": "echo \"Error: no test specified\" && exit 1"`
- ❌ No test step in GitHub Actions CI/CD pipeline (`.github/workflows/gh-pages.yml`)
- ❌ No coverage reporting tools

### Codebase Composition

**JavaScript Files (11 total):**
- `darkmode.js` (257 lines) - Complex theme management system
- `menus.js` (172 lines) - Dropdown menu with keyboard navigation & ARIA
- `header-hide.js` (~100+ lines) - Responsive header behavior
- `ui.js` (53 lines) - Main menu toggle
- `progressbar.js` (36 lines) - Scroll-based progress bar
- `header.js` (28 lines) - Media query-based header hiding
- `client-check.js` (13 lines) - Client page detection
- `client-get-cookie.js` (18 lines) - LocalStorage retrieval
- `client-set-cookie.js` (6 lines) - LocalStorage setting
- `theme.js` (27 lines) - Legacy dark mode toggle
- Other utility files

**HTML Templates:**
- 66 layout/partial files (~2,820 lines)
- Contact form with reCAPTCHA integration
- Multilingual content (English/Swedish)

## Critical Areas Lacking Test Coverage

### 🔴 HIGH PRIORITY

#### 1. Theme Management System (`darkmode.js`)
**Risk Level:** High
**Complexity:** High
**Lines:** 257

**Untested Functionality:**
- Theme persistence via localStorage (`setTheme`, `applyTheme`)
- System theme preference detection (`updateSystemTheme`)
- Touch gesture handling for mobile menu (touchstart/touchmove/touchend)
- Theme icon SVG loading and rendering
- Menu visibility state management
- Theme color meta tag updates
- MutationObserver for data-attribute changes

**Why Critical:**
- Core user experience feature
- Heavy DOM manipulation
- Complex state management
- Browser API dependencies (localStorage, matchMedia, fetch)
- Mobile gesture handling prone to edge cases

**Proposed Tests:**
```javascript
// Unit tests needed:
- setTheme() persists to localStorage correctly
- applyTheme() updates DOM attributes
- updateSystemTheme() detects prefers-color-scheme
- Touch gestures calculate correct deltaY
- SVG loading handles network failures
- Menu toggle respects data-visible state
- Theme changes trigger meta tag updates
```

#### 2. Dropdown Menu System (`menus.js`)
**Risk Level:** High
**Complexity:** Medium
**Lines:** 172

**Untested Functionality:**
- Keyboard navigation (ESC, Arrow Up/Down)
- ARIA attribute management
- Menu state transitions (show/hide/toggle)
- Click-outside-to-close behavior
- Focus management
- Touch vs mouse event detection

**Why Critical:**
- Accessibility compliance (ARIA)
- Keyboard navigation is WCAG requirement
- Complex event handling
- DOM state management

**Proposed Tests:**
```javascript
// Unit tests needed:
- PureDropdown.show() sets correct ARIA attributes
- PureDropdown.hide() removes active class
- ESC key closes menu
- Arrow keys navigate menu items
- Click outside menu triggers close
- Focus returns to trigger on close
```

#### 3. Contact Form (`layouts/partials/contact_form.html`)
**Risk Level:** High
**Complexity:** Medium

**Untested Functionality:**
- Form validation (required fields)
- reCAPTCHA integration
- Form submission to webhook endpoint
- Success/error message display
- Email format validation

**Why Critical:**
- Primary conversion point
- External API dependency (Make.com webhook)
- reCAPTCHA can fail
- No visible form submission handler in JS files (likely inline)

**Proposed Tests:**
```javascript
// Integration tests needed:
- Form submission with valid data succeeds
- Required fields prevent submission when empty
- Email validation works correctly
- reCAPTCHA token is included
- Success message displays on 200 response
- Error message displays on failure
- Network timeout handling
```

### 🟡 MEDIUM PRIORITY

#### 4. LocalStorage Management
**Risk Level:** Medium
**Complexity:** Low
**Files:** `client-get-cookie.js`, `client-set-cookie.js`, `theme.js`

**Untested Functionality:**
- Client URL persistence
- Theme preference storage
- LocalStorage availability checks
- Data retrieval with missing keys

**Why Important:**
- No fallback for localStorage unavailable (private browsing)
- Can throw exceptions if quota exceeded
- Missing null checks could cause runtime errors

**Proposed Tests:**
```javascript
// Unit tests needed:
- setItem/getItem work correctly
- Handles localStorage not available
- Missing keys return null gracefully
- Invalid JSON doesn't crash app
```

#### 5. Scroll-Based Animations (`progressbar.js`, `header.js`)
**Risk Level:** Medium
**Complexity:** Medium

**Untested Functionality:**
- Progress bar width calculations
- Scroll position tracking
- Header show/hide on scroll direction
- Media query responsive behavior

**Why Important:**
- Math calculations can be error-prone
- Performance implications (scroll events)
- Responsive breakpoint handling

**Proposed Tests:**
```javascript
// Unit tests needed:
- progressBar() calculates correct widths
- Scroll direction detection works
- Media query changes trigger correct behavior
- Handles edge cases (top/bottom of page)
```

#### 6. UI Toggle Functions (`ui.js`)
**Risk Level:** Medium
**Complexity:** Low

**Untested Functionality:**
- Class toggling logic
- Menu activation/deactivation
- CSS transition timing

**Proposed Tests:**
```javascript
// Unit tests needed:
- toggleClass() adds/removes classes correctly
- toggleAll() affects all target elements
- Click handlers trigger correctly
```

### 🟢 LOW PRIORITY

#### 7. Client Page Detection (`client-check.js`)
**Risk Level:** Low
**Complexity:** Low

**Untested Functionality:**
- Query string parsing
- URL path detection
- Class application logic

**Proposed Tests:**
```javascript
// Unit tests needed:
- Detects ?source=client correctly
- Detects /clients/ in URL
- Adds clientpage class appropriately
```

## Hugo Template Testing

**Current State:** No template testing

**Challenges:**
- Hugo templates require Go tooling
- No obvious business logic in templates (mostly presentation)
- i18n string usage should be verified

**Proposed Approach:**
- Snapshot testing for rendered HTML
- Verify i18n keys exist for all languages
- Test shortcode rendering

## Accessibility Testing Gaps

**Current Risks:**
- No automated WCAG compliance testing
- ARIA attributes not validated
- Keyboard navigation not tested
- Screen reader compatibility unknown
- Color contrast not verified

**Recommended Tools:**
- axe-core for automated a11y testing
- Pa11y for CI/CD integration
- Manual screen reader testing

## Build & Deployment Testing

**Current CI/CD:** GitHub Actions (`.github/workflows/gh-pages.yml`)

**Existing Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 20
3. ✅ Setup Hugo
4. ✅ Build with `hugo --minify`
5. ✅ Deploy to GitHub Pages

**Missing Steps:**
- ❌ Dependency audit (`npm audit`)
- ❌ Linting (ESLint, Prettier check)
- ❌ Unit tests
- ❌ Integration tests
- ❌ Build artifact validation
- ❌ Broken link checking
- ❌ Accessibility audit
- ❌ Performance budget checks

## Recommended Testing Strategy

### Phase 1: Foundation (Week 1-2)
1. **Setup Test Infrastructure**
   - Install Jest for JavaScript testing
   - Configure jsdom for DOM testing
   - Add ESLint + Prettier
   - Setup coverage reporting (Istanbul/nyc)

2. **Add Pre-commit Hooks**
   - Husky for git hooks
   - lint-staged for changed files
   - Prettier formatting check

3. **CI/CD Integration**
   - Add lint step to GitHub Actions
   - Add test step (even if just a few tests initially)
   - Fail builds on test failures

### Phase 2: Critical Coverage (Week 3-4)
1. **Theme System Tests** (`darkmode.js`)
   - Unit tests for all theme functions
   - LocalStorage mocking
   - matchMedia mocking
   - Aim for 80%+ coverage

2. **Menu System Tests** (`menus.js`)
   - Keyboard navigation tests
   - ARIA attribute verification
   - Event handler tests
   - Aim for 80%+ coverage

3. **Form Testing**
   - Integration tests with Playwright/Cypress
   - Mock webhook endpoint
   - reCAPTCHA testing strategy

### Phase 3: Comprehensive Coverage (Week 5-8)
1. **Remaining JavaScript Files**
   - Test all utility functions
   - LocalStorage management tests
   - Scroll behavior tests
   - Aim for 70%+ overall coverage

2. **Template Testing**
   - Hugo template unit tests (Go)
   - i18n key validation
   - Shortcode testing

3. **E2E Testing**
   - Playwright or Cypress setup
   - Critical user flows:
     - Homepage load
     - Navigation
     - Contact form submission
     - Theme switching
     - Language switching
     - Mobile menu interactions

4. **Accessibility Testing**
   - axe-core integration
   - Keyboard navigation tests
   - Screen reader compatibility

5. **Visual Regression Testing**
   - Percy or BackstopJS
   - Screenshot comparison
   - Responsive breakpoints

### Phase 4: Continuous Improvement
1. **Performance Testing**
   - Lighthouse CI
   - Bundle size monitoring
   - Core Web Vitals tracking

2. **Security Testing**
   - npm audit in CI
   - Dependabot integration
   - CSP header validation
   - reCAPTCHA security review

## Recommended Tools & Packages

### Testing Framework
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/dom": "^9.3.3",
    "playwright": "^1.40.1",
    "axe-core": "^4.8.3",
    "@axe-core/playwright": "^4.8.3"
  }
}
```

### Code Quality
```json
{
  "devDependencies": {
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  }
}
```

### Coverage & Reporting
```json
{
  "devDependencies": {
    "c8": "^9.0.0",
    "@vitest/coverage-v8": "^1.1.0"
  }
}
```

## Test Coverage Goals

### Short-term (3 months)
- ✅ Test infrastructure setup
- ✅ 50%+ coverage on critical JS files
- ✅ Basic E2E tests for happy paths
- ✅ Automated accessibility testing
- ✅ Linting in CI/CD

### Medium-term (6 months)
- ✅ 70%+ overall code coverage
- ✅ Comprehensive E2E test suite
- ✅ Visual regression testing
- ✅ Performance budgets
- ✅ Security scanning

### Long-term (12 months)
- ✅ 80%+ overall code coverage
- ✅ Automated cross-browser testing
- ✅ Automated mobile testing
- ✅ Continuous performance monitoring
- ✅ WCAG 2.1 AA compliance verified

## Specific Test Cases by File

### `darkmode.js`
```javascript
describe('Theme Management', () => {
  describe('setTheme', () => {
    it('should persist theme to localStorage', () => {})
    it('should apply theme to document', () => {})
    it('should close menu after selection', () => {})
  })

  describe('applyTheme', () => {
    it('should set data-theme attribute for light', () => {})
    it('should set data-theme attribute for dark', () => {})
    it('should call updateSystemTheme for system', () => {})
    it('should update menu icon', () => {})
    it('should update theme color meta tag', () => {})
  })

  describe('updateSystemTheme', () => {
    it('should set dark theme when prefers dark', () => {})
    it('should set light theme when prefers light', () => {})
  })

  describe('Touch Gestures', () => {
    it('should calculate correct deltaY on touchmove', () => {})
    it('should close menu on swipe down > 50px', () => {})
    it('should return to position on swipe < 50px', () => {})
    it('should update overlay opacity during drag', () => {})
  })

  describe('SVG Loading', () => {
    it('should load correct SVG for each theme', () => {})
    it('should handle fetch errors gracefully', () => {})
    it('should set stroke to currentColor', () => {})
  })
})
```

### `menus.js`
```javascript
describe('PureDropdown', () => {
  describe('Menu State', () => {
    it('should initialize in closed state', () => {})
    it('should show menu and set ARIA attributes', () => {})
    it('should hide menu and restore focus', () => {})
    it('should toggle between states', () => {})
  })

  describe('Keyboard Navigation', () => {
    it('should close menu on ESC key', () => {})
    it('should focus next item on Down arrow', () => {})
    it('should focus previous item on Up arrow', () => {})
    it('should wrap to first item from last on Down', () => {})
    it('should wrap to last item from first on Up', () => {})
  })

  describe('Accessibility', () => {
    it('should set aria-haspopup on trigger', () => {})
    it('should set role=menu on menu', () => {})
    it('should set aria-hidden correctly', () => {})
    it('should set role=presentation on list items', () => {})
    it('should set role=menuitem on links', () => {})
  })

  describe('Click Outside', () => {
    it('should close menu on outside click', () => {})
    it('should not close on menu click', () => {})
    it('should blur trigger on outside click', () => {})
  })
})
```

### `progressbar.js`
```javascript
describe('Progress Bar', () => {
  it('should calculate left hyphen width correctly', () => {})
  it('should calculate right hyphen width correctly', () => {})
  it('should update brand link width based on scroll', () => {})
  it('should handle scroll at top (0%)', () => {})
  it('should handle scroll at bottom (100%)', () => {})
  it('should handle window resize', () => {})
})
```

### LocalStorage Functions
```javascript
describe('Client LocalStorage', () => {
  describe('client-set-cookie', () => {
    it('should store client URL', () => {})
    it('should store client name', () => {})
    it('should handle missing company_name element', () => {})
  })

  describe('client-get-cookie', () => {
    it('should retrieve stored URLs', () => {})
    it('should update breadcrumb links', () => {})
    it('should handle missing localStorage values', () => {})
    it('should handle missing DOM elements', () => {})
  })
})
```

### Contact Form
```javascript
describe('Contact Form', () => {
  it('should require name field', () => {})
  it('should require email field', () => {})
  it('should validate email format', () => {})
  it('should require subject field', () => {})
  it('should include reCAPTCHA token', () => {})
  it('should show success message on 200', () => {})
  it('should show error message on failure', () => {})
  it('should handle network timeout', () => {})
})
```

## Risk Assessment

| Component | Risk Level | Impact | Likelihood | Priority |
|-----------|-----------|--------|------------|----------|
| Theme System | 🔴 High | High | Medium | P0 |
| Menu Navigation | 🔴 High | High | Medium | P0 |
| Contact Form | 🔴 High | High | Low | P0 |
| LocalStorage | 🟡 Medium | Medium | Medium | P1 |
| Scroll Animations | 🟡 Medium | Low | Low | P2 |
| Client Detection | 🟢 Low | Low | Low | P3 |

## Next Steps

1. **Immediate Actions:**
   - Install Jest and testing dependencies
   - Configure jest.config.js
   - Add ESLint configuration
   - Create first test file (start with simplest: `client-check.js`)

2. **This Week:**
   - Write tests for all LocalStorage functions
   - Add tests for `progressbar.js`
   - Setup GitHub Actions test step

3. **This Month:**
   - Complete `darkmode.js` test suite
   - Complete `menus.js` test suite
   - Setup E2E testing framework
   - Add form integration tests

4. **This Quarter:**
   - Achieve 70%+ code coverage
   - Setup visual regression testing
   - Implement accessibility auditing
   - Add performance monitoring

## Conclusion

The portfolio website is a well-structured Hugo site with moderate JavaScript complexity, but it currently operates without any automated testing safety net. Given the critical nature of theme management, navigation accessibility, and the contact form (business conversion point), implementing a comprehensive test strategy should be a high priority.

The recommended phased approach balances quick wins (testing simple utilities first) with addressing high-risk areas (theme system, menus, forms) within the first month of implementation.
