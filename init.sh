#!/usr/bin/env bash
# mentor-resources — repo-level verifier.
# 1) Smoke-test the pocket-mentor skill's init.sh against this repo.
# 2) Warn if the working tree has uncommitted changes.

set -euo pipefail

SKILL_INIT=".claude/skills/pocket-mentor/scripts/init.sh"

if [[ ! -x "$SKILL_INIT" ]]; then
  echo "ERROR: $SKILL_INIT not found or not executable" >&2
  exit 1
fi

echo "==> Smoke: running pocket-mentor init.sh against this repo"
# mentor-resources has no package.json (it is a skills repo, not a JS project),
# so the smoke test does NOT require ok=true. It only verifies that the script
# runs without crashing and emits well-formed JSON with the expected fields.
JSON="$(bash "$SKILL_INIT" --no-install 2>/dev/null)"

for field in '"checker": "init"' '"ok":' '"summary":' '"project":'; do
  if ! echo "$JSON" | grep -q "$field"; then
    echo "ERROR: smoke output missing expected field: $field" >&2
    echo "$JSON" >&2
    exit 1
  fi
done

summary="$(echo "$JSON" | grep -o '"summary": *"[^"]*"' | head -1 | sed 's/"summary": *"\(.*\)"/\1/')"
echo "    $summary"

echo "==> Working tree status"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "    WARN: uncommitted changes detected (commit before ending the session):"
  git status --short | sed 's/^/      /'
else
  echo "    clean"
fi

echo "==> init.sh complete"
