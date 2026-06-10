#!/usr/bin/env bash
# React Course Review — check-commented-code.sh
# Flags blocks of commented-out code (3+ consecutive // lines with code-like content)
# in src/. Natural-language comments are ignored.
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
{ "checker": "commented-code", "ok": true, "summary": "no src/ directory; skipped", "findings": [], "stats": { "blocks": 0, "lines": 0 } }
EOF
  exit 0
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

BLOCK_COUNT=0
LINE_COUNT=0

# Use awk to find runs of 3+ consecutive code-comment lines.
# A "code comment" line matches: optional whitespace, //, then content with code punctuation.
while IFS= read -r result; do
  [[ -z "$result" ]] && continue
  file="${result%%:*}"
  rest="${result#*:}"
  lineno="${rest%%:*}"
  excerpt="${rest#*:}"
  printf '%s\t%s\t%s\t%s\n' "$file" "$lineno" "$excerpt" "commented-code" >>"$TMP"
  BLOCK_COUNT=$((BLOCK_COUNT + 1))
done < <(
  find src/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" 2>/dev/null | sort | while read -r srcfile; do
    awk -v f="$srcfile" '
    function is_code_comment(line,    s) {
      if (line !~ /^[[:space:]]*\/\//) return 0
      s = line
      gsub(/^[[:space:]]*\/\/[[:space:]]*/, "", s)
      return (s ~ /[;{}=()\[\]]/ || s ~ /^(import|export|const|let|var|function|class|return|if|for|while) /)
    }
    {
      if (is_code_comment($0)) {
        if (run_start == 0) run_start = NR
        run_lines[NR] = $0
        run_end = NR
      } else {
        if (run_end - run_start >= 2) {
          # 3+ consecutive code-comment lines; emit first line of block
          excerpt = run_lines[run_start]
          gsub(/"/, "\\\"", excerpt)
          print f ":" run_start ":" excerpt
        }
        run_start = 0; run_end = 0
        delete run_lines
      }
    }
    END {
      if (run_end - run_start >= 2) {
        excerpt = run_lines[run_start]
        gsub(/"/, "\\\"", excerpt)
        print f ":" run_start ":" excerpt
      }
    }
    ' "$srcfile"
  done
)

while IFS=$'\t' read -r _ _ _ _; do
  LINE_COUNT=$((LINE_COUNT + 1))
done <"$TMP"
LINE_COUNT="$BLOCK_COUNT"

escape_json() { sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g'; }

{
  printf '{ "checker": "commented-code", "ok": true, "summary": "commented-code: blocks=%d", "findings": [' "$BLOCK_COUNT"
  first=true
  while IFS=$'\t' read -r f l e r; do
    e_esc="$(printf '%s' "$e" | escape_json)"
    f_esc="$(printf '%s' "$f" | escape_json)"
    $first || printf ','
    first=false
    printf '{"file":"%s","line":%s,"match":"%s","rule":"%s"}' "$f_esc" "$l" "$e_esc" "$r"
  done <"$TMP"
  printf '], "stats": { "blocks": %d } }\n' "$BLOCK_COUNT"
}
