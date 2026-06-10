#!/usr/bin/env bash
# Sync clean-code/* from the mentor-resources repo into the skill bundle.
# Run from the mentor-resources repo root (or pass --repo-root <path>).
# Idempotent: deletes the destination and re-copies on every run.

set -euo pipefail

REPO_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root) REPO_ROOT="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--repo-root <path-to-mentor-resources>]"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$REPO_ROOT" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
fi

SRC="$REPO_ROOT/clean-code"

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: source not found: $SRC" >&2
  exit 1
fi

# Target 1: pocket-mentor skill bundle
DST1="$REPO_ROOT/.claude/skills/pocket-mentor/references/clean-code"
rm -rf "$DST1"
mkdir -p "$DST1"
cp "$SRC"/*.md "$DST1/"
count1=$(find "$DST1" -maxdepth 1 -name '*.md' -type f | wc -l | tr -d ' ')
echo "Synced $count1 files: $SRC → $DST1"

# Target 2: student-reviewer action bundle
DST2="$REPO_ROOT/.github/actions/student-reviewer/references/clean-code"
if [[ -d "$REPO_ROOT/.github/actions/student-reviewer" ]]; then
  rm -rf "$DST2"
  mkdir -p "$DST2"
  cp "$SRC"/*.md "$DST2/"
  count2=$(find "$DST2" -maxdepth 1 -name '*.md' -type f | wc -l | tr -d ' ')
  echo "Synced $count2 files: $SRC → $DST2"
else
  echo "Skipped student-reviewer target (directory not yet created)"
fi

# Target 3: react-course-review skill bundle
DST3="$REPO_ROOT/.claude/skills/react-course-review/references/clean-code"
if [[ -d "$REPO_ROOT/.claude/skills/react-course-review" ]]; then
  rm -rf "$DST3"
  mkdir -p "$DST3"
  cp "$SRC"/*.md "$DST3/"
  count3=$(find "$DST3" -maxdepth 1 -name '*.md' -type f | wc -l | tr -d ' ')
  echo "Synced $count3 files: $SRC → $DST3"
else
  echo "Skipped react-course-review target (directory not yet created)"
fi
