#!/usr/bin/env bash
# mentor-resources — repo-level verifier.
# 1) shellcheck all bash scripts in .claude/skills/
# 2) Smoke-test skill init.sh scripts against this repo.
# 3) Warn if the working tree has uncommitted changes.

set -euo pipefail

if ! command -v shellcheck >/dev/null 2>&1; then
  for candidate_dir in /opt/homebrew/bin /usr/local/bin "$HOME/.local/bin"; do
    if [[ -x "$candidate_dir/shellcheck" ]]; then
      PATH="$candidate_dir:$PATH"
      break
    fi
  done
fi

echo "==> shellcheck: all skill bash scripts"
while IFS= read -r script; do
  shellcheck "$script" || { echo "ERROR: shellcheck failed on $script" >&2; exit 1; }
done < <(find .claude/skills -name '*.sh' -type f | sort)
echo "    OK"

echo "==> Smoke: running skill init.sh scripts against this repo"
# mentor-resources has no package.json (it is a skills repo, not a JS project),
# so the smoke tests do NOT require ok=true. They only verify that each script
# runs without crashing and emits well-formed JSON with the expected fields.
for skill_init in \
  ".claude/skills/pocket-mentor/scripts/init.sh" \
  ".claude/skills/react-course-review/scripts/init.sh"
do
  if [[ ! -x "$skill_init" ]]; then
    echo "ERROR: $skill_init not found or not executable" >&2
    exit 1
  fi

  JSON="$(bash "$skill_init" --safe 2>/dev/null)"

  for field in '"checker":' '"ok":' '"summary":' '"project":'; do
    if ! echo "$JSON" | grep -q "$field"; then
      echo "ERROR: smoke output missing expected field: $field" >&2
      echo "$JSON" >&2
      exit 1
    fi
  done

  summary="$(echo "$JSON" | grep -o '"summary": *"[^"]*"' | head -1 | sed 's/"summary": *"\(.*\)"/\1/')"
  echo "    $skill_init: $summary"
done

echo "==> Working tree status"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "    WARN: uncommitted changes detected (commit before ending the session):"
  git status --short | sed 's/^/      /'
else
  echo "    clean"
fi

echo "==> init.sh complete"
