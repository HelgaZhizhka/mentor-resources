#!/usr/bin/env bash
# Pocket Mentor — check-no-console.sh
# Flags console.log / console.debug in src/. console.error / console.warn are allowed.
# Emits JSON. Non-interactive.

set -uo pipefail

PROJECT_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 [--project-dir <path>]" >&2; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -z "$PROJECT_DIR" ]] && PROJECT_DIR="$(pwd)"
cd "$PROJECT_DIR" || { echo "ERROR: cannot cd $PROJECT_DIR" >&2; exit 1; }

if [[ ! -d "src" ]]; then
  cat <<EOF
{ "checker": "no-console", "ok": true, "summary": "no src/ directory; skipped", "findings": [], "stats": { "log": 0, "debug": 0 } }
EOF
  exit 0
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

LOG_COUNT=0
DEBUG_COUNT=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  rest="${line#*:}"
  lineno="${rest%%:*}"
  excerpt="${rest#*:}"
  rule="console-log"
  if echo "$excerpt" | grep -qE 'console\.debug'; then
    rule="console-debug"
    DEBUG_COUNT=$((DEBUG_COUNT + 1))
  else
    LOG_COUNT=$((LOG_COUNT + 1))
  fi
  printf '%s\t%s\t%s\t%s\n' "$file" "$lineno" "$excerpt" "$rule" >>"$TMP"
done < <(grep -rnE 'console\.(log|debug)\b' src/ \
            --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
            2>/dev/null \
            | grep -v '^[^:]*:[0-9]*:[[:space:]]*//')

TOTAL=$((LOG_COUNT + DEBUG_COUNT))

escape_json() { sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g'; }

{
  printf '{ "checker": "no-console", "ok": true, "summary": "no-console: log=%d debug=%d", "findings": [' "$LOG_COUNT" "$DEBUG_COUNT"
  first=true
  while IFS=$'\t' read -r f l e r; do
    e_esc="$(printf '%s' "$e" | escape_json)"
    f_esc="$(printf '%s' "$f" | escape_json)"
    $first || printf ','
    first=false
    printf '{"file":"%s","line":%s,"match":"%s","rule":"%s"}' "$f_esc" "$l" "$e_esc" "$r"
  done <"$TMP"
  printf '], "stats": { "log": %d, "debug": %d, "total": %d } }\n' "$LOG_COUNT" "$DEBUG_COUNT" "$TOTAL"
}
