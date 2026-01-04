# Focus Mode System

Query parameter-based focus mode for client and employer contexts, replacing the previous localStorage solution.

## Overview

The focus mode system provides a distraction-free viewing experience when visitors arrive from client or employer landing pages. Instead of using localStorage, the system now uses URL query parameters for a stateless, shareable, and SEO-friendly solution.

## How It Works

### URL Parameters

**Client Mode:**
```
?view=client&ref=company-name
```

Example: `/works/projekt-namn/?view=client&ref=deg17`

**Employer Mode:**
```
?view=employer
```

Example: `/works/projekt-namn/?view=employer`

### What Happens in Focus Mode

When focus mode is active:
- ✅ Side menu is hidden
- ✅ Main content takes full width
- ✅ Custom breadcrumbs appear
- ✅ "Table of Contents" links back to client/employer page
- ✅ All internal links preserve the focus mode parameters

## Files & Structure

### JavaScript

**`assets/js/focus-mode.js`** - Main focus mode handler
- Detects focus context from URL params or path
- Applies CSS classes (`clientpage` or `employerpage`)
- Propagates parameters to all internal links
- Updates breadcrumbs and navigation
- Security: XSS prevention via textContent

### Templates

**Client System:**
- `content/english/clients/[company]/_index.md` - Client landing page
- `layouts/taxonomy/client.html` - Client page template
- `layouts/_default/summary-client.html` - Portfolio item in client context
- Links include: `?view=client&ref=company-name`

**Employer System:**
- `content/english/employers/_index.md` - English employer landing page
- `content/swedish/employers/_index.md` - Swedish employer landing page
- `layouts/_default/employers.html` - Employer page template
- Links include: `?view=employer`

### CSS

**`assets/css/atoms.css`**
```css
#layout.clientpage .hide-on-client { display: none; }
#layout:not(.clientpage) .show-on-client { display: none; }
#layout.employerpage .hide-on-employer { display: none; }
#layout:not(.employerpage) .show-on-employer { display: none; }
```

**`assets/css/style.css`**
```css
/* Hides side menu, makes main content full width */
#layout.clientpage>#menu { display: none; }
#layout.clientpage #main { width: 100%; }
#layout.employerpage>#menu { display: none; }
#layout.employerpage #main { width: 100%; }
```

## Usage Examples

### For Clients

1. Client visits: `/clients/deg17/`
2. Clicks on portfolio project
3. Navigated to: `/works/lokalguiden-rebrand/?view=client&ref=deg17`
4. Page shows:
   - No side menu
   - Breadcrumb: "Start > Deg17 > Project Name"
   - Table of contents linking back to `/clients/deg17/#section`

### For Employers

1. Employer visits: `/employers/` or `/sv/arbetsgivare/`
2. Clicks on portfolio project
3. Navigated to: `/works/lokalguiden-rebrand/?view=employer`
4. Page shows:
   - No side menu
   - Clean, distraction-free view

## SEO Considerations

### Canonical URLs

All pages automatically include canonical tags pointing to the clean URL (without query params):

```html
<link rel="canonical" href="https://example.com/works/project-name/" />
```

This prevents duplicate content issues while maintaining focus mode functionality.

### Indexing

Focus mode URLs are not indexed separately - search engines follow the canonical tag to the main content URL.

## Migrat from localStorage

### What Changed

**Before:**
- Used localStorage to persist client context
- Required separate JS files: `client-check.js`, `client-set-cookie.js`, `client-get-cookie.js`
- State persisted indefinitely
- Not shareable (URLs didn't preserve context)

**After:**
- Uses URL query parameters
- Single JS file: `focus-mode.js`
- Stateless (no browser storage)
- Shareable URLs
- Better SEO with canonical tags

### Removed Files

- ~~`assets/js/client-check.js`~~ → `assets/js/focus-mode.js`
- ~~`assets/js/client-get-cookie.js`~~ → (functionality in focus-mode.js)
- ~~`assets/js/client-set-cookie.js`~~ → (not needed)

## Technical Details

### Parameter Propagation

When focus mode is active, the JavaScript automatically adds query parameters to all internal links:

```javascript
// Original link
<a href="/works/project">Project</a>

// Becomes (in client mode)
<a href="/works/project?view=client&ref=deg17">Project</a>
```

### Breadcrumb Management

Client breadcrumbs are dynamically updated using the `ref` parameter:

```javascript
// Reads ?ref=deg17
// Creates link to /clients/deg17/
// Sets text to "Deg17" (decoded and formatted)
```

### Security

All user-controlled content (company names, refs) is handled safely:
- Uses `textContent` instead of `innerHTML` to prevent XSS
- URL encoding/decoding for special characters
- Try/catch blocks for error handling

## Browser Compatibility

Works in all modern browsers. Requires:
- URLSearchParams API (supported IE11+ with polyfill)
- ES6 features (arrow functions, const/let)

## Development

### Testing Focus Mode

**Client mode:**
```
/works/any-project/?view=client&ref=test-company
```

**Employer mode:**
```
/works/any-project/?view=employer
```

### Console Logging

Focus mode logs its state to console:
```
Focus mode: Client mode activated test-company
Focus mode: Employer mode activated
Focus mode: Standard mode (no focus context)
```

## Future Enhancements

Potential improvements:
- [ ] Analytics tracking for focus mode visits
- [ ] A/B testing capabilities
- [ ] "Exit focus mode" button
- [ ] Session-based fallback for better UX
- [ ] Employer-specific breadcrumbs
