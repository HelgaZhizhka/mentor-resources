#!/usr/bin/env bash
# Post inline PR review comments from inline-draft.json via GitHub API.
# Usage: post-pr-review.sh --draft <path> [--pr <number>] [--project-dir <path>]
# Requires: gh (authenticated), jq

set -euo pipefail

DRAFT_PATH=""
PR_NUMBER=""
PROJECT_DIR="$PWD"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft)       DRAFT_PATH="$2";       shift 2 ;;
    --pr)          PR_NUMBER="$2";        shift 2 ;;
    --project-dir) PROJECT_DIR="$2";      shift 2 ;;
    -h|--help)
      echo "Usage: $0 --draft <path> [--pr <number>] [--project-dir <path>]"
      exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

# Default draft path
if [[ -z "$DRAFT_PATH" ]]; then
  DRAFT_PATH="$PROJECT_DIR/inline-draft.json"
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

# 3. Verify draft file exists and is valid JSON
if [[ ! -f "$DRAFT_PATH" ]]; then
  echo "ERROR: draft file not found: $DRAFT_PATH" >&2
  exit 1
fi
if ! jq empty "$DRAFT_PATH" 2>/dev/null; then
  echo "ERROR: draft file is not valid JSON: $DRAFT_PATH" >&2
  exit 1
fi

# 4. Auto-detect PR number from current branch if not supplied
if [[ -z "$PR_NUMBER" ]]; then
  BRANCH=$(cd "$PROJECT_DIR" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ -z "$BRANCH" || "$BRANCH" == "HEAD" ]]; then
    echo "ERROR: cannot determine current branch. Pass --pr <number> explicitly." >&2
    exit 1
  fi
  PR_NUMBER=$(cd "$PROJECT_DIR" && gh pr list --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
  if [[ -z "$PR_NUMBER" || "$PR_NUMBER" == "null" ]]; then
    echo "ERROR: no open PR found for branch '$BRANCH'. Pass --pr <number> explicitly." >&2
    exit 1
  fi
fi

# 5. Get repo owner/name
REPO=$(cd "$PROJECT_DIR" && gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || echo "")
if [[ -z "$REPO" ]]; then
  echo "ERROR: cannot determine repository name. Run from inside a GitHub repository." >&2
  exit 1
fi

# 6. Build GitHub API payload
# Inline comments (line-specific)
COMMENTS=$(jq '[.comments[] | select(.line != null) | {path: .path, line: .line, side: "RIGHT", body: .body}]' "$DRAFT_PATH")
# General body (architectural findings without a specific line)
GENERAL_BODY=$(jq -r '.general_body // ""' "$DRAFT_PATH")

PAYLOAD=$(jq -n \
  --arg body "$GENERAL_BODY" \
  --argjson comments "$COMMENTS" \
  '{body: $body, event: "COMMENT", comments: $comments}')

# 7. Post the review
echo "Posting review to PR #${PR_NUMBER} in ${REPO}..."
RESPONSE=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}/reviews" \
  --method POST \
  --input - <<< "$PAYLOAD")

REVIEW_ID=$(echo "$RESPONSE" | jq -r '.id // "unknown"')
echo "✅ Review posted (id: ${REVIEW_ID}) to PR #${PR_NUMBER} — https://github.com/${REPO}/pull/${PR_NUMBER}"
