# Pocket Mentor v0.9 — Skill Build (Thu 2026-05-21 Demo)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build minimum 7 artifacts (§7 of `docs/pocket-mentor/sharpened-proposition-2026-05-18.md`) so that mentor can install Pocket Mentor as a Claude Code skill, run `/pocket-mentor review` inside a cloned student repo, and receive `CODE_REVIEW_REPORT.md`.

**Architecture:** Self-contained skill bundle at `.claude/skills/pocket-mentor/` consisting of: (a) `SKILL.md` — English prompt adapted from `templates/agents/reviewer.md`, with PR-requirements + commit-conventions + manual-reminders inlined per §3.8 of proposition; (b) `references/clean-code/` — frozen copy of curriculum; (c) `scripts/init.sh` + `scripts/checkers/*.sh` — focused bash mechanics emitting JSON. Skill composes review layers via prompt instruction (no runtime YAML, no engine code).

**Tech Stack:** Bash 3.2+ (macOS default), Claude Code skill format (YAML frontmatter + markdown body), JSON output via plain `printf` / `jq`-free heredocs. Verification via `shellcheck`.

**Source-of-truth materials retained (do NOT delete in this plan):**
- `templates/agents/reviewer.md` — adapted into SKILL.md (English, skill-format)
- `templates/scripts/auto-check.sh` — informs init.sh; deprecated when migration complete (separate cleanup, not in this plan)
- `templates/checklists/checklist.md` — content inlined into SKILL.md §3.8 sections; deprecated separately
- `clean-code/*` — canonical, copied to bundle

**Non-goals for this plan (per §7 "Откладываем"):**
- 3 remaining checkers (`commented-code`, `todo`, `git-quality`)
- Deletion of `packages/engine/`, `templates/agents/reviewer.md`, `templates/scripts/auto-check.sh`
- Rewrite of `SPEC.md` / `CONTEXT.md`
- AST checkers, GH draft delivery, L2/L4 mechanics

**Per user's global CLAUDE.md:** no unit tests. Verification = shellcheck + manual smoke runs documented inline. Each script committed separately.

---

## File Structure

Created in this plan:

```
.claude/skills/pocket-mentor/
├── SKILL.md                              # Task 1
├── README.md                             # Task 6 (install instructions)
├── references/
│   └── clean-code/                       # Task 2 (copied from mentor-resources/clean-code/)
│       ├── TypeScript.md
│       ├── HTML.md
│       ├── CSS.md
│       ├── React.md
│       ├── UI-UX.md
│       ├── Clean-Code-Fundamental-Part1.md … Part6.md
│       └── index.md
└── scripts/
    ├── init.sh                           # Task 3
    ├── sync-references.sh                # Task 2 (sync helper, lives at scripts/ root)
    └── checkers/
        ├── check-ts-usage.sh             # Task 4
        └── check-no-console.sh           # Task 5

docs/pocket-mentor/
└── smoke-run-2026-05-21.md               # Task 7 (smoke result writeup)
```

JSON contract between scripts and SKILL.md (used by Tasks 3, 4, 5):

```json
{
  "checker": "<id>",
  "ok": true|false,
  "summary": "<one-line human-readable>",
  "findings": [
    { "file": "src/foo.ts", "line": 12, "match": "<excerpt>", "rule": "<rule-id>" }
  ],
  "stats": { "<counter-name>": <int>, ... }
}
```

All scripts write JSON to stdout. Diagnostic logging goes to stderr. Exit code 0 on success (including "checker ran cleanly even if it found violations"), non-zero only on infrastructure failure (missing deps, no `src/`, etc.).

---

## Task 1: SKILL.md

**Files:**
- Create: `.claude/skills/pocket-mentor/SKILL.md`
- Reference: `templates/agents/reviewer.md` (RU source, adapt to English)
- Reference: `templates/checklists/checklist.md` (inline §3.8 sections)
- Reference: `docs/pocket-mentor/sharpened-proposition-2026-05-18.md` §3.6, §3.8, §3.9

- [ ] **Step 1.1: Create the file with the exact frontmatter and section skeleton**

Write `.claude/skills/pocket-mentor/SKILL.md` with this exact structure (no placeholders — fill in every section in subsequent steps):

```markdown
---
name: pocket-mentor
description: Review a cloned student repository against RS School clean-code standards. Run inside the student repo via /pocket-mentor review [--context <path-to-md>]. Produces CODE_REVIEW_REPORT.md combining bash-mech findings (lint/build/TS/console/git) with LLM analysis grounded in references/clean-code/*. Use when the user wants a structured RS-School-style code review of a student project, or invokes /pocket-mentor.
---

# Pocket Mentor

## Role

You are an experienced RS School mentor. Your job is to produce a structured code review of a student's project — accurate, kind, instructive.

## Language

Respond in the language the mentor communicates in with you in this session. The mentor's first message determines the report language. Bash output and check-rule names stay in English; commentary and recommendations follow the session language.

## Inputs

Two channels:

1. **The student repository** — current working directory (`$PROJECT_DIR = pwd`). The mentor cloned it before invoking you.
2. **Optional task context** — `--context <path-to-md>` flag passed by the mentor. A markdown file describing the specific assignment, its acceptance criteria, scoring rubric, deadlines, or any task-specific instructions. **If provided, treat it as authoritative over generic rules below.**

## Execution sequence

Run these steps in order. Do not skip.

### 1. Bootstrap (init.sh)

Run `bash $SKILL_DIR/scripts/init.sh` (where `$SKILL_DIR` is this skill's bundle root). The script:
- detects `$PROJECT_DIR` (current pwd)
- installs dependencies if missing (use `--no-install` to skip in batch contexts)
- runs `lint` + `build` scripts from `package.json`
- emits a single JSON object to stdout summarising config, lint, build outcomes

Parse the JSON. Treat lint/build failures as **priority-1 findings** in the report.

### 2. Focused checkers (scripts/checkers/*.sh)

Run each available checker:
- `bash $SKILL_DIR/scripts/checkers/check-ts-usage.sh` — `any`, `as Type`, `!` non-null assertions, parameter/return typing
- `bash $SKILL_DIR/scripts/checkers/check-no-console.sh` — `console.log` in `src/`

Each emits a JSON object (see contract below). Aggregate findings; deduplicate against lint output from step 1.

### 3. LLM analysis

Read in this order:
1. `--context <path>` markdown (if provided) — task-specific rubric/checklist
2. Aggregated JSON from steps 1–2
3. The student's source code (focus: `src/`, configs, `README.md`, the most recent commit's diff)
4. Relevant files in `./references/clean-code/` for areas with findings (only those needed for explanation)

Then perform the analysis described in **Review rules** below.

### 4. Write CODE_REVIEW_REPORT.md

Write the report to `$PROJECT_DIR/CODE_REVIEW_REPORT.md` (override with `--output-path`). Follow the **Report format** at the end of this document.

## What ESLint already covers (DO NOT duplicate)

If ESLint is configured and step-1 lint output is clean, the following are already verified. Do not re-flag them as findings:

- Naming (camelCase, PascalCase, boolean prefixes `is/has/should`)
- Single-letter identifiers (`id-length`)
- Function size (max 30 lines, max 3 params)
- Nesting depth (max 3 levels)
- Magic numbers
- `any` type
- Unused variables
- `console.log`
- Import order

If ESLint is **not configured** or step-1 lint failed — flag this as the first finding.

## Review rules (what LLM checks beyond ESLint)

### Naming meaning

Does the name reflect intent? `data` → `users`, `temp` → `cachedResult`. Functions are verbs (`process` → `calculateTotal`). No misinformation (`userList` should be a list, not an object).

### Architecture and responsibility

- Single Responsibility: does the class/function do one thing?
- Separation: logic separate from UI? API separate from components?
- YAGNI: any abstractions added "for the future" with no current consumer?
- Duplicated logic across files?

### Comments and documentation

- Commented-out code present?
- Comments explain "why", not "what"?
- TODO/FIXME current and tracked?

### Asynchrony

- `useEffect` cleanup: `AbortController` for fetch?
- Parallel requests via `Promise.all` where applicable?
- Race conditions on rapid input/toggle?

### Performance

- Event delegation instead of N handlers?
- Debounce/throttle on `input`, `scroll`, `resize`?

### TypeScript (when project is TS)

- Type guards (`typeof`, `instanceof`, predicate functions) instead of `as` assertions?
- Generics where applicable?
- `readonly` for immutable data?
- Interfaces/types for non-trivial structures?
- Implicit `any` at external boundaries (`fetch`, `localStorage.getItem`, `JSON.parse`, form values, query params)?

### HTML / CSS

- Semantic tags (`header`, `main`, `nav`, `article`, `section`)?
- `alt` on images (meaningful, not "image")?
- BEM or consistent class naming?
- No inline JS-driven styles except for genuinely dynamic values?
- CSS nesting depth ≤2?

## PR requirements (process — AI flags, mentor verifies)

The mentor reviews these manually. Surface them in the report's **Manual checks** section verbatim — do NOT attempt to evaluate them yourself unless `check-git-quality.sh` produced relevant findings.

- PR from branch `task-name` into `main`, **not** merged
- PR title is clear and informative
- PR description contains: task link, screenshot, deploy URL, dates (done / deadline), student self-check
- No extraneous files in git (`node_modules`, `.env`, `dist`) — partially checked by `check-git-quality.sh` when available

## Commit conventions (knowledge for explaining findings)

Conventional Commits — https://www.conventionalcommits.org/

- Lowercase types: `init`, `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- Imperative mood, present tense: "add feature" — not "added feature"
- One logical change per commit (no monolithic commits)

`check-git-quality.sh` (when present) flags non-conformance. If absent, do not score commits in the report — mention conventions only when responding to a question or when commits are visibly broken.

## Reference materials

When findings need deeper explanation, cite **canonical GitHub URLs** in the report (mentor may forward them to the student):

- General practices: https://github.com/HelgaZhizhka/mentor-resources/blob/master/clean-code/Clean-Code-Fundamental-Part1.md
- Refactoring & code organisation: …Part2.md
- Working with data: …Part3.md
- Performance: …Part4.md
- SOLID: …Part5.md
- Additional practices: …Part6.md
- TypeScript: https://github.com/HelgaZhizhka/mentor-resources/blob/master/clean-code/TypeScript.md
- HTML: https://github.com/HelgaZhizhka/mentor-resources/blob/master/clean-code/HTML.md
- CSS: https://github.com/HelgaZhizhka/mentor-resources/blob/master/clean-code/CSS.md
- UI/UX: https://github.com/HelgaZhizhka/mentor-resources/blob/master/clean-code/UI-UX.md

For your own context (when grounding analysis), read the local files: `./references/clean-code/TypeScript.md` etc.

## Strict rules

**DO NOT:**
- Invent code that isn't in the project
- Check TypeScript when the project is not TypeScript
- Duplicate ESLint findings when lint passed
- Speculate about logic beyond what the code shows

**DO:**
- Cite `file:line` for every finding
- Show "before → after" snippets
- Order findings: critical first, then improvements

## Report format

Output structure (translate section headers into the session language; keep code block syntax labels in English):

\`\`\`markdown
# CODE REVIEW: <project name>

## Stack
- TypeScript: yes/no
- Bundler: <detected>
- ESLint: configured / not configured (link to issues if any)
- Build: passes / fails (paste 5–10 lines of error if fails)

## Strengths
1. …
2. …

## Critical issues

### <Issue title>

**File:** `src/components/Example.tsx:45`

**Current code:**
\`\`\`typescript
// code from project
\`\`\`

**Problem:** <why this is wrong, ground in clean-code/* with a URL citation>

**Fix:**
\`\`\`typescript
// corrected
\`\`\`

## Recommendations
1. <less critical>

## Summary
<one-paragraph wrap-up>

---

## Manual checks (mentor reminder)

The agent did NOT evaluate these — review them yourself:

**Pull Request:**
- [ ] Branch `task-name` → `main`, not merged
- [ ] Title clear and informative
- [ ] Description: task link, screenshot, deploy URL, dates, student self-check
- [ ] No extraneous files (node_modules, .env, dist)

**Functional:**
- [ ] App runs without console errors
- [ ] Main features work as specified
- [ ] Matches mockup (if provided)
- [ ] Responsive (if required)
- [ ] Interactive elements visually highlighted
- [ ] No overlapping elements
- [ ] Hover/active feedback
\`\`\`

## Optional task checklist

If `--context` is provided and the markdown contains a scored checklist (categories with points), use it. Add a **Score** section to the report:

\`\`\`markdown
## Score (per task checklist)
- <Category 1>: XX / YY pts
- <Category 2>: XX / YY pts
- Penalties: -XX
- **Total: XXX / ZZZ**
\`\`\`

Task-checklist criteria override generic rules above when they conflict.
```

- [ ] **Step 1.2: Verify markdown lints cleanly**

Run from repo root:

```bash
test -f .claude/skills/pocket-mentor/SKILL.md && echo "exists" && wc -l .claude/skills/pocket-mentor/SKILL.md
```

Expected: file exists, ~180–220 lines.

- [ ] **Step 1.3: Commit**

```bash
git add .claude/skills/pocket-mentor/SKILL.md
git commit -m "feat(pocket-mentor): add SKILL.md (v0.9 demo build, artefact 1/7)"
```

---

## Task 2: References bundle + sync script

**Files:**
- Create: `.claude/skills/pocket-mentor/scripts/sync-references.sh`
- Create: `.claude/skills/pocket-mentor/references/clean-code/*.md` (copied via the script)

- [ ] **Step 2.1: Write the sync script**

Create `.claude/skills/pocket-mentor/scripts/sync-references.sh`:

```bash
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
DST="$REPO_ROOT/.claude/skills/pocket-mentor/references/clean-code"

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: source not found: $SRC" >&2
  exit 1
fi

rm -rf "$DST"
mkdir -p "$DST"
cp "$SRC"/*.md "$DST/"

echo "Synced $(ls "$DST" | wc -l | tr -d ' ') files: $SRC → $DST"
```

- [ ] **Step 2.2: Make executable, shellcheck, run**

```bash
chmod +x .claude/skills/pocket-mentor/scripts/sync-references.sh
shellcheck .claude/skills/pocket-mentor/scripts/sync-references.sh
bash .claude/skills/pocket-mentor/scripts/sync-references.sh
```

Expected output:
- shellcheck: no warnings
- script: `Synced 12 files: …/clean-code → …/references/clean-code`

If shellcheck is not installed, install via `brew install shellcheck` first.

- [ ] **Step 2.3: Verify references exist**

```bash
ls .claude/skills/pocket-mentor/references/clean-code/
```

Expected: `CSS.md Check-List.md Clean-Code-Fundamental-Part1.md … Part6.md HTML.md React.md TypeScript.md UI-UX.md index.md` (12 files).

- [ ] **Step 2.4: Commit**

```bash
git add .claude/skills/pocket-mentor/scripts/sync-references.sh .claude/skills/pocket-mentor/references/
git commit -m "feat(pocket-mentor): bundle clean-code references + sync script (artefact 2/7)"
```

---

## Task 3: init.sh

**Files:**
- Create: `.claude/skills/pocket-mentor/scripts/init.sh`
- Reference: `templates/scripts/auto-check.sh` (informs structure; do not duplicate interactive prompts)

- [ ] **Step 3.1: Write the script**

Create `.claude/skills/pocket-mentor/scripts/init.sh`:

```bash
#!/usr/bin/env bash
# Pocket Mentor — init.sh
# Bootstrap: detect $PROJECT_DIR, check deps, run lint+build, emit JSON to stdout.
# Non-interactive. All diagnostic output to stderr.

set -uo pipefail

PROJECT_DIR=""
INSTALL_MODE="auto"  # auto | yes | no

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    --yes)         INSTALL_MODE="yes"; shift ;;
    --no-install)  INSTALL_MODE="no"; shift ;;
    -h|--help)
      cat >&2 <<EOF
Usage: $0 [--project-dir <path>] [--yes | --no-install]
Emits a single JSON object describing config / lint / build outcomes.
EOF
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -z "$PROJECT_DIR" ]] && PROJECT_DIR="$(pwd)"

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "ERROR: not a directory: $PROJECT_DIR" >&2
  exit 1
fi

cd "$PROJECT_DIR"

log() { echo "[init] $*" >&2; }

# --- detect package manager ---
PM="npm"
if [[ -f "pnpm-lock.yaml" ]]; then PM="pnpm"
elif [[ -f "yarn.lock" ]];   then PM="yarn"
elif [[ -f "package-lock.json" ]]; then PM="npm"
fi

HAS_PACKAGE_JSON=false
HAS_SRC=false
[[ -f "package.json" ]] && HAS_PACKAGE_JSON=true
[[ -d "src" ]] && HAS_SRC=true

PROJECT_NAME=""
if $HAS_PACKAGE_JSON; then
  PROJECT_NAME="$(grep '"name"' package.json | head -1 | sed 's/.*"name": *"\([^"]*\)".*/\1/' | tr -d ',')"
fi
[[ -z "$PROJECT_NAME" ]] && PROJECT_NAME="$(basename "$PROJECT_DIR")"

# --- detect TS config ---
HAS_TSCONFIG=false
TS_STRICT=false
TS_NO_IMPLICIT_ANY=false
if [[ -f "tsconfig.json" ]]; then
  HAS_TSCONFIG=true
  grep -q '"strict"[[:space:]]*:[[:space:]]*true' tsconfig.json && TS_STRICT=true
  grep -q '"noImplicitAny"[[:space:]]*:[[:space:]]*true' tsconfig.json && TS_NO_IMPLICIT_ANY=true
fi

# --- detect ESLint ---
HAS_ESLINT=false
for f in eslint.config.js eslint.config.mjs eslint.config.cjs .eslintrc .eslintrc.js .eslintrc.json .eslintrc.cjs .eslintrc.yml; do
  if [[ -f "$f" ]]; then HAS_ESLINT=true; break; fi
done

# --- install deps if needed ---
DEPS_INSTALLED=true
if $HAS_PACKAGE_JSON && [[ ! -d "node_modules" ]]; then
  case "$INSTALL_MODE" in
    no)
      log "node_modules missing, --no-install set; skipping install"
      DEPS_INSTALLED=false
      ;;
    yes|auto)
      log "installing deps via $PM…"
      if $PM install >/tmp/pocket-mentor-install.log 2>&1; then
        log "deps installed"
      else
        log "deps install FAILED (see /tmp/pocket-mentor-install.log)"
        DEPS_INSTALLED=false
      fi
      ;;
  esac
fi

# --- lint ---
LINT_RAN=false
LINT_OK=false
LINT_TAIL=""
if $HAS_PACKAGE_JSON && $DEPS_INSTALLED && grep -q '"lint"' package.json; then
  LINT_RAN=true
  if $PM run lint >/tmp/pocket-mentor-lint.log 2>&1; then
    LINT_OK=true
  else
    LINT_TAIL="$(tail -40 /tmp/pocket-mentor-lint.log | sed 's/"/\\"/g; s/\\/\\\\/g' | awk 'BEGIN{ORS="\\n"} {print}')"
  fi
fi

# --- build ---
BUILD_RAN=false
BUILD_OK=false
BUILD_TAIL=""
if $HAS_PACKAGE_JSON && $DEPS_INSTALLED && grep -q '"build"' package.json; then
  BUILD_RAN=true
  if $PM run build >/tmp/pocket-mentor-build.log 2>&1; then
    BUILD_OK=true
  else
    BUILD_TAIL="$(tail -40 /tmp/pocket-mentor-build.log | sed 's/"/\\"/g; s/\\/\\\\/g' | awk 'BEGIN{ORS="\\n"} {print}')"
  fi
fi

# --- emit JSON ---
cat <<EOF
{
  "checker": "init",
  "ok": true,
  "summary": "init: pm=$PM lint=$($LINT_OK && echo pass || $LINT_RAN && echo fail || echo skip) build=$($BUILD_OK && echo pass || $BUILD_RAN && echo fail || echo skip)",
  "project": {
    "name": "$PROJECT_NAME",
    "dir": "$PROJECT_DIR",
    "package_manager": "$PM",
    "has_package_json": $HAS_PACKAGE_JSON,
    "has_src": $HAS_SRC,
    "has_tsconfig": $HAS_TSCONFIG,
    "ts_strict": $TS_STRICT,
    "ts_no_implicit_any": $TS_NO_IMPLICIT_ANY,
    "has_eslint_config": $HAS_ESLINT,
    "deps_installed": $DEPS_INSTALLED
  },
  "lint": { "ran": $LINT_RAN, "ok": $LINT_OK, "tail": "$LINT_TAIL" },
  "build": { "ran": $BUILD_RAN, "ok": $BUILD_OK, "tail": "$BUILD_TAIL" }
}
EOF
```

- [ ] **Step 3.2: Make executable, shellcheck**

```bash
chmod +x .claude/skills/pocket-mentor/scripts/init.sh
shellcheck .claude/skills/pocket-mentor/scripts/init.sh
```

Expected: no warnings. If shellcheck flags style-only issues (e.g. SC2155), assess; fix or `# shellcheck disable=` inline with justification.

- [ ] **Step 3.3: Smoke run against current repo**

```bash
bash .claude/skills/pocket-mentor/scripts/init.sh --no-install 2>/tmp/init-stderr.log | tee /tmp/init-out.json
echo "--- stderr ---"
cat /tmp/init-stderr.log
echo "--- jq validate ---"
python3 -c "import json,sys; json.load(open('/tmp/init-out.json'))" && echo "JSON valid"
```

Expected:
- stdout is a single JSON object
- JSON validates
- `project.name` matches `mentor-resources`
- `lint.ran` / `build.ran` reflect what's in `package.json`

- [ ] **Step 3.4: Commit**

```bash
git add .claude/skills/pocket-mentor/scripts/init.sh
git commit -m "feat(pocket-mentor): add init.sh bootstrap script (artefact 3/7)"
```

---

## Task 4: check-ts-usage.sh

**Files:**
- Create: `.claude/skills/pocket-mentor/scripts/checkers/check-ts-usage.sh`

- [ ] **Step 4.1: Write the script**

Create `.claude/skills/pocket-mentor/scripts/checkers/check-ts-usage.sh`:

```bash
#!/usr/bin/env bash
# Pocket Mentor — check-ts-usage.sh
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

# Aggregate findings into a temp file; format JSON at end.
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# --- explicit `any` (word boundary, exclude comment-only matches with simple // filter) ---
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

# --- `as Type` assertions (capitalised type, not `as const` / `as any` / `as unknown`) ---
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

# --- non-null assertion `!` (heuristic: identifier or `)` followed by `!.` or `!;` or `!,` or `! ` end) ---
BANG_COUNT=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  rest="${line#*:}"
  lineno="${rest%%:*}"
  excerpt="${rest#*:}"
  printf '%s\t%s\t%s\t%s\n' "$file" "$lineno" "$excerpt" "ts-non-null" >>"$TMP"
  BANG_COUNT=$((BANG_COUNT + 1))
done < <(grep -rnE '[A-Za-z_$0-9\)\]]\!(\.|\[|\(|,|;|[[:space:]]|$)' src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
            | grep -vE '!==|!=' \
            | grep -v '^[^:]*:[0-9]*:[[:space:]]*//')

TOTAL=$((ANY_COUNT + AS_COUNT + BANG_COUNT))
OK="true"

# --- emit JSON ---
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
```

- [ ] **Step 4.2: Make executable, shellcheck**

```bash
chmod +x .claude/skills/pocket-mentor/scripts/checkers/check-ts-usage.sh
shellcheck .claude/skills/pocket-mentor/scripts/checkers/check-ts-usage.sh
```

Expected: no warnings (or only justified inline-disabled ones).

- [ ] **Step 4.3: Smoke run against a known TS project**

Set up a tiny fixture in `/tmp/ts-fixture/src/`:

```bash
mkdir -p /tmp/ts-fixture/src
cat >/tmp/ts-fixture/src/sample.ts <<'EOF'
const data: any = fetchSomething();
const u = raw as User;
console.log(user!.name);
const ok = a !== b;
EOF

bash .claude/skills/pocket-mentor/scripts/checkers/check-ts-usage.sh --project-dir /tmp/ts-fixture | tee /tmp/ts-out.json
python3 -c "import json; d=json.load(open('/tmp/ts-out.json')); assert d['stats']['any']>=1 and d['stats']['as_assertion']>=1 and d['stats']['non_null']>=1, d; print('OK', d['stats'])"
rm -rf /tmp/ts-fixture
```

Expected: `OK {'any': 1, 'as_assertion': 1, 'non_null': 1, 'total': 3}` (counts may vary slightly; all three rules must fire ≥1 each).

- [ ] **Step 4.4: Commit**

```bash
git add .claude/skills/pocket-mentor/scripts/checkers/check-ts-usage.sh
git commit -m "feat(pocket-mentor): add check-ts-usage.sh (artefact 4/7)"
```

---

## Task 5: check-no-console.sh

**Files:**
- Create: `.claude/skills/pocket-mentor/scripts/checkers/check-no-console.sh`

- [ ] **Step 5.1: Write the script**

Create `.claude/skills/pocket-mentor/scripts/checkers/check-no-console.sh`:

```bash
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
```

- [ ] **Step 5.2: Make executable, shellcheck**

```bash
chmod +x .claude/skills/pocket-mentor/scripts/checkers/check-no-console.sh
shellcheck .claude/skills/pocket-mentor/scripts/checkers/check-no-console.sh
```

Expected: no warnings.

- [ ] **Step 5.3: Smoke run on fixture**

```bash
mkdir -p /tmp/console-fixture/src
cat >/tmp/console-fixture/src/sample.ts <<'EOF'
console.log("debug");
console.debug("verbose");
console.error("ok to keep");
console.warn("also ok");
// console.log("commented; should not fire");
EOF

bash .claude/skills/pocket-mentor/scripts/checkers/check-no-console.sh --project-dir /tmp/console-fixture | tee /tmp/console-out.json
python3 -c "import json; d=json.load(open('/tmp/console-out.json')); assert d['stats']['log']==1 and d['stats']['debug']==1, d; print('OK', d['stats'])"
rm -rf /tmp/console-fixture
```

Expected: `OK {'log': 1, 'debug': 1, 'total': 2}`.

- [ ] **Step 5.4: Commit**

```bash
git add .claude/skills/pocket-mentor/scripts/checkers/check-no-console.sh
git commit -m "feat(pocket-mentor): add check-no-console.sh (artefact 5/7)"
```

---

## Task 6: README with install instructions

**Files:**
- Create: `.claude/skills/pocket-mentor/README.md`

The exact Claude Code-native install mechanism is the open question flagged in §4 of the proposition ("Distribution mechanism … точная команда определяется при build-е Tue/Wed"). For demo readiness we document **both** the cleanest available CC-native path and a one-line manual fallback. We will tighten this in a follow-up commit once we confirm the CC API surface during demo prep.

- [ ] **Step 6.1: Confirm the Claude Code skill-install surface available right now**

Run from anywhere:

```bash
claude --help 2>&1 | grep -iE 'skill|plugin' || true
ls ~/.claude/skills 2>&1
```

Note the output. If `claude` exposes a `plugin install` / `skill create` style subcommand, document that as the primary path. If not, the primary path becomes "clone repo, copy bundle" (fallback below) and we file a backlog item to revisit when CC ships a skill-distribution command.

Capture decision (one line) in the bottom "Decisions" block of `docs/pocket-mentor/sharpened-proposition-2026-05-18.md` if not already there. If the doc shouldn't be edited, drop it into `progress.md` instead.

- [ ] **Step 6.2: Write the README**

Create `.claude/skills/pocket-mentor/README.md`:

```markdown
# Pocket Mentor — Claude Code skill

Structured RS School-style code review of a cloned student repository.

## Install

### Option A — Claude Code native (preferred when available)

> **Confirm at install time:** the exact subcommand depends on the Claude Code build (`/plugin install`, `claude skill add`, marketplace install). Run `claude --help` and look for skill/plugin install. If unsure, use Option B.

```bash
# Example shape — replace with the verified subcommand once confirmed:
# claude skill add HelgaZhizhka/mentor-resources/.claude/skills/pocket-mentor
```

### Option B — manual copy (always works)

```bash
git clone https://github.com/HelgaZhizhka/mentor-resources.git /tmp/mentor-resources
mkdir -p ~/.claude/skills
cp -R /tmp/mentor-resources/.claude/skills/pocket-mentor ~/.claude/skills/
```

Verify:

```bash
ls ~/.claude/skills/pocket-mentor/SKILL.md && echo "installed"
```

## Use

```bash
git clone <student-pr-repo>
cd <student-repo>
claude
```

Inside the Claude Code session:

```
> /pocket-mentor review
```

or with a task-specific rubric:

```
> /pocket-mentor review --context ./task-readme.md
```

The skill will:
1. Run `init.sh` (lint + build + config detection)
2. Run focused checkers (`check-ts-usage`, `check-no-console`)
3. Read `references/clean-code/*` for grounding
4. Write `./CODE_REVIEW_REPORT.md`

You then edit the report and decide what to forward to the student.

## Bundle contents

```
SKILL.md                              # prompt + inline PR / commit / manual-check rules
references/clean-code/                # frozen curriculum
scripts/init.sh                       # bootstrap
scripts/checkers/*.sh                 # focused mechanics
scripts/sync-references.sh            # dev helper: re-sync from mentor-resources/clean-code
```

## Updating

When `mentor-resources/clean-code/*` changes, re-run `scripts/sync-references.sh` from the repo root, then re-publish the skill bundle.

## Status

v0.9 — demo build. Three additional checkers (`commented-code`, `todo`, `git-quality`), GitHub draft delivery, and AST-level rules are deferred.
```

- [ ] **Step 6.3: Verify**

```bash
test -f .claude/skills/pocket-mentor/README.md && wc -l .claude/skills/pocket-mentor/README.md
```

Expected: file exists, ~60 lines.

- [ ] **Step 6.4: Commit**

```bash
git add .claude/skills/pocket-mentor/README.md
git commit -m "docs(pocket-mentor): add skill README with install instructions (artefact 6/7)"
```

---

## Task 7: Smoke run on a historical PR

**Files:**
- Create: `docs/pocket-mentor/smoke-run-2026-05-21.md`

- [ ] **Step 7.1: Pick a historical PR / repo**

Identify one historical student PR you'd review the old way. Criteria:
- TypeScript project (so `check-ts-usage.sh` fires)
- Has `lint` + `build` scripts in `package.json`
- Public or locally accessible

Note its URL or local path in the writeup created in Step 7.4.

- [ ] **Step 7.2: Install the skill locally**

Use Option B from Task 6 README (or Option A if confirmed in Step 6.1):

```bash
mkdir -p ~/.claude/skills
rm -rf ~/.claude/skills/pocket-mentor
cp -R .claude/skills/pocket-mentor ~/.claude/skills/
ls ~/.claude/skills/pocket-mentor/SKILL.md
```

- [ ] **Step 7.3: Clone the chosen student repo, run review**

```bash
mkdir -p /tmp/pocket-mentor-smoke
cd /tmp/pocket-mentor-smoke
git clone <student-repo-url> student
cd student
# Drop a fresh Claude Code session here:
claude
```

In the Claude Code session: `/pocket-mentor review` (or pass `--context <path>` if you have a task md for that assignment).

Watch for:
1. The skill activates (you see "Using pocket-mentor skill" or equivalent)
2. `init.sh` runs end-to-end (no interactive prompts)
3. `check-ts-usage.sh` and `check-no-console.sh` run, produce JSON
4. The agent reads `references/clean-code/*` for grounding
5. `CODE_REVIEW_REPORT.md` lands in `pwd` of the student repo

- [ ] **Step 7.4: Write the smoke-run writeup**

Create `docs/pocket-mentor/smoke-run-2026-05-21.md`:

```markdown
# Pocket Mentor v0.9 — Smoke run 2026-05-21

## Setup
- Student repo: <URL or local path>
- Task type: <e.g. Migration NewsAPI to TypeScript>
- Skill installed via: <Option A / Option B>
- Claude Code version: <output of `claude --version` if available>

## What ran
- [x] init.sh — package manager detected: <pnpm|yarn|npm>; lint: pass/fail; build: pass/fail
- [x] check-ts-usage.sh — any=N as=N non-null=N
- [x] check-no-console.sh — log=N debug=N
- [x] CODE_REVIEW_REPORT.md written to: <path>

## What worked
- <bullet>
- <bullet>

## What broke or felt off
- <bullet — specific, file:line if applicable>

## Findings deltas vs my manual review of the same PR
- Caught: <things skill found that I would have>
- Missed: <things I would have flagged that skill didn't>
- Noise: <false positives>

## Action items before demo (Thu)
- [ ] <fix or doc item>
```

Fill it in with what you actually observed.

- [ ] **Step 7.5: Commit**

```bash
git add docs/pocket-mentor/smoke-run-2026-05-21.md
git commit -m "docs(pocket-mentor): smoke-run writeup for v0.9 demo (artefact 7/7)"
```

---

## Wrap-up

- [ ] **Step W.1: Verify all 7 artefacts present**

```bash
ls .claude/skills/pocket-mentor/SKILL.md \
   .claude/skills/pocket-mentor/README.md \
   .claude/skills/pocket-mentor/scripts/init.sh \
   .claude/skills/pocket-mentor/scripts/sync-references.sh \
   .claude/skills/pocket-mentor/scripts/checkers/check-ts-usage.sh \
   .claude/skills/pocket-mentor/scripts/checkers/check-no-console.sh \
   docs/pocket-mentor/smoke-run-2026-05-21.md
ls .claude/skills/pocket-mentor/references/clean-code/ | wc -l
```

Expected: 7 files listed, 12 reference files counted.

- [ ] **Step W.2: Update progress.md**

Append a session-handoff block to `progress.md` summarising what landed (7 artefacts), what's still deferred (3 checkers, deletions, doc rewrites), and concrete next-session resume actions.

- [ ] **Step W.3: Final commit and push**

```bash
git add progress.md
git commit -m "chore(pocket-mentor): record v0.9 demo build session handoff"
git push origin feature/pocket-mentor-v0.9-redesign
```

Demo is ready when this branch contains the 7 artefacts and the smoke-run writeup notes a passing end-to-end run.
