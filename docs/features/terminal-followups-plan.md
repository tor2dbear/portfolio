# Terminal follow-ups — plan

> **Status:** working draft, source of truth for two deferred terminal features.
> Both are their own PR. Built on top of the terminal command engine in
> `assets/js/darkmode.js` (rounds 4–5, PR #226). Edit freely — decisions live
> here, not in chat.

Two follow-ups, in priority order:

1. **Mobile key bar** — make the round-4 keyboard fundamentals reachable on iOS.
2. **Terminal in-place navigation** — let a typed `cd` change page without a full
   reload, keeping the scrollback alive.

---

## 1. Mobile key bar (accessory row) — ✅ shipped

> Built as designed below: a `.terminal-keybar` in `footer.html`, styled in
> `terminal.css` (coarse-pointer only, bracketed mono keys), wired in
> `darkmode.js` (buttons reuse the existing handlers; `^C` factored into a
> shared `terminalCancelLine()`; `visualViewport` tracks the keyboard;
> `pointerdown` preventDefault keeps focus). Covered by four new Jest tests in
> `terminal-commands.test.js`.

### Why

The round-4 fundamentals (↑/↓ history recall, Tab completion) rely on keys the
**default iOS keyboard doesn't have** — so on mobile, the primary context,
they're unreachable. Standard fix in web/mobile terminals (Termux, Blink, iSH):
a small on-screen accessory row of keys pinned above the keyboard.

### Design

- A compact toolbar shown **only in terminal layout while the prompt is
  focused**, pinned just above the on-screen keyboard.
- Buttons map to the handlers already built in `darkmode.js`:
  - `↑` / `↓` → `terminalRecallHistory(-1 | +1)`
  - `Tab` → `terminalCompleteInput()`
  - `^C` → cancel the current line
  - `⌄` → scroll to the prompt (folds in the separately-parked scroll idea)
- iOS specifics:
  - Position with the **`visualViewport` API** so it tracks the keyboard
    open/close — plain `position: fixed` mis-places on iOS Safari.
  - Buttons must **not steal focus** — `preventDefault` on `pointerdown` so the
    keyboard stays up.
  - Hidden on desktop (real keys exist), or shown harmlessly.
- Progressive enhancement: no bar → the commands still work, there's just no
  recall/completion on mobile (as today).

### Files

- Terminal chrome markup: `layouts/partials/footer.html` (near `.terminal-tail`)
  or a small new partial.
- `assets/css/dimensions/layout/terminal.css` for the bar styling.
- `assets/js/darkmode.js` to wire buttons to the existing handlers + a
  `visualViewport` listener.

---

## 2. Terminal in-place navigation (SPA-style, typed-only) — ✅ shipped

> Built as designed below. New IIFE `assets/js/terminal-nav.js` owns the swap
> (fetch → swap `#main` → patch head + `--terminal-cwd` → `pushState` → refresh
> hooks → keep prompt in view), exposing `window.TerminalNav.go()`. darkmode.js's
> `navigate` action routes typed cd/resume/home here (same-origin, not home, not
> a language switch) and full-reloads otherwise; `^`-echo already prints to the
> scrollback so the swap needs no extra output. Special pages are recognised
> generically post-fetch — the four CSS-bundled pages (home, contact,
> ui-library, palette-generator) are exactly those carrying a `css/pages/*` /
> `css-page-*` stylesheet — plus `data-terminal-exempt`. Content re-init
> collapsed to lightbox figure focusability (exposed via `window.TerminalLightbox`)
> once we noted reveal is a CSS no-op in terminal and role-swapper is home-only.
> `popstate` restores in place. Covered by nine Jest tests (`terminal-nav.test.js`)
> and a Playwright run (typed cd swaps, `cd ~`/click full-reload, back restores,
> `ls` synergy, no page errors).

### Goal

Today a nav click / typed `cd` does a **full page reload**; the destination
reprints the stashed `cd` as scrollback (`stashTerminalCd` /
`printPendingTerminalCd` in `darkmode.js`). Deliberate: simple, robust, good for
non-technical visitors. Add a second mode: let the **prompt** navigate without
reloading, so the scrollback survives a `cd` — closer to a real shell (a `cd`
doesn't reboot the machine).

### Decided design (owner)

**Two modes, split by input type** — this scopes the change tightly and leaves
the common path untouched:

- **Clicks stay exactly as today.** Nav-link and in-content link clicks keep the
  current behavior: full reload + `stashTerminalCd` + `printPendingTerminalCd`
  (the top cd-echo). The gentle mode for the visitor who just clicks around —
  **untouched, battle-tested, zero risk.** So `printPendingTerminalCd` and the
  sessionStorage stash are **kept**, not retired.
- **Typed commands get the new in-place nav.** Only the command-engine
  `navigate` action (typed `cd`, `resume`, home, …) changes: navigation becomes
  **just another command** — print the echo at the **bottom prompt** exactly
  like `ls`/`cat`/`neofetch` already do (reuse `printTerminalLine` → scrollback →
  `scrollTerminalToEnd`; the viewport stays at the prompt), then `fetch` the URL,
  swap `#main`, patch the head fields + `--terminal-cwd`, and `pushState`. No
  reload, no top-injection, no `scrollTo(0,0)`.

Because only the typed path changes, a bug there never reaches ordinary
click-through visitors. Trade-off noted and accepted: a terminal user who
_sometimes clicks, sometimes types_ sees the `cd` echo land in different spots
(click → top after reload; typed → bottom) — which mirrors "mouse way vs shell
way," so it reads as logical rather than confusing.

**Fallbacks — the typed path still full-reloads for:** terminal-exempt / special
pages (home, contact, ui-library, palette-generator — per-page CSS/JS bundles +
inline JSON data islands), **language switches** (`lang` changes i18n site-wide,
not just `#main`), cross-origin targets, and any `fetch`/parse failure
(progressive enhancement — links keep working).

### Why it's feasible (research findings)

- **DOM is ideal.** No `baseof.html`; the shell is a partial sandwich —
  `header.html` opens `<body><div id="layout">` + `#topmenu` + `<main id="main">`,
  `footer.html` closes `</main>` then renders `<footer>` with `.terminal-session`
  (scrollback) and `.terminal-tail`/`#terminal-input`. **All terminal chrome is
  OUTSIDE `<main>`** (nav/boot/prompt above, session/input below). The only
  per-page DOM is a single `div.content` inside `#main`. **`#main` is a clean,
  stable swap target** — scrollback, prompt and nav stay untouched.
- **CSS needs nothing on a swap.** One global fingerprinted bundle contains every
  layout incl. `terminal.css`; layout is pure `data-layout` CSS. Ordinary
  content/list/single pages need no new CSS when `#main` swaps.
- **Hand-roll, don't add a library.** No router exists (greenfield); scripts are
  plain IIFEs concatenated by Hugo (no JS module bundler wired in), and there's
  prior `history.pushState` use in `smooth-scroll.js`. Swup/Turbo would need a
  bundler step or a vendored UMD build — awkward, and wouldn't cut the real cost.
- **The real cost is re-init, not routing.** Page init lives in
  `DOMContentLoaded`/IIFE closures with no external init seam (only
  `CotyScaleActions.init` is callable + idempotent).
  - **Must re-run on a swap (content-dependent):** `reveal-on-scroll.js` (else
    new content stays invisible — important), `lightbox.js`
    `makeFiguresFocusable()` for new `figure[data-lightbox]`, `darkmode.js` cd
    echo, `role-swapper.js` (home only), `CotyScaleActions.init()` (cheap).
  - **Must NOT re-run (double-binding hazards):** the whole `darkmode.js`
    DOMContentLoaded (duplicate `document` click/keydown incl. the nav handler,
    re-set `window.ThemeActions`), `settings-dropdown.js`, `theme-share.js`,
    `lightbox.js` overlay creation, `progressbar.js` window listeners.
  - So the work is: **refactor the content-dependent init out of those closures
    into named, idempotent functions**, and keep document/window binders
    bind-once.
- **Head/meta to patch from the fetched document:** `<title>`, meta description,
  og/twitter tags, canonical, hreflang set, robots, and the inline
  `:root { --terminal-cwd }` block (`head.html:~537`). Without patching
  `--terminal-cwd`, the prompt shows the wrong working directory.

### Build shape (own PR)

1. Refactor content-dependent init (reveal, lightbox focusability, cd echo,
   optional role-swapper/coty) into named idempotent `initX()` functions; ensure
   document/window binders are bind-once.
2. A small IIFE (`assets/js/terminal-nav.js`, ~150–250 lines) that the `navigate`
   action calls **only in terminal layout & non-exempt targets**: print the
   bottom echo, `fetch` the URL, swap `#main`, patch head + `--terminal-cwd`,
   `pushState` (+ `popstate` handler), then call the init functions. Fall back to
   `location.assign` for the fallback cases above.
3. Optional polish: wrap the swap in `document.startViewTransition` for a
   cross-fade.

### Synergy bonus

With a swap, `cd writing` updates `--terminal-cwd` and the new page's cards are
in the DOM, so the round-4 `ls` content-harvest "just works" right after `cd`.

### Verification (when built)

- Jest: unit-test the swap orchestrator's URL/skip logic and the head/cwd patcher
  against fetched-HTML fixtures; keep the existing nav/`cd` tests green.
- Browser (Playwright, Chromium preinstalled): in terminal layout, typed
  `cd writing` → URL + `--terminal-cwd` + prompt update, scrollback persists,
  `ls` lists the new page's posts; back button restores; a click still
  full-reloads as today; a `data-terminal-exempt` page full-reloads; JS-off links
  still navigate.
