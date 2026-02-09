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

if [[ "${CONTEXT:-}" == "deploy-preview" ]]; then
  echo "Skipping Netlify deploy preview build (CONTEXT=deploy-preview)."
  exit 0
fi

exit 1

