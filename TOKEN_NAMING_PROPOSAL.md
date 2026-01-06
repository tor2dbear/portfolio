# Token Naming Proposal (Canonical + Legacy Mapping)

This document proposes a flat, consistent token system and a legacy
alias layer to allow gradual migration.

## Canonical Naming Rules

- Prefix by domain: `text`, `bg`, `border`, `surface`, `brand`, `status`,
  `state`, `shadow`, `size`, `image`, `component`.
- Use a consistent contrast scale and order: `subtle` → `muted` → `default` → `strong`.
- Avoid overloaded prefixes like `text-*` for font sizes. Use `font-*`.
- All canonical tokens live in `assets/css/tokens/semantic.css`.
- Legacy names map in `assets/css/tokens/legacy.css`.
  Add a `/* deprecated */` comment to each legacy alias.

## Canonical Tokens (Proposed)

### Text

- `--text-default`
- `--text-muted`
- `--text-inverse`
- `--text-nav`
- `--text-link`
- `--text-link-hover`
- `--text-accent`

### Background / Surface

- `--bg-page`
- `--bg-surface`
- `--bg-elevated`
- `--bg-inverse`
- `--bg-nav`
- `--bg-tag`
- `--bg-tag-hover`
- `--bg-section-headline`

### Border / Outline

- `--border-subtle`
- `--border-default`
- `--border-strong`
- `--outline-neutral`

### State (Interaction)

- `--text-disabled`
- `--bg-disabled`
- `--border-disabled`
- `--state-on-light-hover`
- `--state-on-light-active`
- `--state-on-dark-hover`
- `--state-on-dark-active`
- `--state-focus`

### Brand

- `--brand-primary`
- `--brand-on-primary`
- `--brand-container`
- `--brand-on-container`

### Status (Error / Success / Warning / Info)

- `--status-error-bg`
- `--status-error-border`
- `--status-error-text`
- `--status-error-icon`
- `--status-success-bg`
- `--status-success-border`
- `--status-success-text`
- `--status-success-icon`
- `--status-warning-bg`
- `--status-warning-border`
- `--status-warning-text`
- `--status-warning-icon`
- `--status-info-bg`
- `--status-info-border`
- `--status-info-text`
- `--status-info-icon`

### Shadow

- `--shadow-01`

### Image

- `--image-background`
- `--image-grayscale`
- `--image-blend-mode`

### Size (component-adjacent)

- `--size-header-height`
- `--size-page-margins`
- `--size-menu-width-xl`
- `--size-menu-width-lg`
- `--size-menu-width-md`

### Component (exceptions only)

- `--component-form-bg`
- `--component-form-border`
- `--component-form-placeholder`
- `--component-newsletter-bg`
- `--component-newsletter-text`
- `--component-newsletter-illustration-bg`
- `--component-newsletter-button-bg`
- `--component-newsletter-button-text`

## Legacy -> Canonical Mapping (Draft)

### Text

- `--text-color` -> `--text-default`
- `--text-color-lighter` -> `--text-muted`
- `--text-color-hover` -> `--text-link-hover`
- `--text-color-menu` -> `--text-nav`
- `--text-color-menu-hover` -> `--text-link-hover`
- `--text-color-accent` -> `--text-accent`
- `--text-color-tag` -> `--text-muted`
- `--text-primary` -> `--text-default`
- `--text-secondary` -> `--text-muted`
- `--text-inverted` -> `--text-inverse`
- `--text-link` -> `--text-link`
- `--text-section-headline` -> `--brand-on-primary`

### Background / Surface

- `--bg-color` -> `--bg-page`
- `--background-color-menu` -> `--bg-nav`
- `--bg-menu` -> `--bg-nav`
- `--bg-box` -> `--bg-surface`
- `--bg-image` -> `--image-background`
- `--box-background` -> `--bg-surface`
- `--bg-tag` -> `--bg-tag`
- `--bg-tag-hover` -> `--bg-tag-hover`
- `--bg-section-headline` -> `--bg-section-headline`

### Border / Outline

- `--border-header` -> `--border-subtle`
- `--outline-neutral` -> `--outline-neutral`

### State (Interaction)

- `--state-layer-base-hover` -> `--state-on-dark-hover`
- `--state-layer-base-active` -> `--state-on-dark-active`
- `--state-layer-container-hover` -> `--state-on-light-hover`
- `--state-layer-container-active` -> `--state-on-light-active`

### Brand

- `--primary-base` -> `--brand-primary`
- `--primary-on-base` -> `--brand-on-primary`
- `--primary-container` -> `--brand-container`
- `--primary-on-container` -> `--brand-on-container`
- `--primary-color` -> `--brand-primary`

### Status (Error)

- `--error-text` -> `--status-error-text`
- `--error-text-light` -> `--status-error-bg`
- `--error-text-strong` -> `--status-error-text`
- `--error-base` -> `--status-error-text`
- `--error-container` -> `--status-error-bg`
- `--error-on-container` -> `--status-error-text`
- `--color-error` -> `--status-error-text`
- `--color-error-light` -> `--status-error-bg`
- `--color-error-dark` -> `--status-error-text`
- `--danger-bg` -> `--status-error-bg`
- `--danger-light` -> `--status-error-bg`
- `--danger-normal` -> `--status-error-text`
- `--danger-dark` -> `--status-error-text`

### Components

- `--form-bg` -> `--component-form-bg`
- `--form-border` -> `--component-form-border`
- `--form-placeholder` -> `--component-form-placeholder`
- `--newsletter-bg` -> `--component-newsletter-bg`
- `--newsletter-text` -> `--component-newsletter-text`
- `--newsletter-illustration-bg` -> `--component-newsletter-illustration-bg`
- `--newsletter-button-bg` -> `--component-newsletter-button-bg`
- `--newsletter-button-text` -> `--component-newsletter-button-text`
- `--newsletter-signup-bg` -> `--component-newsletter-bg`
- `--newsletter-color` -> `--component-newsletter-text`
- `--newsletter-button-background` -> `--component-newsletter-button-bg`
- `--newsletter-button-color` -> `--component-newsletter-button-text`

### Image

- `--img-background` -> `--image-background`
- `--img-grayscale` -> `--image-grayscale`
- `--img-blend-mode` -> `--image-blend-mode`

## Notes

- Mode and palette files should only override canonical tokens.
- `tokens/legacy.css` should be loaded after `tokens/semantic.css`.
- The mapping above is a draft and should be validated against actual usage.
- Component tokens should be rare and justified. Prefer semantic tokens first.
- State tokens are overlays intended for layered interaction states.
