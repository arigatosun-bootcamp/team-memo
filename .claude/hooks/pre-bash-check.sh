#!/bin/bash
# Bashコマンド実行前のチェックフック
# mainブランチへの直接commit/pushをブロック

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [ -z "$CMD" ]; then
  exit 0
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

# mainブランチでのcommit/pushをブロック
if echo "$CMD" | grep -qE "git\s+(commit|push)" && [ "$CURRENT_BRANCH" = "main" ]; then
  cat <<'HOOK_OUTPUT'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "mainブランチへの直接commit/pushは禁止です。先にブランチを切ってください。\n例: git checkout -b feat/issue-{番号}-{説明}"
  }
}
HOOK_OUTPUT
  exit 0
fi

exit 0
