# CI & review surfacing

How PR findings reach the people (and agents) working on the repo, and what is
still pending. Companion to `docs/testing-gaps.md` (which tracks the test
coverage work); this doc is about the review/CI _surfacing_ layer.

Guiding idea: findings should show up **where the work happens** — in the PR
conversation and the events an agent already watches — not buried in a green
job's logs.

## What we have (all live on `master`)

### 1. `npm audit` in the sticky PR comment

- `scripts/quality/audit-summary.mjs` runs `npm audit`, parses the
  moderate/high/critical counts, and appends a `## 🔒 Dependency audit` section
  to `artifacts/quality/summary.md`.
- That file is posted as the sticky **CI Quality Report** comment by the
  `quality` job (`.github/workflows/pr-checks.yml`). Non-blocking.
- Catches the moderate/low advisory class that the push-job
  `npm audit --audit-level=high` step (still `continue-on-error`) never surfaces.
- ✅ Verified live on PRs #245 and #246.

### 2. Codex review surfacing — `codex-review-surface.yml`

- Trigger: `pull_request_review` submitted by `chatgpt-codex-connector[bot]`.
- Pins a sticky `🔎 Codex review` comment (reviewed SHA + inline-suggestion
  count + link). Codex only _submits a review_ when it has feedback, so the
  workflow firing is itself the signal.
- Runs from the **default branch** (that's how `pull_request_review` workflows
  resolve), so it only applies to PRs opened after it landed on `master`.
- Note: when Codex has nothing to flag it may instead leave a plain issue
  comment ("no changes needed") or react 👍 — neither is a formal review, so
  this workflow correctly stays silent. Not yet observed firing on a real
  feedback case; confirm on a future substantive PR.

### 3. Codex re-review on demand — `codex-rereview.yml`

- Trigger: the `codex-review` **label** added to a PR.
- Posts `@codex review` (Codex's documented re-review trigger), then removes the
  label so it can be re-added for another pass.
- ✅ The label→comment step fires correctly.

### Agent-side

- A session can `subscribe_pr_activity` on a PR; Codex reviews, CI failures, and
  comments then arrive as events. This is the tightest "reach the agent in the
  loop" channel.

## What's pending / gotchas

### ⚠️ `CODEX_TRIGGER_TOKEN` — required for the label re-review to actually work

The #246 test proved Codex **ignores the `@codex review` comment when it is
posted by `github-actions[bot]`** — it replied "To use Codex here, create a
Codex account and connect to github". Codex keys off the _comment author's_
identity.

Fix: add a repo secret `CODEX_TRIGGER_TOKEN` = a fine-grained PAT from a
**Codex-connected** GitHub account (i.e. the maintainer's own account, which
already has Codex reviewing its PRs):

- GitHub → avatar → Settings → Developer settings → Fine-grained tokens →
  Generate. Repository access: `portfolio`. Permissions: **Pull requests: R/W**
  and **Issues: R/W**.
- Add at `Settings → Secrets and variables → Actions` as `CODEX_TRIGGER_TOKEN`.

`codex-rereview.yml` already uses `secrets.CODEX_TRIGGER_TOKEN || GITHUB_TOKEN`,
so no code change is needed once the secret exists. Until then, trigger a
re-review by commenting `@codex review` yourself.

### Hugo parses everything under `layouts/`

Hugo compiles _every_ file under `layouts/` as a template, so test files and
render fixtures must NOT live there — a `{{-` in a JS comment aborts
`hugo --minify` and breaks the production build. The Hugo-render harness lives in
`test/` for this reason (see the docstring in `test/hugo-render.test.js`).

### Deliberately skipped

- **Dependabot** — reaches a person (email / auto-PRs), not the PR loop, so it
  doesn't serve the "surface in the dev loop" goal. Not configured.
- The raw push-job `npm audit --audit-level=high` + `continue-on-error` step is
  left as-is; surfacing happens via the sticky comment instead. Could be tidied
  later.

## One-time setup checklist

- [ ] Create the `codex-review` label (done).
- [ ] Add the `CODEX_TRIGGER_TOKEN` secret (pending — see above).
- [ ] Confirm `codex-review-surface` fires on a PR where Codex has real
      suggestions.
