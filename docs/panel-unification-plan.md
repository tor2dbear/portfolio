# Panel unification — one settings panel at all breakpoints

Collapse the two near-duplicate theme controls into a single responsive panel,
so every control (incl. Layout) lives in exactly one place. Root cause of the
"Layout missing on desktop" bug: the same UI exists twice and a new control was
only added to one copy.

---

## Current state

`topmenu.html` renders **three** theme-related items:

| Partial | Shown | Sections |
|---|---|---|
| `theme-dropdown.html` | ≥ 30em (desktop/tablet) | mode · typography · effects |
| `language-dropdown.html` | ≥ 30em | language |
| `settings-dropdown.html` | < 30em (xs only) | mode · typography · **layout** · effects · **language** |

Breakpoint switch in `navigation.css`:
- base: `.top-menu__item--settings { display: none }`
- `@media (max-width: 29.9375em)`: hide `--theme` + `--language`, show `--settings`.

**The settings panel is already the superset.** Desktop is the deficient one.

Both panels carry their own toggle + overlay + open/close JS, and both use the
same portal pattern (`dropdown-panel--portal`, `mountPanelPortal` /
`shouldUsePanelPortal`). They even cross-close each other
(`closeThemePanel` / `closeLanguagePanel`). Two controllers:
- `darkmode.js` — theme panel (owns `ThemeActions`, portal helpers).
- `settings-dropdown.js` (221 lines) — settings panel (own portal + toggle).
- `language-dropdown.js` (258 lines) — language navigation (binds radio inputs
  globally via `data-language-href`; **panel-agnostic**, so it already powers
  the language list inside the settings panel).

Verified non-issues:
- **Keyboard chords** (`keyboard-chords.js`) only call `ThemeActions` /
  `LanguageActions` / grid — they never open a panel. Untouched by this work.
- **Language switching** works from the settings panel today (global input
  binding), so folding language in is free.

Shared CSS: the section/option styles (`.theme-section`, `.theme-options`,
`.theme-option--typography`, `.typography-preview`, …) live in
`theme-dropdown.css` and are used by **both** panels. Retiring the desktop panel
must NOT delete these — only the theme-*panel/toggle*-specific rules.

---

## Target state

- **One** panel (the current settings panel — already the superset), rendered
  once, shown at all breakpoints.
- **One** toggle, **one** overlay, **one** JS controller.
- Responsive via CSS + the existing portal: desktop = anchored popover
  (`--theme-panel-width`), mobile = full-screen sheet.
- `theme-dropdown.html`, `language-dropdown.html` and their toggles retired.

---

## Decisions to confirm

1. **Toggle icon/affordance.** Desktop uses `#icon-theme-palette`; mobile
   settings uses `#icon-settings`. Pick one for the unified toggle.
   Recommendation: keep `#icon-theme-palette` (established theme entry point).
2. **Which controller survives.** Recommendation: keep `darkmode.js`
   (it already owns `ThemeActions` + the portal helpers), point it at the
   settings panel's `data-js` hooks, and retire `settings-dropdown.js`.
3. **Toggle label/aria + shortcut chip.** Settings toggle aria is
   `i18n "Settings"`; theme toggle aria is also `i18n "Settings"`. Keep as-is.

---

## Migration steps (ordered, each verifiable)

1. **Render one panel everywhere.** In `topmenu.html`, keep the
   `--settings` item and render the (renamed) unified panel; remove the
   `theme-dropdown.html` and `language-dropdown.html` partials.
2. **CSS visibility.** In `navigation.css`: remove the xs-only switch and the
   base `--settings { display:none }`; show the unified item at all sizes;
   drop the `--theme` / `--language` item rules.
3. **Desktop popover styling.** Port the popover positioning from
   `theme-dropdown.css` (`--theme-panel-width`, anchor/offset) onto the
   settings panel for ≥ 30em; keep the mobile sheet styles below it. Confirm
   the portal only engages at the mobile breakpoint.
4. **One controller.** Move/confirm the panel open/close/overlay/escape/
   outside-click/portal logic in `darkmode.js` targets the settings panel
   hooks. Delete the cross-closing helpers (`closeThemePanel`,
   `closeLanguagePanel`) — only one panel remains. Retire
   `settings-dropdown.js`.
5. **Language.** Keep `language-dropdown.js` (navigation logic) but retire the
   separate language *panel/toggle*; verify its radio-input binding still
   attaches to the language list inside the unified panel.
6. **Cleanup.** Delete `theme-dropdown.html`, `language-dropdown.html`,
   `settings-dropdown.js`; drop their resource registrations in `head.html`;
   remove dead panel/toggle CSS (NOT the shared section/option styles).
   Consider renaming `settings-dropdown.{html,css}` → `theme-panel.*` for
   clarity (optional, do last).
7. **Verify matrix.** Desktop + mobile: open/close, overlay, Escape,
   outside-click, portal on mobile only, every section works
   (mode/typo/layout/effects/language), no double-bound listeners, chords
   still work.

---

## Risks / watch-outs

- **Shared CSS:** `theme-dropdown.css` holds styles used by the surviving
  panel. Strip only panel/toggle-specific rules; keep section/option styles.
- **Portal parity:** two controllers had slightly different portal logic — pick
  `darkmode.js`'s and test BOTH breakpoints for the sheet↔popover transition.
- **Double toggles during transition:** ensure exactly one toggle button is in
  the DOM after step 1, or focus/aria state can desync.
- **Language radio binding:** confirm `language-dropdown.js` finds the inputs in
  the unified panel after the separate language panel is removed.

---

## Why this is the right call

It removes a whole class of bugs (add-a-control-in-one-place), halves the
panel/controller surface, and matches how the site already behaves on
mobile — one panel that holds everything. The only real cost is desktop
popover styling, which is a deliberate design choice worth owning anyway.
