#!/bin/bash
# PostToolUse: lint/typecheck/test コマンド実行後にログを記録するフック

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_result.exitCode // empty' 2>/dev/null)

if [ -z "$CMD" ]; then
  exit 0
fi

# lint/typecheck/test コマンドのみログ対象
if echo "$CMD" | grep -qE "npm run (lint|typecheck|test)|npm test|vitest|tsc|eslint"; then
  LOG_DIR=".claude/logs"
  mkdir -p "$LOG_DIR"

  LOG_FILE="$LOG_DIR/ci-$(date +%Y-%m-%d).log"
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

  if [ "$EXIT_CODE" = "0" ] || [ -z "$EXIT_CODE" ]; then
    STATUS="PASS"
  else
    STATUS="FAIL (exit: $EXIT_CODE)"
  fi

  echo "[$TIMESTAMP] $STATUS | $CMD" >> "$LOG_FILE"
fi

exit 0
