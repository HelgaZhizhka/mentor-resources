#!/usr/bin/env bash
# React Course Review — create GitHub issues from issues-draft.json via gh issue create.
# Usage: create-issues.sh --draft <path> [--project-dir <path>]
# Requires: gh (authenticated), jq

set -euo pipefail

DRAFT_PATH=""
PROJECT_DIR="$PWD"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft)       DRAFT_PATH="$2";  shift 2 ;;
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 --draft <path> [--project-dir <path>]"
      exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

# Default draft path
if [[ -z "$DRAFT_PATH" ]]; then
  DRAFT_PATH="$PROJECT_DIR/issues-draft.json"
fi

# 1. Verify gh auth
if ! gh auth status &>/dev/null; then
  echo "ERROR: gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

# 2. Verify jq is available
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not installed. Install via: brew install jq" >&2
  exit 1
fi

# 3. Verify draft file
if [[ ! -f "$DRAFT_PATH" ]]; then
  echo "ERROR: draft file not found: $DRAFT_PATH" >&2
  exit 1
fi
if ! jq empty "$DRAFT_PATH" 2>/dev/null; then
  echo "ERROR: draft file is not valid JSON: $DRAFT_PATH" >&2
  exit 1
fi
if ! jq -e '(.issues | type == "array") and all(.issues[]?; (.title | type == "string") and (.title | length > 0) and (.title | length < 200) and (.body | type == "string") and (.body | length > 0) and (.body | length < 60000))' "$DRAFT_PATH" >/dev/null; then
  echo "ERROR: draft file does not match expected issues schema" >&2
  exit 1
fi

# 4. Count issues
COUNT=$(jq '.issues | length' "$DRAFT_PATH")
if [[ "$COUNT" -gt 50 ]]; then
  echo "ERROR: refusing to create ${COUNT} issues (max 50)" >&2
  exit 1
fi
if [[ "$COUNT" -eq 0 ]]; then
  echo "No issues to create."
  exit 0
fi

echo "Creating ${COUNT} issue(s) in $(cd "$PROJECT_DIR" && gh repo view --json nameWithOwner --jq '.nameWithOwner')..."

# 5. Create each issue
CREATED=0
for i in $(seq 0 $((COUNT - 1))); do
  TITLE=$(jq -r ".issues[$i].title" "$DRAFT_PATH")
  BODY=$(jq -r ".issues[$i].body" "$DRAFT_PATH")
  URL=$(cd "$PROJECT_DIR" && gh issue create --title "$TITLE" --body "$BODY")
  echo "✅ Created: $URL"
  CREATED=$((CREATED + 1))
done

echo "Done. Created ${CREATED}/${COUNT} issue(s)."
