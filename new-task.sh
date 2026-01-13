#!/bin/bash
# Användning: ./new-task.sh <typ> <namn>
# Exempel: ./new-task.sh feature login-page

TYPE=$1
SLUG=$2

if [ -z "$TYPE" ] || [ -z "$SLUG" ]; then
    echo "Usage: ./new-task.sh <type> <slug>"
    echo "Example: ./new-task.sh feature login-page"
    exit 1
fi

SESSION_ID=$(openssl rand -hex 2)
BRANCH_NAME="$TYPE/$SLUG-$SESSION_ID"
TARGET_DIR="worktrees/$SLUG-$SESSION_ID"

echo "🔄 Updating main branch..."
git switch master && git pull

echo "🌿 Creating worktree and branch: $BRANCH_NAME"
git worktree add "$TARGET_DIR" -b "$BRANCH_NAME"

echo "🚀 Opening VS Code in $TARGET_DIR"
code "$TARGET_DIR"

echo "✅ Done! Work in the new VS Code window."
