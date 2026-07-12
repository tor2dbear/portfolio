# Codex flow check (temporary)

Throwaway PR to verify the review/CI surfacing wired up in #245:

- `quality` CI job posts the sticky comment with the `🔒 Dependency audit` line.
- Codex reviews the PR on open; `codex-review-surface` pins a `🔎 Codex review`
  comment if Codex has feedback.
- Adding the `codex-review` label posts `@codex review` (tests the re-review
  path, and whether a `CODEX_TRIGGER_TOKEN` PAT is needed).

Close this PR without merging once verified — delete the branch.
