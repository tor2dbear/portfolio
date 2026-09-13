# Retiring the mobile key bar — inline-affordance plan

Status: **proposed** (not started). Owner decision points flagged with 🟡.

Goal: fully remove the fixed mobile key bar (`.terminal-keybar`) and replace
every function it provides with **inline affordances that live in the normal
prompt flow** — the way the ghost suggestion already works. Removing the fixed,
keyboard-pinned overlay deletes the entire class of iOS positioning bugs
(flicker on scroll, over-lift into mid-screen) at the source, because nothing
needs to be pinned above the keyboard anymore.

---

## Background — what exists today

The key bar is a coarse-pointer-only accessory row, shown while the prompt is
focused and pinned just above the on-screen keyboard, surfacing the round-4
keyboard fundamentals that the iOS keyboard lacks.

- **Markup:** `layouts/partials/footer.html` — `.terminal-keybar` with five
  `[data-keybar]` buttons: `prev` (↑), `next` (↓), `tab` (Tab), `cancel` (^C),
  `bottom` (⌄).
- **CSS:** `assets/css/dimensions/layout/terminal/input.css` — `.terminal-keybar`
  (`position: fixed; bottom: 0`, `will-change: transform`), `.terminal-keybar__key`
  and its `[`/`]` `::before`/`::after`, gated behind `@media (hover: none) and
(pointer: coarse)`.
- **JS:** `assets/js/terminal.js`
  - `KEYBAR_ACTIONS` — maps each button to an existing handler
    (`terminalRecallHistory`, `terminalCompleteInput`, `terminalCancelLine`,
    `scrollTerminalToEnd`).
  - `positionKeybar()` — the `translateY` lift that keeps it above the keyboard
    (the source of the positioning bugs; being fixed under PR #259).
  - `updateKeybarSpace()` — publishes `--terminal-keybar-h`.
  - `focus`/`blur` on the input toggle `.is-visible`; `visualViewport`
    `resize`/`scroll` reposition it.
- **Reserved space:** `--terminal-keybar-h` is consumed in
  `assets/css/dimensions/layout/terminal/boot.css` as `padding-bottom` on
  `.terminal-tail` and `scroll-margin-bottom` on `.terminal-tail__input`, so the
  live prompt is never hidden behind the fixed bar. Validated in
  `assets/css/__tests__/token-validation.test.js`.
- **i18n:** `terminal_key_prev` / `_next` / `_tab` / `_cancel` / `_bottom` in
  `i18n/en.toml` and `i18n/sv.toml`.

### The ghost suggestion (already shipped — `31367e2`)

- `.terminal-tail__ghost` is a `<button>` right after the input. It shows the
  muted remainder of a **single-candidate** completion when the caret is at the
  end of the line (`terminalGhostRemainder`). A tap accepts it on mobile
  (`terminalAcceptGhost`); `→`/`End`/`Tab` accept on desktop.
- Source of candidates: `terminalCompletionFor()` (commands, paths, page index).
  **It does not consult command history.**

### The floating jump button (already shipped)

- `.terminal-jump` (`[data-js="terminal-jump"]`) appears on **any** device once
  the live prompt scrolls out of view (IntersectionObserver on the prompt), and
  drops back to the prompt on click. **This already covers the key bar's ⌄** —
  the ⌄ in the key bar is redundant.

---

## Coverage map — every key-bar function → its inline replacement

| Key-bar button         | Function                     | Inline replacement                                                                                                                | New work?                                 |
| ---------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `⌄` bottom             | Jump to prompt               | `.terminal-jump` (already exists, all devices)                                                                                    | **None** — just delete the redundant key. |
| `Tab` (1 candidate)    | Complete the lone match      | Ghost tap (already exists)                                                                                                        | **None.**                                 |
| `Tab` (≥2 candidates)  | List / common-prefix fill    | New inline **Tab chip** at end of line, shown only when `candidates.length > 1`                                                   | Phase 2                                   |
| `↑` prev               | Recall last matching command | New **history autosuggestion** folded into the ghost                                                                              | Phase 1                                   |
| `↓` next / deep browse | Walk further through history | 🟡 see "Open questions" — ghost covers the common case; deep browsing may move to an inline history chip or the `history` command | Phase 1/2                                 |
| `^C` cancel            | Clear line / abort flow      | New inline **clear affordance** (✕) shown when the field has text or a flow is active                                             | Phase 2                                   |

Design rule for every replacement: **inline, in document flow, next to the
prompt** — no `position: fixed`, no `visualViewport` math. When the prompt is
focused it already sits just above the keyboard, so inline affordances are
naturally in reach without being pinned.

---

## Phased delivery

Each phase is independently shippable and leaves the terminal fully usable. The
key bar is only removed in the final phase, once its replacements are proven.

### Phase 0 — stabilise the interim (PR #259, in flight)

The key bar stays during phases 1–2, so it must not be broken meanwhile.

- Land the positioning fix (measure-based lift, no scroll reposition).
- Drop the redundant `⌄ bottom` button now (cheap, and `.terminal-jump` already
  covers it). Keep the `terminal_key_bottom` i18n key — `.terminal-jump` reuses
  it for its `aria-label`.
- **Rebase the branch onto current master first** — it was cut before the ghost
  work landed and is ~15 commits behind.

### Phase 1 — history autosuggestion in the ghost (replaces `↑`)

Fish-style: when the typed line is a prefix of a recent history entry and there
is no stronger completion candidate, preview the rest of that entry as ghost
text; tap / `→` / `End` accepts it.

- Extend `terminalGhostRemainder()`:
  1. Keep today's completion suggestion as the **first priority** (a live
     command/path completion is more specific than a stale history line).
  2. If there is no single completion candidate, scan `terminalHistory`
     newest→oldest for the first entry that `startsWith(value)` and is longer,
     and return its remainder.
- `terminalAcceptGhost()` already appends whatever the ghost holds — no change.
- 🟡 Decide styling: same muted ghost for both, or a subtle marker (e.g. a
  trailing `↑` glyph) to signal "from history" vs "completion". Recommend
  keeping them visually identical for simplicity.

Result: the single most common use of `↑` on mobile — "bring back the last
command like this one" — becomes a tap, no key bar needed.

### Phase 2 — inline clear + inline Tab list (replaces `^C` and multi-candidate `Tab`)

Two small inline buttons rendered inside `.terminal-tail`, after the ghost,
shown only when relevant (empty otherwise, like the ghost, so they never nudge
the layout):

- **Clear (`✕`)** — visible when `terminalInput.value` is non-empty **or** a
  flow is active. Click → `terminalCancelLine()` (which already echoes `^C`,
  aborts a running flow, and clears the field). Covers `^C`'s mobile use.
- **Tab chip** — visible only when the caret is at end of line and
  `terminalCompletionFor(value).candidates.length > 1`. Click →
  `terminalCompleteInput()` (fills the common prefix / prints the list). Covers
  the ambiguous-completion case the ghost can't (the ghost only ever previews a
  lone candidate).

Both reuse existing handlers; the work is markup + visibility wiring +
`pointerdown` `preventDefault` (keep the keyboard up), mirroring the ghost.

### Phase 3 — remove the key bar

Once phases 1–2 are in and verified on-device, delete the bar and all its
plumbing:

- `footer.html`: remove the `.terminal-keybar` block.
- `input.css`: remove `.terminal-keybar`, `.terminal-keybar__key`,
  `::before`/`::after`, `:active`.
- `terminal.js`: remove `KEYBAR_ACTIONS`, `positionKeybar()`,
  `updateKeybarSpace()`, the key-bar `focus`/`blur` handlers, and the
  `visualViewport` `resize`/`scroll` listeners that drive it. Keep
  `terminalRecallHistory` / `terminalCompleteInput` / `terminalCancelLine` /
  `scrollTerminalToEnd` — they're now called only by keys + inline affordances.
- `boot.css`: remove the `--terminal-keybar-h` `padding-bottom` /
  `scroll-margin-bottom` reservations (nothing overlays the prompt anymore).
- `token-validation.test.js`: drop the `--terminal-keybar-h` entry.
- i18n: remove `terminal_key_prev` / `_next` / `_tab` / `_cancel` from
  `en.toml` + `sv.toml`. **Keep `terminal_key_bottom`** (used by
  `.terminal-jump`).

---

## Files touched (summary)

| File                                            | Phase 1             | Phase 2                        | Phase 3                                   |
| ----------------------------------------------- | ------------------- | ------------------------------ | ----------------------------------------- |
| `assets/js/terminal.js`                         | ghost history logic | inline clear + Tab chip wiring | remove key-bar JS                         |
| `layouts/partials/footer.html`                  | —                   | add inline buttons             | remove `.terminal-keybar`                 |
| `assets/css/.../input.css`                      | —                   | style inline buttons           | remove key-bar CSS                        |
| `assets/css/.../boot.css`                       | —                   | —                              | remove `--terminal-keybar-h` reservations |
| `i18n/en.toml`, `i18n/sv.toml`                  | (history hint?)     | labels for clear / Tab         | remove retired keys                       |
| `assets/js/__tests__/terminal-commands.test.js` | history-ghost tests | clear + Tab-chip tests         | remove key-bar tests                      |
| `assets/css/__tests__/token-validation.test.js` | —                   | —                              | drop keybar-h token                       |

---

## Edge cases & risks

- **Deep history browsing is lost.** The ghost only surfaces the _latest_
  matching entry; there's no inline equivalent of repeatedly pressing `↑` to
  walk back through many commands. 🟡 Owner decision: accept this on mobile
  (the `history` command lists everything and is clickable), or add a small
  inline history chip that cycles. Recommend accepting it — physical keyboards
  still have `↑`/`↓`, and mobile deep-recall is rare.
- **Ghost priority.** Completion must win over history so a live path/command
  suggestion isn't shadowed by a stale line. Encoded in Phase 1 ordering.
- **Discovery of ambiguous completions.** Without the Tab chip a mobile user has
  no way to see multiple candidates — so the Tab chip (Phase 2) is required, not
  optional, before Phase 3.
- **Tap-target size.** The ghost and new inline buttons are inline text; ensure a
  comfortable touch target (padding / min-height) without shifting the baseline.
- **Accessibility.** The ghost is `aria-hidden`; the new clear/Tab buttons need
  real `aria-label`s (i18n) since they're actionable. Keep `tabindex="-1"` so
  they don't interrupt the tab order into the field.
- **`enterkeyhint="go"`** and the OK/enter key are unaffected — submitting a
  command stays a keyboard action.

---

## Testing

- **Keep green throughout:** `npm test` (Jest) and `npm run lint`.
- **Phase 1:** extend `terminal-commands.test.js` — typing a prefix of a history
  entry previews it as ghost; accepting fills it; a live completion candidate
  takes precedence over a history match.
- **Phase 2:** clear button appears only with text / active flow and calls
  `terminalCancelLine`; Tab chip appears only for ≥2 candidates at end of line
  and calls `terminalCompleteInput`.
- **Phase 3:** remove the four key-bar tests (focus toggles `.is-visible`, each
  `[data-keybar]` click); assert `.terminal-keybar` is gone; drop the
  `--terminal-keybar-h` token test.
- **On-device (iOS Safari):** the whole point — verify no affordance is pinned
  above the keyboard, nothing flickers on scroll, and completion / history /
  clear are all reachable while typing.

---

## Suggested PR sequence

1. **PR #259 (rebased):** positioning fix + remove redundant `⌄`. _Interim
   safety; unblocks the rest._
2. **PR B:** Phase 1 — history autosuggestion in the ghost.
3. **PR C:** Phase 2 — inline clear + Tab chip.
4. **PR D:** Phase 3 — remove the key bar and its plumbing.

Splitting this way keeps every step reversible and always ships a working
terminal; the fixed bar is only deleted once its inline replacements are live
and verified.

---

## Open questions for the owner 🟡

1. Accept the loss of deep (multi-step) history browsing on touch, or build an
   inline history chip for it?
2. Should history-sourced ghost text be visually distinguished from
   completion-sourced ghost text?
3. Keep `^C`'s `^C` echo line when the inline clear is used, or clear silently on
   mobile? (Current `terminalCancelLine` echoes `^C`.)
