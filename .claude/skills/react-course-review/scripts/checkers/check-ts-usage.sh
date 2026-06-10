#!/usr/bin/env bash
# React Course Review — check-ts-usage.sh
# Flags TS escape-hatches in src/: `any`, `as Type` assertions, `!` non-null assertions.
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
{ "checker": "ts-usage", "ok": true, "summary": "no src/ directory; skipped", "findings": [], "stats": { "any": 0, "as_assertion": 0, "non_null": 0 } }
EOF
  exit 0
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

ANY_COUNT=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  rest="${line#*:}"
  lineno="${rest%%:*}"
  excerpt="${rest#*:}"
  printf '%s\t%s\t%s\t%s\n' "$file" "$lineno" "$excerpt" "ts-any" >>"$TMP"
  ANY_COUNT=$((ANY_COUNT + 1))
done < <(grep -rnE ':[[:space:]]*any\b|<any>|\bas[[:space:]]+any\b' src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v '^[^:]*:[0-9]*:[[:space:]]*//')

AS_COUNT=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  rest="${line#*:}"
  lineno="${rest%%:*}"
  excerpt="${rest#*:}"
  printf '%s\t%s\t%s\t%s\n' "$file" "$lineno" "$excerpt" "ts-as-assertion" >>"$TMP"
  AS_COUNT=$((AS_COUNT + 1))
done < <(grep -rnE '\bas[[:space:]]+[A-Z][A-Za-z0-9_]*' src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
            | grep -vE '\bas[[:space:]]+(const|any|unknown|never)\b' \
            | grep -v '^[^:]*:[0-9]*:[[:space:]]*//')

BANG_COUNT=0
# shellcheck disable=SC2016  # $ inside the regex character class is literal, not shell expansion
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  rest="${line#*:}"
  lineno="${rest%%:*}"
  excerpt="${rest#*:}"
  printf '%s\t%s\t%s\t%s\n' "$file" "$lineno" "$excerpt" "ts-non-null" >>"$TMP"
  BANG_COUNT=$((BANG_COUNT + 1))
done < <(grep -rnE '[]A-Za-z_$0-9)]!(\.|\[|\(|,|;|[[:space:]]|$)' src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
            | grep -vE '!==|!=' \
            | grep -v '^[^:]*:[0-9]*:[[:space:]]*//')

TOTAL=$((ANY_COUNT + AS_COUNT + BANG_COUNT))
OK="true"

escape_json() { sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g'; }

{
  printf '{ "checker": "ts-usage", "ok": %s, "summary": "ts-usage: any=%d as=%d non-null=%d", "findings": [' "$OK" "$ANY_COUNT" "$AS_COUNT" "$BANG_COUNT"
  first=true
  while IFS=$'\t' read -r f l e r; do
    e_esc="$(printf '%s' "$e" | escape_json)"
    f_esc="$(printf '%s' "$f" | escape_json)"
    $first || printf ','
    first=false
    printf '{"file":"%s","line":%s,"match":"%s","rule":"%s"}' "$f_esc" "$l" "$e_esc" "$r"
  done <"$TMP"
  printf '], "stats": { "any": %d, "as_assertion": %d, "non_null": %d, "total": %d } }\n' \
    "$ANY_COUNT" "$AS_COUNT" "$BANG_COUNT" "$TOTAL"
}
