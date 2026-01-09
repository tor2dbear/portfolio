# UI Library Implementation Plan

**Status**: In Progress
**Created**: 2026-01-07
**Updated**: 2026-01-08
**Branch**: `refactor/header-footer-redesign-a3f1`

---

## Overview

Create an internal UI library/documentation page for the portfolio site to provide a centralized overview of all design tokens, components, grid system, and utilities. This will improve maintainability and make UI changes more systematic.

**Goals**:
- Visual overview of all design tokens (colors, typography, spacing)
- Live interactive component examples
- Grid system documentation with examples
- Component meta-information (classes, file paths, token usage)
- Gradual CSS modularization (extract components to individual files)

**Not Indexed**: The UI library will not be indexed by search engines or linked from the main navigation.

---

## Architecture Decisions

### Structure
- **Hugo Section**: Create dedicated `ui-library` content type
- **Layout**: Custom template with tabs + accordions
  - **Tabs**: Main categories (Tokens, Grid, Components, Utilities)
  - **Accordions**: Sub-sections within each tab
- **Navigation**: Tabs for top-level, accordions for component groups

### Content Organization

```
Tab: Tokens
├── Accordion: Colors
│   ├── Primitives (raw color values)
│   └── Semantic (mapped tokens with mode/palette variants)
├── Accordion: Typography
│   └── Font scales, weights, line-heights with live examples
└── Accordion: Spacing
    └── Spacing scale visualization

Tab: Grid
├── Live rendered grid examples (1-2, 1-3, asymmetric, etc.)
└── HTML markup examples (side-by-side or stacked)

Tab: Components
├── Accordion: Buttons
│   ├── Meta info (classes, file path, tokens used)
│   ├── Live interactive examples (all states and variants)
│   └── Variations (primary, secondary, tertiary, disabled)
├── Accordion: Forms (to be added)
├── Accordion: Cards (to be added)
└── ... (expand gradually)

Tab: Utilities
└── Typography classes, spacing utilities, display helpers
```

### Component Documentation Pattern

Each component should include:

```html
<div class="component-doc">
  <div class="component-meta">
    <h4>Component Name</h4>
    <dl>
      <dt>Classes:</dt>
      <dd><code>.button</code>, <code>.button--primary</code></dd>

      <dt>File:</dt>
      <dd><a href="#">assets/css/components/button.css</a></dd>

      <dt>Tokens:</dt>
      <dd><code>--bg-brand-default</code>, <code>--text-on-brand</code></dd>
    </dl>
  </div>

  <div class="component-examples">
    <!-- Live interactive examples here -->
  </div>
</div>
```

**Benefits**:
- Quick reference for class names
- Easy to locate CSS file for changes
- Understanding of token dependencies (helps with theming)

---

## Implementation Phases

### Phase 1: Foundation (Grundstruktur) ✅ COMPLETE
- [x] Create content structure
  - [x] `content/english/ui-library/_index.md`
  - [x] `content/swedish/ui-library/_index.md`
- [x] Create layout template
  - [x] `layouts/ui-library/single.html`
  - [x] Tab navigation structure
  - [x] Accordion markup structure
- [x] Create tab-switching JavaScript module
  - [x] `assets/js/ui-library-tabs.js`
  - [x] Handle tab switching
  - [x] Handle accordion toggle
- [x] Basic styling for UI library page
  - [x] `assets/css/pages/ui-library.css`
  - [x] Tab styles
  - [x] Accordion styles
  - [x] Component documentation layout

### Phase 2: Tokens Section ✅ COMPLETE
- [x] Colors accordion
  - [x] Primitive colors display (swatches)
  - [x] Brand colors (Iris scale 1-12)
  - [x] Additional color scales (Blue, Green, Orange, Amber, Purple, Teal)
  - [x] Semantic tokens (Text, Background, Border, Brand, State, Status)
- [x] Typography accordion
  - [x] Font size scale with live examples
  - [x] Typography classes (.type-headline-1, .type-heading, etc.)
- [x] Spacing accordion
  - [x] Spacing scale visualization (4px - 64px)
  - [x] Usage examples (mt-*, mb-*, gap-*)

### Phase 3: Grid Section ✅ COMPLETE
- [x] Grid examples with live renders
  - [x] Full width (12 columns)
  - [x] 50/50 split (6+6)
  - [x] Thirds (4+4+4)
  - [x] 2:1 ratio (8+4)
  - [x] Specific placement examples
  - [x] Asymmetric layouts
- [x] HTML markup display with code examples

### Phase 4: Components - Buttons ✅ COMPLETE
- [x] Extract button CSS
  - [x] Create `assets/css/components/button.css`
  - [x] Move button styles from `style.css`
  - [x] Import in `head.html` (maintain load order)
  - [x] Test that buttons still work site-wide
- [x] Document buttons in UI library
  - [x] Component meta-info (classes, file, tokens)
  - [x] Default button (all states)
  - [x] Primary button (all states)
  - [x] Secondary button (all states)
  - [x] Tertiary button (all states)
  - [x] Icon buttons with arrow animation

### Phase 5: Components - Forms ✅ COMPLETE
- [x] Extract form CSS
  - [x] Create `assets/css/components/form.css`
  - [x] Move form styles from `style.css`
- [x] Document forms
  - [x] Text inputs (all types)
  - [x] Textareas
  - [x] Select dropdowns
  - [x] Custom radio buttons
  - [x] Custom checkboxes
  - [x] Form validation states (error, disabled)

### Phase 6: CSS Cleanup & Component Extraction 🔄 IN PROGRESS
**Priority: Remove duplicate/conflicting code**
- [x] Remove duplicate button styles from `style.css` (lines 616-654)
- [x] Remove duplicate theme switcher from `style.css` (lines 656-819) - use theme-dropdown.css
- [x] Consolidate form styles between `style.css` and `form.css`

**Extract Core Components**
- [x] **article-card.css** - Article/project summary cards
  - [x] Extract from style.css (lines 391-406)
  - [x] Includes hover effects, image contrast
  - [ ] Document in UI library
- [x] **navigation.css** - Top menu, brand, nav lists
  - [x] Extract from style.css (lines 161-317)
  - [x] Includes brand, top-menu, nav styling
  - [ ] Document in UI library
- [ ] **download-card.css** - Download/file item cards
  - [ ] Extract from clientpage.css or style.css
  - [ ] PDF icon + filename + download button
  - [ ] Document in UI library
- [ ] **table-of-contents.css** - ToC navigation for articles
  - [ ] Extract ToC styling
  - [ ] Document in UI library

**Extract Supporting Components**
- [ ] **pagination.css** - Page navigation
  - [ ] Extract from style.css (lines 408-473)
  - [ ] Document in UI library
- [ ] **tags.css** - Tag chips/labels
  - [ ] Extract tag-list styling
  - [ ] Document in UI library
- [ ] **breadcrumb.css** - Breadcrumb navigation
  - [ ] Extract from style.css (lines 566-579)
  - [ ] Document in UI library
- [ ] **post-navigation.css** - Next/previous post links
  - [ ] Extract post-nav styling
  - [ ] Document in UI library
- [ ] **newsletter.css** - Newsletter signup
  - [ ] Extract from style.css (lines 951-1047)
  - [ ] Document in UI library
- [ ] **bottom-sheet.css** - Mobile overlay/modal
  - [ ] Extract bottom sheet/mobile overlay styling
  - [ ] Used for theme dropdown on mobile
  - [ ] Document in UI library

### Phase 7: Utilities Section
- [ ] Typography utilities
  - [ ] `text-*` classes
  - [ ] `font-*` classes
- [ ] Spacing utilities
  - [ ] `mt-*`, `mb-*`, `ml-*`, `mr-*`
  - [ ] `pt-*`, `pb-*`, `pl-*`, `pr-*`
  - [ ] `gap-*`
- [ ] Display utilities
  - [ ] `hide-on-client`, `show-on-client`
  - [ ] Other visibility helpers

---

## CSS Modularization Strategy

### Current Structure
```
assets/css/style.css          # Monolithic component styles (~2000+ lines)
assets/css/components/
  language-dropdown.css       # Already extracted
  theme-dropdown.css          # Already extracted
```

### Target Structure
```
assets/css/style.css          # Remaining global styles (reduce size)
assets/css/components/
  button.css                  # ✅ Extracted - buttons and button variants
  form.css                    # ✅ Extracted - form elements
  footer.css                  # ✅ Extracted - footer layout
  theme-dropdown.css          # ✅ Existing - theme switcher
  language-dropdown.css       # ✅ Existing - language switcher
  article-card.css            # 🔄 To extract - article/project cards
  navigation.css              # 🔄 To extract - nav, menu, brand
  download-card.css           # 🔄 To extract - download items
  table-of-contents.css       # 🔄 To extract - ToC navigation
  pagination.css              # 🔄 To extract - page navigation
  tags.css                    # 🔄 To extract - tag chips/labels
  breadcrumb.css              # 🔄 To extract - breadcrumb navigation
  post-navigation.css         # 🔄 To extract - next/prev post links
  newsletter.css              # 🔄 To extract - newsletter signup
  bottom-sheet.css            # 🔄 To extract - mobile overlay/modal
  ... (expand as needed)
```

### Migration Process (Per Component)
1. **Identify** component styles in `style.css`
2. **Extract** to new `components/*.css` file
3. **Import** in `layouts/partials/head.html` (maintain load order)
4. **Test** that component works across entire site
5. **Document** in UI library with meta-info
6. **Commit** with clear message: `refactor: extract [component] CSS to components/[component].css`

### Load Order (head.html)
```
1. tokens (primitives → semantic → components → legacy)
2. dimensions (mode → palette)
3. utilities (typography → layout → display)
4. components (button → form → card → navigation → ...)  ← Add new imports here
5. pages (style.css → clientpage.css → print.css)
```

---

## File Structure

```
content/
  english/ui-library/
    _index.md
  swedish/ui-library/
    _index.md

layouts/
  ui-library/
    single.html

assets/
  js/
    ui-library-tabs.js
  css/
    components/
      button.css            (new)
      form.css              (new)
      card.css              (new)
      ...
    pages/
      ui-library.css        (new)
```

---

## Technical Considerations

### JavaScript Modules
- **Tab switching**: Simple show/hide with active states
- **Accordion toggle**: Click to expand/collapse sections
- **State persistence** (optional): localStorage to remember active tab
- **Interactivity**: Reuse existing modules (darkmode, dropdowns, etc.)

### SEO & Access
- Add `noindex` meta tag to UI library page
- No links from main navigation or footer
- Direct URL access only: `/ui-library/` or `/sv/ui-library/`

### Browser Testing
- Test interactive components (buttons, forms, dropdowns)
- Verify darkmode toggle works on UI library page
- Check responsive behavior of tabs/accordions
- Test in both languages

---

## Success Criteria

- [ ] All design tokens are documented and visible
- [ ] Grid system examples are clear and functional
- [ ] At least buttons are extracted and documented (pattern established)
- [ ] All live examples are interactive and work correctly
- [ ] Page is not indexed or linked from main site
- [ ] Component meta-info is accurate and helpful
- [ ] CSS modularization pattern is established for future components

---

## Future Enhancements (Post-MVP)

- [ ] Code snippets with syntax highlighting
- [ ] Copy-to-clipboard for code examples
- [ ] Search/filter functionality for components
- [ ] Dark mode preview toggle per component
- [ ] Component usage statistics (where each component is used)
- [ ] Automated token extraction (generate from CSS files)

---

## Rollback Plan

If issues arise:

1. **Content**: Simply don't link to UI library page (it's isolated)
2. **CSS Extraction**:
   - Revert component CSS extraction commits
   - Remove imports from `head.html`
   - Styles fall back to `style.css`
3. **JavaScript**:
   - Remove `ui-library-tabs.js` import
   - Page remains functional without JS (progressive enhancement)

---

## Notes

- **Bilingual**: Both English and Swedish versions need translation
- **Gradual approach**: Don't extract all CSS at once - establish pattern with buttons first
- **Living document**: UI library should grow organically as new components are added
- **Meta-info pattern**: Establish this with buttons, then replicate for all components
- **Grid examples**: Show both visual and markup for clarity
- **No secrets**: No password protection needed - just not indexed/linked

---

---

## Component Inventory (2026-01-08)

### Identified Components from Codebase Analysis

**Visual Components (from screenshots & templates):**
1. **Article/Project Card** - Most visible component, used for portfolio items
2. **Download Card/Item** - PDF download links on client/employer pages
3. **Table of Contents (ToC)** - Navigation for longer articles
4. **Tag Chips** - Inline tag/label lists used in cards and posts
5. **Breadcrumb Navigation** - Page hierarchy navigation
6. **Pagination** - Multi-page content navigation
7. **Post Navigation** - Previous/Next post links
8. **Newsletter Signup** - Email subscription form
9. **Bottom Sheet** - Mobile overlay for theme dropdown and other mobile interactions

**Already Extracted:**
- Buttons (button.css) ✅
- Forms (form.css) ✅
- Footer (footer.css) ✅
- Theme Dropdown (theme-dropdown.css) ✅
- Language Dropdown (language-dropdown.css) ✅

**Duplicate Code to Remove:**
- Button styles in style.css (lines 616-654) - conflicts with button.css
- Theme switcher in style.css (lines 656-819) - conflicts with theme-dropdown.css
- Form styles in style.css (lines 865-949) - partially conflicts with form.css

---

Last updated: 2026-01-08
