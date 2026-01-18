# Footer Restructure Plan

## Overview
Restructure the footer into a three-row layout with clear semantic sections, a full-width newsletter form, and a metadata row. Ensure bilingual support, accessibility, and alignment with the existing grid/spacing system.

## Goals
- Three-column footer (navigation/portfolio/contact) that stacks cleanly on smaller screens.
- Full-width newsletter form row with input + button.
- Metadata row with display-only state indicators and links (RSS/Privacy/License).
- Bilingual content through i18n keys.

## Non-Goals
- No theme or language switchers in the footer (header retains those).
- No new visual style system; reuse existing typography/spacing tokens.
- No interactive toggles in metadata row (display only).

## Proposed Structure (Semantic HTML)
- `footer`
  - `div.footer-grid` (row 1)
    - `nav` (Navigering)
    - `nav` (Portfolio)
    - `address` (Kontakt)
  - `section.footer-newsletter` (row 2)
    - `form` with email input + submit button
  - `div.footer-meta` (row 3)
    - `ul` (role="list") with dot separators

## Content (Row 1)
**Navigering**
- Hem
- Texter
- UI-bibliotek

**Portfolio**
- Alla projekt
- Böcker
- Design
- Grafisk design
- Illustrationer
- Redaktionellt
- UI/UX
- Varumärke

**Kontakt**
- hej@tor-bjorn.com (mailto)
- +46 (0) 702 - 56 20 90 (tel)
- LinkedIn (external link)

## Newsletter (Row 2)
- Full-width row
- Input `type="email"` + submit button
- Label is visually hidden (`sr-only`)
- Placeholder + button label use i18n
- POST to existing Make.com endpoint (reuse current config)

## Metadata (Row 3)
- © 2026. Alla rättigheter förbehållna
- Light mode (current mode display)
- Pantone (current palette display)
- Svenska (current language display)
- RSS (link)
- Privacy (link)
- License (link)

Notes:
- Theme/palette/language are display-only spans with accessible labels.
- Dot separators handled via CSS, not literal text.

## Files to Update
- `layouts/partials/footer.html`
- `assets/css/components/footer.css`
- `assets/css/utilities/layout.css` (if new utility classes needed)
- `i18n/en.yaml`, `i18n/sv.yaml`
- `config.toml` (only if newsletter endpoint/config needs change)

## i18n Keys (Draft)
- `footer_navigation`, `footer_portfolio`, `footer_contact`
- `footer_all_projects`, `footer_books`, `footer_design`, `footer_graphic_design`,
  `footer_illustrations`, `footer_editorial`, `footer_uiux`, `footer_brand`
- `footer_email`, `footer_phone`, `footer_linkedin`
- `footer_newsletter_title`, `footer_newsletter_placeholder`,
  `footer_newsletter_submit`
- `footer_rights_reserved`, `footer_rss`, `footer_privacy`, `footer_license`
- `footer_mode_label`, `footer_palette_label`, `footer_language_label`

## Layout/Responsive Notes
- Desktop: 3 columns with grid gap matching main content.
- Tablet: 2 columns (e.g. stack contact under first two).
- Mobile: 1 column stacked order: navigation → portfolio → contact → newsletter → metadata.

## Accessibility Notes
- Use `nav aria-label` for navigation sections.
- `address` for contact (links are `mailto:`/`tel:`).
- `label` for email input, visually hidden.
- Ensure focus styles on links/buttons remain visible.

## Implementation Phases
1. **Markup**
   - Rebuild footer structure in `footer.html` with semantic sections.
   - Wire links and content via i18n keys.
2. **Styling**
   - Update `footer.css` to match grid/spacing rules.
   - Add responsive stack behavior.
   - Add dot separators in metadata row.
3. **Newsletter**
   - Connect to existing endpoint.
   - Add a11y label + i18n placeholders.
4. **QA**
   - Verify layout in sv/en.
   - Check focus states and screen reader labels.
   - Confirm RSS/Privacy/License links resolve.

## Success Criteria
- Footer matches the three-row layout in both languages.
- Newsletter form aligns and posts correctly.
- Metadata row shows current mode/palette/language without being clickable.
- No layout overflow in header/footer at max scroll.

## Rollback Plan
- Revert `footer.html`, `footer.css`, and i18n changes to previous commit.
- Keep existing footer unchanged if any regression appears in navigation or newsletter behavior.
