#!/usr/bin/env bash
set -euo pipefail

# Netlify contexts:
# - production
# - deploy-preview   (pull requests)
# - branch-deploy
#
# Return code:
# - 0 => skip build
# - 1 => run build
#
# Policy:
# - Always skip deploy previews (PRs). GitHub Pages handles previews in this repo.
# - Skip non-main branches unless the commit message includes "[netlify]".

if [[ "${CONTEXT:-}" == "deploy-preview" ]]; then
  echo "Skipping Netlify deploy preview build (CONTEXT=deploy-preview)."
  exit 0
fi

branch="${BRANCH:-}"
if [[ -n "${branch}" && "${branch}" != "main" && "${branch}" != "master" ]]; then
  if command -v git >/dev/null 2>&1; then
    if git log -1 --pretty=%B 2>/dev/null | grep -q '\[netlify\]'; then
      echo "Netlify build forced via [netlify] tag in commit message."
      exit 1
    fi
  fi

  echo "Skipping Netlify build on branch '${branch}' (add [netlify] in commit message to force)."
  exit 0
fi

exit 1
