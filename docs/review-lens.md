# Review Lens — break-mode checklist

A short, living checklist for reviewing a diff in **break mode** (assume it is
broken; find how) rather than build mode (make the change work). It exists
because the Codex PR reviewer keeps finding the same _classes_ of bug, and
those classes are cheap to catch on purpose instead of by luck.

Use it two ways:

1. **Before merge**, read the diff against this list — ideally in a fresh
   context so you come at it cold, without the implementation's own
   rationalisations loaded. This is what makes a reviewer (human or agent) find
   what the author missed: a separate pass with a skeptic's mandate.
2. **After a review finds something**, if the category already appears below and
   we've now seen it twice, push it left — turn it into a test, lint rule, or
   assertion so neither a human nor Codex has to catch it by eye again. Every
   entry here should trend toward "covered by machinery".

This does **not** replace Codex. Two independent reviewers with different
training find different bugs; the point is to stop _re-discovering_ the same
ones.

---

## The meta-pattern

Every recurring finding so far is a **second-order bug**: it is invisible in
the diff itself and only appears when you imagine a _state the code doesn't put
in front of you_ — a thrown exception, a race, an adversarial input, a focus
landing somewhere odd. Build mode verifies the happy path; break mode simulates
the states that _can_ occur. When reviewing, for each change ask: "what state
could reach this line that the author didn't test?"

---

## Recurring categories

### 1. Trust-boundary / origin validation

- **Shape:** a suffix or wildcard match that is wider than intended lets an
  attacker-controlled host through. `endsWith(".netlify.app")` matches
  `attacker.netlify.app`.
- **Seen:** PR #275 — `*.netlify.app` origin gate on `clanker-report.js` and
  `newsletter-subscribe.js`.
- **Catch:** match against an explicit allowlist (`host === "tor-bjorn.netlify.app"`
  or `host.endsWith("--tor-bjorn.netlify.app")`, not the bare suffix). Add a
  unit test that a foreign host is rejected _and_ a legit preview host is
  allowed — see `netlify/functions/__tests__/clanker-report.test.js`.

### 2. Script load order & module-seam races (`async` vs `defer`)

- **Shape:** an `async` script and the `defer` script it depends on race. If the
  dependency loses the race, a module snapshots an empty seam object
  (`window.Theme`) at evaluation time and later calls an undefined method.
- **Seen:** PR #278 — terminal bundle loaded `async` while `js.js` (which
  publishes `window.Theme`) was `defer`; a cache/network win left the terminal
  unusable.
- **Catch:** sequence dependent loads after the seam is published, or resolve
  the seam lazily at call time rather than capturing it at IIFE evaluation.
  Review any new `<script>` in `head.html` for its ordering guarantee. See
  `AGENTS.md` → "Architecture: modules and seams" and "CSS Load Order".

### 3. Focus / keyboard traps

- **Shape:** a modal focus trap assumes `overlay.contains(activeElement)` means
  focus is safely inside. It isn't, when the active element is an `<iframe>`
  (Tab events fire in the child document) or a control that just became
  `disabled` while focused (excluded from the focusable set but still
  `activeElement`).
- **Seen:** PR #281 — both cases in `lightbox.js`.
- **Catch:** treat an active element absent from the focusable set as a
  boundary (wrap), and disable pointer focus on non-interactive iframes.
  Regression tests live in `assets/js/__tests__/lightbox.test.js` — the
  "just became disabled" case is the template to copy for new trap logic.

### 4. Storage / persistence that can fail

- **Shape:** downstream logic assumes a write succeeded. When
  `localStorage.setItem` throws (private mode, quota) a `safeSet` helper
  swallows it, but the caller still acts as if the value was persisted — e.g.
  redirects to a page that then reads back nothing.
- **Seen:** PR #275 — terminal-layout selection redirected even when the
  preference wasn't saved.
- **Catch:** have the storage helper return success/failure and branch on it;
  don't navigate or redirect on the assumption of a persisted value. Test the
  throwing-storage path explicitly.

---

## Adding a category

When Codex (or a human) finds a bug that doesn't fit an entry above, add one:
the failure **shape**, where it was **seen** (PR #), and how to **catch** it
(the test/lint/assertion that makes it stick). Keep entries short — this is a
lens, not a manual.
