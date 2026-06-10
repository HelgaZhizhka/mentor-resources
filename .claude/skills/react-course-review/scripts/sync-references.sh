#!/usr/bin/env bash
# Sync clean-code/* from the mentor-resources repo into the react-course-review bundle.
# Run from the mentor-resources repo root (or pass --repo-root <path>).

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
DST="$REPO_ROOT/.claude/skills/react-course-review/references/clean-code"

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: source not found: $SRC" >&2
  exit 1
fi

rm -rf "$DST"
mkdir -p "$DST"
cp "$SRC"/*.md "$DST/"

count=$(find "$DST" -maxdepth 1 -name '*.md' -type f | wc -l | tr -d ' ')
echo "Synced $count files: $SRC -> $DST"
