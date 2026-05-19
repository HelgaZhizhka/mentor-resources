#!/usr/bin/env bash
# Pocket Mentor — check-git-quality.sh
# Checks: branch name, forbidden tracked files, Conventional Commits format.
# Emits JSON. Non-interactive. Requires git.

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

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  cat <<EOF
{ "checker": "git-quality", "ok": true, "summary": "not a git repo; skipped", "findings": [], "stats": { "branch": "", "on_main": false, "forbidden_files": 0, "non_conventional": 0, "total_commits_checked": 0 } }
EOF
  exit 0
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

FORBIDDEN_COUNT=0
NON_CONV_COUNT=0

# --- branch ---
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" || BRANCH="(unknown)"
ON_MAIN=false
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  ON_MAIN=true
  printf '%s\t%s\t%s\t%s\n' ".git" "0" "branch: $BRANCH" "on-main-branch" >>"$TMP"
fi

# --- forbidden tracked files ---
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  printf '%s\t%s\t%s\t%s\n' "$path" "0" "tracked in git" "forbidden-file" >>"$TMP"
  FORBIDDEN_COUNT=$((FORBIDDEN_COUNT + 1))
done < <(git ls-files 2>/dev/null | grep -E \
  '(^|/)(node_modules|dist|build)/|(^|/)\.env(\.(local|development|production|test|dev|prod|staging))?$' \
  | head -20)

# --- conventional commits ---
# Commits on current branch not reachable from main/master (or last 20 if no base).
BASE_BRANCH=""
for b in main master origin/main origin/master; do
  if git rev-parse --verify "$b" >/dev/null 2>&1; then
    BASE_BRANCH="$b"
    break
  fi
done

CONV_PATTERN='^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\([^)]+\))?!?: .+'
TOTAL_COMMITS=0
if [[ -n "$BASE_BRANCH" && "$BASE_BRANCH" != "$BRANCH" ]]; then
  COMMIT_LIST="$(git log "${BASE_BRANCH}..HEAD" --format='%s' 2>/dev/null)"
else
  COMMIT_LIST="$(git log --format='%s' -20 2>/dev/null)"
fi

while IFS= read -r subject; do
  [[ -z "$subject" ]] && continue
  TOTAL_COMMITS=$((TOTAL_COMMITS + 1))
  if ! echo "$subject" | grep -qE "$CONV_PATTERN"; then
    subject_esc="$(printf '%s' "$subject" | sed 's/"/\\"/g')"
    printf '%s\t%s\t%s\t%s\n' ".git" "0" "$subject_esc" "non-conventional-commit" >>"$TMP"
    NON_CONV_COUNT=$((NON_CONV_COUNT + 1))
  fi
done <<EOF
$COMMIT_LIST
EOF


escape_json() { sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g'; }
BRANCH_ESC="$(printf '%s' "$BRANCH" | escape_json)"

{
  printf '{ "checker": "git-quality", "ok": true, "summary": "git-quality: branch=%s; forbidden=%d; bad_commits=%d", "findings": [' \
    "$BRANCH" "$FORBIDDEN_COUNT" "$NON_CONV_COUNT"
  first=true
  while IFS=$'\t' read -r f l e r; do
    e_esc="$(printf '%s' "$e" | escape_json)"
    f_esc="$(printf '%s' "$f" | escape_json)"
    $first || printf ','
    first=false
    printf '{"file":"%s","line":%s,"match":"%s","rule":"%s"}' "$f_esc" "$l" "$e_esc" "$r"
  done <"$TMP"
  printf '], "stats": { "branch": "%s", "on_main": %s, "forbidden_files": %d, "non_conventional": %d, "total_commits_checked": %d } }\n' \
    "$BRANCH_ESC" "$ON_MAIN" "$FORBIDDEN_COUNT" "$NON_CONV_COUNT" "$TOTAL_COMMITS"
}
