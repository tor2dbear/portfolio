# Terminal architecture — the persistent-session plan ("Väg 3")

Status: **planned**. Captures a decision reached in design discussion so future
sessions can find it. Nothing here is built yet beyond what shipped in the
terminal Tab-completion work (PR #248).

## Where we are

The terminal (`assets/js/terminal.js`) is a transcript-mode CLI drawn over a
normal multi-page Hugo site. Its defining choice: **terminal state lives in the
DOM of whatever page is currently loaded.** Every navigation is a full page
load, and the terminal re-hydrates from scratch (nav links, the manifest, the
`terminal-i18n` catalog, the cards on the page, CSS vars for cwd).

That MPA + progressive-enhancement model is _good_ for a portfolio: real URLs,
SEO, works without JS, shareable links, content can't desync from state because
content **is** the state. And it let us build the terminal feature by feature.

The friction shows up at "stay in the session and change the world" operations.
`set language` / `lang` does a **full reload** (a `navigate` action to the
translated URL), because Hugo renders separate static pages per language. Same
root cause behind append-only `cd` (doesn't navigate) and the lack of a
cross-page history.

The tell: our last several features — the ls cache, `remote-ls`, path-aware
completion, and the `index.json` prefetch — are all incrementally rebuilding
_one client-side model of the whole site_. That is exactly what a
content-model-first architecture would have as its foundation.

## The plan ("Väg 3"): one filesystem model + one swap flow

Promote a single authoritative source — the site's structure as data — to the
terminal's canonical "filesystem," and make **navigation a terminal operation**
(client-side content swap) instead of a browser reload. Language switch, `cd`
navigation, and history then all fall out of one model instead of being bolted
on per case.

SEO/no-JS stay free **as long as swap is an enhancement of real `<a href>`
links, never a replacement**: a direct visit or a crawler still gets the full
server-rendered page; JS only intercepts navigation when it's already running.
This is the Turbo / htmx / Astro-view-transitions pattern — not something we
invent.

The single highest-leverage refactor, valuable regardless of how far we go:
centralize `session.hydrate(source)` — one function that, given a source
(the initial DOM or a fetched+parsed document), transplants the chrome
(`#main`, `[data-js="terminal-i18n"]`, the manifest, nav, footer, `<html lang>`)
and resets the derived caches. Today that hydration is implicit and scattered
across several caches and DOM reads; that scattering is what makes a
client-side swap risky (the "Swedish page, English replies" desync class).

## Migration — four independent steps, never a big-bang

Each step ships on its own, is testable, and changes no UX until the last.

### Step 1 — consolidate the site model into one source (`terminal-fs.js`)

Replace the ad-hoc mechanisms (`terminalDirTree`, top-level-only
`terminalManifest`, `terminalPageContentSlugs`, `terminalLsDirCache` +
`terminalSeedContentIndex`, `remote-ls` listing) with **one full-tree manifest**
and a dedicated module.

- **Widen the manifest to the whole tree.** Change
  `layouts/partials/terminal-manifest.html` so it ranges _all_ nodes — sections,
  every regular page (the posts inside `works`/`writing`/…), taxonomy dirs
  (`tags/` + each term) — keyed by path segments, each `{kind, url, title,
tags}`. Emitted per language (it already strips the lang prefix). A portfolio
  is ~40 pages/language → ~5 KB inline, negligible, so keep it **synchronous
  inline** in `head.html` (no fetch, no prefetch). If size ever bites, split to
  a built `/terminal-fs.json` per language, fetched once — but start inline.
- **Create `terminal-fs.js`** (`window.TerminalFS`, same data-module pattern as
  `terminal-data.js`). Move in `terminalNodeAt`, the manifest helpers
  (`terminalNodeKind` / `terminalManifestUrl` / `terminalEntryLabel`), the tree
  builder, and expose `fs.ls(segs)` / `fs.complete(...)` reading the full
  manifest.
- **Reroute** `ls`, `cd`, `tree`, and `terminalCompletionFor` in `terminal.js`
  to the fs module.
- **Retire** what a complete synchronous manifest makes redundant:
  `terminalLsDirCache`, `terminalSeedContentIndex` (index prefetch),
  `terminalPageContentSlugs` in the completion/ls path, and the `remote-ls`
  fetch for _listing_ (keep `remote-cat` for loading content; `remote-ls` may
  remain only as a defensive fallback for a node missing from the manifest).

Constraints: behavior-preserving (no UX regression — completion/ls now know the
whole tree _synchronously_, which the prefetch already gave asynchronously);
`npx jest` stays green (update tests tied to the retired mechanisms; add that
`ls`/completion in an unvisited directory now works with no `await`/focus). Hugo
isn't in the dev container, so verify the manifest partial via the existing
template-render tests.

### Step 2 — extract `session.hydrate()`

Pull the scattered hydration into one function that both boot and (future) swap
call. Reset the fs/i18n caches through it. No UX change.

### Step 3 — `session.navigate()` swap, for language first

Introduce the client-side swap for the single `set language` / `lang` case:
`fetch(url) → DOMParser → session.hydrate(doc) → history.pushState → print the
confirmation in the new language`. Fall back to `location.assign(url)` if the
fetch fails. Add `popstate` handling. Everything else still full-loads. Prove
the pattern; verify no desync in a headless browser. This is the original ask
("page reloads on language switch — can we avoid it?").

### Step 4 (optional) — extend swap to internal links + `cd` navigation

Once step 3 is proven, route internal `<a>` clicks and `cd`-to-a-page through
the same `navigate()`.

## Rough cost

~half a day per step 1–3; step 4 optional. ~1.5–2 focused days to get
language-switch-without-reload done right, with a cleaner codebase and retired
patches as a side effect. Compare to ~half a day for a one-off transplant swap
that adds a permanent desync-maintenance tax (the "worst of both worlds"
option we explicitly rejected).
