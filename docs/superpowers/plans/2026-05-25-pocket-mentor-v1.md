# pocket-mentor v1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade pocket-mentor from v0.9.7 to v1.0: severity system, Mode A finding formula, anti-repetition rule, self-check, stack detection, and two new gh CLI output modes (inline PR comments with suggestions + GitHub issues).

**Architecture:** All LLM behaviour lives in `SKILL.md` (prompt edits only — no bash changes for Tier 1). Two new bash scripts handle gh CLI posting. Data flow: LLM produces JSON draft → bash script reads it → GitHub API. Approval gate is mandatory: skill always asks mentor before posting.

**Tech Stack:** bash, `gh` CLI, `jq`, GitHub REST API (`POST /repos/{owner}/{repo}/pulls/{n}/reviews`, `POST /repos/{owner}/{repo}/issues`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `.claude/skills/pocket-mentor/SKILL.md` | Modify | Severity levels, Mode A formula, anti-repetition, self-check, stack detection, output modes, JSON output formats |
| `.claude/skills/pocket-mentor/scripts/post-pr-review.sh` | **Create** | Post line-specific inline PR comments from `inline-draft.json` via `gh api` |
| `.claude/skills/pocket-mentor/scripts/create-issues.sh` | **Create** | Create GitHub issues from `issues-draft.json` via `gh issue create` |
| `.claude/skills/pocket-mentor/README.md` | Modify | Document `--output` flag, `gh auth` requirement, v1.0 status |
| `feature_list.json` | Modify | Bump `current_version` v0.9.7 → v1.0 |

---

## Task 1: Severity levels + Mode A finding formula (SKILL.md)

**Files:**
- Modify: `.claude/skills/pocket-mentor/SKILL.md`

- [ ] **Step 1: Add severity definitions after the `## Role` section (after line 11)**

Insert the following block after the `## Role` section, before `## Language`:

```markdown
## Severity levels

Every finding is tagged with one of three levels:

- 🔴 **Critical** — must fix before the review passes. Affects correctness, security, or violates RS School process requirements.
- 🟡 **Recommendation** — should fix for better code quality. Not a blocker.
- 🔵 **Note** — worth knowing. Minor improvement or informational.

Use the lowest severity that is accurate. When in doubt, downgrade.
```

- [ ] **Step 2: Replace the Critical issues finding format in the Report format section**

Find the existing `### <Issue title>` block in the `## Report format` section (around line 275). Replace it with the Mode A format:

```markdown
### 🔴 <Issue title>

**File:** `src/components/Example.tsx:45`

**What:** <one sentence — what is wrong>
**Why bad:** <why this matters; cite a clean-code URL>
**How to fix:** <specific action>

**Current:**
```typescript
// code from project
```

**Fix:**
```typescript
// corrected code
```

> 📖 [Reference](https://github.com/HelgaZhizhka/mentor-resources/blob/master/clean-code/TypeScript.md)
```

- [ ] **Step 3: Update Recommendations format in Report format section**

Replace the existing `## Recommendations` list format with:

```markdown
## Recommendations

### 🟡 <Recommendation title>

**File:** `src/utils/helpers.ts:22` *(omit if not file-specific)*

**What:** <what could be better>
**Why:** <brief reason>
**How:** <how to improve>

> 📖 [Reference](…)
```

- [ ] **Step 4: Verify the edit looks correct**

Read lines 250–320 of `SKILL.md` and confirm both the Critical and Recommendations formats are updated. No old `**Problem:**` / `**Fix:**` pattern should remain in the Report format section.

- [ ] **Step 5: Commit**

```bash
cd /Users/mac/Projects/mentor-resources
git add .claude/skills/pocket-mentor/SKILL.md
git commit -m "feat(pocket-mentor): v1.0 — severity levels + Mode A finding formula"
```

---

## Task 2: Anti-repetition rule + self-check (SKILL.md)

**Files:**
- Modify: `.claude/skills/pocket-mentor/SKILL.md`

- [ ] **Step 1: Add anti-repetition rule after `## Strict rules` section**

Find the `## Strict rules` section. After the `**DO:**` block, add:

```markdown
## Anti-repetition rule

If the same issue pattern appears in 3 or more places:
1. Write one full finding for the most egregious instance.
2. Append: `(N more occurrences: \`file:line\`, \`file:line\`, …)`
3. Do **not** write a separate finding per occurrence.

Example: `console.log` in 12 files → one Critical finding with `(11 more occurrences: src/api.ts:5, src/utils.ts:8, …)` — not 12 separate findings.
```

- [ ] **Step 2: Add self-check section immediately after the anti-repetition rule**

```markdown
## Self-check (run before writing any output)

Before writing the report or any JSON draft, verify each item:

- [ ] No finding duplicates what ESLint already caught (if `ready_to_review: true`)
- [ ] Every Critical finding cites a specific `file:line`
- [ ] No Fix snippet introduces a violation flagged elsewhere in this report
- [ ] Anti-repetition applied: no pattern written as separate findings more than twice
- [ ] Every finding uses Mode A format: What / Why bad / How to fix / Reference
- [ ] Severity is correctly assigned (Critical = RS School blocker, Recommendation = quality, Note = info)
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/pocket-mentor/SKILL.md
git commit -m "feat(pocket-mentor): v1.0 — anti-repetition rule + pre-output self-check"
```

---

## Task 3: Stack detection — step 1b (SKILL.md)

**Files:**
- Modify: `.claude/skills/pocket-mentor/SKILL.md`

- [ ] **Step 1: Add step 1b after the Bootstrap section (after `### 1. Bootstrap (init.sh)`)**

Insert between step 1 (Bootstrap) and step 2 (Focused checkers):

```markdown
### 1b. Detect stack

Read `has_package_json` and the dependency map from the init.sh JSON. Apply this decision tree top-to-bottom and stop at the first match:

| Condition | Detected stack | References to load |
|---|---|---|
| `has_package_json: false` | HTML / CSS | `HTML.md`, `CSS.md` |
| `has_package_json: true`, `@angular/core` in deps | Angular | **Stop — show banner** |
| `has_package_json: true`, `react` + `typescript` in deps | React + TS | `React.md`, `TypeScript.md`, Fundamentals Part1–6 |
| `has_package_json: true`, `typescript` in deps or devDeps | TypeScript | `TypeScript.md`, Fundamentals Part1–6 |
| `has_package_json: true`, no TypeScript | Vanilla JS | Fundamentals Part1–6 |

**Angular detected** — write to the conversation and stop:

> ⚠️ **Angular project detected.** Angular projects are not supported in this version of pocket-mentor. Review this project manually.

Do not run steps 2–4.

**In step 3 (LLM analysis):** load **only** the reference files for the detected stack from `./references/clean-code/`. Do not load all references.
```

- [ ] **Step 2: Update step 3 (LLM analysis) — replace the references line**

Find in step 3: `4. Relevant files in \`./references/clean-code/\` for areas with findings (only those needed for explanation)`

Replace with:

```
4. The reference files selected in step 1b for the detected stack (already narrowed — do not load all references)
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/pocket-mentor/SKILL.md
git commit -m "feat(pocket-mentor): v1.0 — stack detection (HTML/JS/TS/React; Angular guard)"
```

---

## Task 4: Output modes + approval gate + JSON formats (SKILL.md)

**Files:**
- Modify: `.claude/skills/pocket-mentor/SKILL.md`

- [ ] **Step 1: Add output mode parsing to the Inputs section**

At the end of the `## Inputs` section (after the `--context` block), add:

```markdown
### Output mode

Parse `--output <mode>` from the invocation message. Accepted values:

| Flag | Behaviour |
|---|---|
| *(absent)* or `--output local` | Write `CODE_REVIEW_REPORT.md` (default, current behaviour) |
| `--output inline` | Write `inline-draft.json`, show approval gate, then run `post-pr-review.sh` |
| `--output issues` | Write `issues-draft.json`, show approval gate, then run `create-issues.sh` |
| `--output inline,issues` | Write both JSON files, show combined approval gate, run both scripts |

**Approval gate** (mandatory for `inline` and `issues`):

After writing the draft file(s), display a readable summary of the findings to the mentor. Then call `AskUserQuestion` with exactly these two options:

1. **Post now** — run the `gh` script(s)
2. **Cancel** — stop without posting

Never run `post-pr-review.sh` or `create-issues.sh` without explicit written confirmation. Auto-posting is forbidden.

**gh auth check** (before approval gate): run `bash -c "gh auth status"`. If it fails, stop and tell the mentor: `gh is not authenticated — run: gh auth login`
```

- [ ] **Step 2: Add inline-draft.json format spec as a new section after `## Execution sequence`**

Add before `## What ESLint already covers`:

```markdown
## Output JSON formats (inline and issues modes)

### inline-draft.json

Written to `$PROJECT_DIR/inline-draft.json`. Structure:

```json
{
  "comments": [
    {
      "path": "src/api.ts",
      "line": 12,
      "body": "🔴 **Critical**: Implicit `any` at fetch boundary.\n\n**What:** `response.json()` is typed as `any`.\n**Why bad:** Propagates `any` through the call chain, defeating strict mode.\n**How to fix:** Add an explicit return type.\n\n```suggestion\nconst data: UserResponse = await response.json() as UserResponse;\n```\n\n📖 [TypeScript.md](https://github.com/HelgaZhizhka/mentor-resources/blob/master/clean-code/TypeScript.md)"
    }
  ],
  "general_body": "prose summary for findings without a specific line (architectural issues). Empty string if none."
}
```

Rules:
- `path`: relative path from repo root (e.g. `src/components/Button.tsx`)
- `line`: integer line number in the file
- Include a `suggestion` block in `body` only for simple single-line fixes (rename, add type annotation, remove `console.log`). For architectural changes: prose only, no suggestion.
- Findings without a specific line → include in `general_body`, not in `comments`.

### issues-draft.json

Written to `$PROJECT_DIR/issues-draft.json`. Structure:

```json
{
  "issues": [
    {
      "title": "🔴 Implicit any at fetch boundary (src/api.ts:12)",
      "body": "**File:** `src/api.ts:12`\n\n**What:** `response.json()` is typed as `any`.\n\n**Why bad:** Propagates `any` through the call chain.\n\n**How to fix:** Add explicit return type annotation.\n\n**Reference:** [TypeScript.md](https://github.com/HelgaZhizhka/mentor-resources/blob/master/clean-code/TypeScript.md)"
    }
  ]
}
```

Rules:
- Create one issue per 🔴 **Critical** finding only. Do not create issues for Recommendations or Notes.
- Title format: `🔴 <short description> (<file:line>)`
- Body uses the same Mode A structure as inline comment body.
```

- [ ] **Step 3: Add step 4b to the execution sequence for inline/issues posting**

After the existing `### 4. Write CODE_REVIEW_REPORT.md` section, add:

```markdown
### 4b. Post to GitHub (inline and issues modes only)

Skip this step if `--output local` (the default).

**inline mode:**
1. Write `$PROJECT_DIR/inline-draft.json` (format above).
2. Display a preview of all comments to the mentor.
3. Show approval gate (AskUserQuestion).
4. On confirmation: `bash $SKILL_DIR/scripts/post-pr-review.sh --draft "$PROJECT_DIR/inline-draft.json" --project-dir "$PROJECT_DIR"`

**issues mode:**
1. Write `$PROJECT_DIR/issues-draft.json` (format above).
2. Display the list of issue titles to the mentor.
3. Show approval gate (AskUserQuestion).
4. On confirmation: `bash $SKILL_DIR/scripts/create-issues.sh --draft "$PROJECT_DIR/issues-draft.json" --project-dir "$PROJECT_DIR"`

**inline,issues mode:** produce both JSON files, show one combined approval gate, then run both scripts in sequence.
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/pocket-mentor/SKILL.md
git commit -m "feat(pocket-mentor): v1.0 — output modes (inline/issues), approval gate, JSON formats"
```

---

## Task 5: Create post-pr-review.sh

**Files:**
- Create: `.claude/skills/pocket-mentor/scripts/post-pr-review.sh`

- [ ] **Step 1: Create the script**

```bash
cat > /Users/mac/Projects/mentor-resources/.claude/skills/pocket-mentor/scripts/post-pr-review.sh << 'SCRIPT'
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
SCRIPT
chmod +x .claude/skills/pocket-mentor/scripts/post-pr-review.sh
```

- [ ] **Step 2: Run shellcheck**

```bash
shellcheck .claude/skills/pocket-mentor/scripts/post-pr-review.sh
```

Expected: no warnings or errors. If shellcheck reports issues, fix them before proceeding.

- [ ] **Step 3: Verify help flag works**

```bash
bash .claude/skills/pocket-mentor/scripts/post-pr-review.sh --help
```

Expected output:
```
Usage: ./post-pr-review.sh --draft <path> [--pr <number>] [--project-dir <path>]
```

- [ ] **Step 4: Verify error on missing draft**

```bash
bash .claude/skills/pocket-mentor/scripts/post-pr-review.sh --draft /nonexistent/file.json 2>&1 | grep "ERROR"
```

Expected: `ERROR: draft file not found: /nonexistent/file.json`

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/pocket-mentor/scripts/post-pr-review.sh
git commit -m "feat(pocket-mentor): v1.0 — add post-pr-review.sh (line-specific inline comments via gh api)"
```

---

## Task 6: Create create-issues.sh

**Files:**
- Create: `.claude/skills/pocket-mentor/scripts/create-issues.sh`

- [ ] **Step 1: Create the script**

```bash
cat > /Users/mac/Projects/mentor-resources/.claude/skills/pocket-mentor/scripts/create-issues.sh << 'SCRIPT'
#!/usr/bin/env bash
# Create GitHub issues from issues-draft.json via gh issue create.
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

# 4. Count issues
COUNT=$(jq '.issues | length' "$DRAFT_PATH")
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
SCRIPT
chmod +x .claude/skills/pocket-mentor/scripts/create-issues.sh
```

- [ ] **Step 2: Run shellcheck**

```bash
shellcheck .claude/skills/pocket-mentor/scripts/create-issues.sh
```

Expected: no warnings or errors.

- [ ] **Step 3: Verify help flag and error on missing draft**

```bash
bash .claude/skills/pocket-mentor/scripts/create-issues.sh --help
bash .claude/skills/pocket-mentor/scripts/create-issues.sh --draft /no/file.json 2>&1 | grep "ERROR"
```

Expected:
```
Usage: ./create-issues.sh --draft <path> [--project-dir <path>]
ERROR: draft file not found: /no/file.json
```

- [ ] **Step 4: Verify empty issues list exits cleanly**

```bash
echo '{"issues":[]}' > /tmp/empty-issues.json
bash .claude/skills/pocket-mentor/scripts/create-issues.sh --draft /tmp/empty-issues.json
rm /tmp/empty-issues.json
```

Expected: `No issues to create.` with exit 0.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/pocket-mentor/scripts/create-issues.sh
git commit -m "feat(pocket-mentor): v1.0 — add create-issues.sh (gh issue create per Critical finding)"
```

---

## Task 7: shellcheck all scripts + init.sh smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run shellcheck on all scripts**

```bash
cd /Users/mac/Projects/mentor-resources
find .claude/skills/pocket-mentor/scripts -name '*.sh' | sort | while read -r f; do
  echo "→ shellcheck $f"
  shellcheck "$f"
done
echo "✅ All scripts pass shellcheck"
```

Expected: no output after each `shellcheck` line (no warnings/errors).

- [ ] **Step 2: Run init.sh smoke test**

```bash
./init.sh
```

Expected: exit 0. The smoke test runs shellcheck on all scripts + runs pocket-mentor's `init.sh --no-install` against this repo and validates JSON output.

- [ ] **Step 3: Fix any shellcheck or smoke test failures before continuing**

If `init.sh` fails, read its stderr output and fix the reported issue. Do not proceed to Task 8 until `./init.sh` exits 0.

---

## Task 8: Update README + feature_list.json + version bump

**Files:**
- Modify: `.claude/skills/pocket-mentor/README.md`
- Modify: `feature_list.json`

- [ ] **Step 1: Update README.md — add --output usage examples**

Find the `## Use` section in README.md. After the existing usage examples, add:

```markdown
Post review as inline PR comments (requires open PR + `gh auth login`):

```
> /pocket-mentor --output inline
```

Create GitHub issues for Critical findings:

```
> /pocket-mentor --output issues
```

Both inline comments and issues:

```
> /pocket-mentor --output inline,issues
```
```

- [ ] **Step 2: Update README.md — add gh auth to prerequisites**

Add a new `## Prerequisites` section before `## Install`:

```markdown
## Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated
- [gh CLI](https://cli.github.com/) installed and authenticated (`gh auth login`) — required only for `--output inline` and `--output issues` modes
- [jq](https://jqlang.github.io/jq/) — required only for `--output inline` and `--output issues` modes (`brew install jq`)
```

- [ ] **Step 3: Update README.md — Status line**

Find: `v0.9.7 — colored stderr output…`

Replace with:

```markdown
v1.0 — severity system (🔴/🟡/🔵), Mode A finding formula (What/Why bad/How to fix/Reference), anti-repetition rule, pre-output self-check, stack detection (HTML/CSS/JS/TS/React; Angular guard), inline PR comments with suggestions via `gh api`, GitHub issues mode via `gh issue create`.
```

- [ ] **Step 4: Update README.md — Version header**

Find: `Version: **v0.9.7**`  
Replace with: `Version: **v1.0**`

- [ ] **Step 5: Bump feature_list.json**

In `feature_list.json`, update the pocket-mentor entry:
- `"current_version": "v0.9.7"` → `"current_version": "v1.0"`
- `"status": "stable"` stays `"stable"`
- Update `"description"` to include new capabilities: add `inline PR comments, issues mode, stack detection, severity system` to the description sentence.

- [ ] **Step 6: Run ./init.sh one more time to confirm clean state**

```bash
./init.sh
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/pocket-mentor/README.md feature_list.json
git commit -m "chore(pocket-mentor): v1.0 — update README and feature_list.json"
```

---

## Task 9: Update progress.md + final commit

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Add session entry to progress.md**

Append to `progress.md`:

```markdown
## 2026-05-25 — pocket-mentor v1.0

**Done:**
- Tier 1 SKILL.md: severity system (🔴/🟡/🔵), Mode A formula, anti-repetition rule, self-check
- Stack detection: HTML/CSS / Vanilla JS / TS / React+TS; Angular guard
- Output modes: `--output inline` (line-specific PR comments + suggestions via gh api), `--output issues` (gh issue create per Critical)
- New scripts: `post-pr-review.sh`, `create-issues.sh` (both shellcheck-clean)
- Approval gate: mandatory, no auto-posting
- Version: v0.9.7 → v1.0

**Decisions:**
- React sub-rules (react-hooks.md, react-testing.md) deferred to v1.1
- Angular: unsupported guard with banner (no external skill reference)
- inline-draft.json + issues-draft.json as LLM→bash handoff format

**Next:**
- Smoke test on a real student repo (manual)
- Start student-reviewer GitHub Actions project (see plan: docs/superpowers/plans/2026-05-25-student-reviewer.md)

**Blockers:** none
```

- [ ] **Step 2: Final ./init.sh run**

```bash
./init.sh
```

Expected: exit 0.

- [ ] **Step 3: Final commit**

```bash
git add progress.md
git commit -m "chore(session): pocket-mentor v1.0 complete — progress.md updated"
```

---

## Smoke test (manual, after all tasks)

Run `/pocket-mentor` in a real student repo and verify:

1. 🔴/🟡/🔵 severity markers appear in the report
2. Each finding uses What/Why bad/How to fix/Reference structure
3. Same pattern is not listed more than twice separately (anti-repetition)
4. Self-check ran (no ESLint-duplicate findings if lint passed)
5. Stack was correctly detected (confirmed in report header)
6. `--output inline` shows approval gate before any `gh` command runs
7. `--output issues` shows approval gate before any `gh issue create` runs
