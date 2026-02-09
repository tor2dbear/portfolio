# Portfolio (Hugo) – Quality Loop

This repo uses a PR-centric quality feedback loop:
- Feedback is visible directly in the PR via a sticky “CI Quality Report” comment.
- Only **BLOCKERS** fail CI (and should block merge). Everything else is informational/backlog.

## How to work (recommended)

1. Create a PR early (Draft is fine).
2. Push commits normally.
3. Fix **BLOCKERS** until the `pr-checks` workflow is green.
4. Merge when blockers are gone.

Quality policy thresholds are configured in `quality-policy.yml`.

## What CI does

### Push to feature branches (fast)

Workflow: `.github/workflows/pr-checks.yml`
- Lint + tests + Hugo build

### Pull Requests (full)

Workflow: `.github/workflows/pr-checks.yml`
- Lint + tests + Hugo build
- Lighthouse (scores)
- axe (a11y violations)
- Posts/updates a sticky PR comment: “CI Quality Report”
- Fails the workflow only on **BLOCKERS** (per `quality-policy.yml`)

Preview deploys are handled separately by `.github/workflows/gh-pages.yml`.

## Run locally

### Preflight (fast)

```bash
npm ci
npm run lint
npm test
hugo --minify
```

### Quality checks (serve + collect + summarize)

Build and serve the site:

```bash
hugo --minify --baseURL "http://127.0.0.1:4173/"
(cd public && python3 -m http.server 4173 --bind 127.0.0.1)
```

In another terminal, collect Lighthouse + axe and generate a summary:

```bash
node scripts/quality/run-lighthouse.mjs --mode full --baseUrl "http://127.0.0.1:4173" --outDir "artifacts/lighthouse"

ROUTES="$(node scripts/quality/print-routes.mjs --mode full)"
npx -y --package=playwright@1.49.1 --package=@axe-core/playwright@4.10.2 node scripts/quality/run-axe.mjs \
  --baseUrl "http://127.0.0.1:4173" \
  --routes "$ROUTES" \
  --outFile "artifacts/axe/axe-results.json"

node scripts/quality/evaluate.mjs \
  --mode full \
  --lighthouseDir "artifacts/lighthouse/.lighthouseci" \
  --axeFile "artifacts/axe/axe-results.json" \
  --outDir "artifacts/quality"

node scripts/quality/gate.mjs --summary "artifacts/quality/summary.json"
```

## Baseline / regressions

Not enabled yet in this first iteration.

The next step (per the plan) is to compare PR results vs the latest successful `main` baseline and:
- show deltas in the PR comment
- create issues only for *new* regressions (with dedupe)

