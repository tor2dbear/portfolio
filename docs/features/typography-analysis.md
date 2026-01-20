# Typography Analysis (Draft)

## Scope
Review of current typography tokens, utilities, and template usage in this branch. This is an analysis-only document (no implementation).

## What’s Solid
- Clear token layering (primitives → semantic → components).
- Font pairing is consistent: serif for body, sans for UI/headlines.
- Useful utilities exist (`text-*`, `tracking-*`, `text-color-*`).
- Sensible line-height scale and 70ch max-width for body text.

## Issues / Friction Points (Observed)
1. **Global paragraph styling is too broad**
   - `p` is globally styled as `type-body` (serif, 18px, 70ch).
   - This leaks into UI copy, cards, and footer text unless overridden.
   - It makes “content” and “UI” typography hard to separate.

2. **Heading system is split**
   - `h1/h2/h3/h4` are globally styled as sans, bold.
   - `.type-heading` is serif and separate.
   - Templates mix semantic tags + utility classes, creating inconsistent output.

3. **Scale jumps**
   - `text-2xl` → `text-3xl` (24 → 30) and `text-4xl` → `text-5xl` (36 → 48) are large jumps.
   - No “in-between” size for smaller headline steps.

4. **Caption vs Blockquote overlap**
   - `.type-caption` and `blockquote` both use serif + 30px.
   - Hard to visually differentiate a quote from a caption.

5. **Letter-spacing logic is partly inconsistent**
   - `.type-headline-small` uses `font-family: sans` but `font-weight: serif-weight-regular`.
   - Tracking is okay but not consistently tied to size/role.

6. **Prose lacks dedicated container**
   - `.content` has general spacing rules but no dedicated `.prose` system.
   - Lists, tables, and inline code rely on browser defaults.

## Recommendations (Low Risk → Higher Risk)
### 1) Create a **prose wrapper** (low risk, high impact)
- Add `.prose` class to markdown content blocks.
- Move paragraph styles (70ch, serif, line-height) into `.prose` only.
- Provide minimal styles for lists, blockquotes, tables, and inline code.

### 2) Add one or two **intermediate sizes**
- Option A: add `--text-md` (17–18px) and `--text-1-5xl` (32px).
- Keeps existing scale intact while reducing awkward jumps.

### 3) Differentiate caption vs blockquote
- Keep captions small (`text-sm` or `text-base`) + italic.
- Reduce blockquote size (e.g. `text-xl`) or add border/indent.

### 4) Align headline semantics
- Decide: do we want `h1/h2/h3` to be sans headlines or serif display?
- Option: keep `h1/h2/h3` as-is, but add `.type-display-*` for serif hero.

### 5) Clean small inconsistency
- `.type-headline-small` should use `sans-weight-regular` if it is sans.

### 6) Consider **fluid sizes** (later)
- `clamp()` for 1–2 headline sizes only (avoid sweeping changes).
- Not necessary until prose cleanup + scale tweaks are done.

## Suggested Next Steps (Phased)
**Phase 1 (Safe):**
- Add `.prose` wrapper and move `p` styles inside.
- Add minimal list/blockquote/table styling.
- Fix `.type-headline-small` weight.

**Phase 2 (Moderate):**
- Add `--text-md` and `--text-1-5xl`.
- Adjust `type-headline-3/4` and caption sizes to reduce jumps.

**Phase 3 (Risky):**
- Introduce new semantic classes (`type-display-*`, `type-lead`).
- Refactor templates to use those consistently.

## Open Questions
- Should **body text** be 16px or 18px as default for prose?
- Do we want **serif or sans** for default `h1` on content pages?
- Should captions be **small + muted**, or remain prominent?

---
If you want, I can turn Phase 1 into a concrete implementation plan next (files + exact changes).
