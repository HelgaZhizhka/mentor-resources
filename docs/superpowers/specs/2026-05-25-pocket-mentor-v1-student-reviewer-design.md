# Design: pocket-mentor v1.0 + student-reviewer

**Date:** 2026-05-25  
**Status:** Approved  
**Strategy:** B+ — two independent products, sequential

---

## 1. Strategy Overview

Two separate products, built one after the other:

```
Now (2 weeks)                  Later (~5 weeks)
─────────────────────          ──────────────────────────────
pocket-mentor v1.0             student-reviewer
Claude Code skill              GitHub Actions + AI API
/pocket-mentor                 PR opened → auto-review
SKILL.md + gh CLI              new codebase
mentor-facing                  student-facing
```

**Shared:** `clean-code/` reference base — single source of truth, same rules for both.  
**Different:** runtime, trigger, output, infrastructure, voice.

---

## 2. pocket-mentor v1.0 (mentor-facing)

### 2.1 Tier 1 — SKILL.md changes

Four changes to `SKILL.md`, no bash changes:

| # | Change | Result |
|---|---|---|
| 1 | 3-level severity + emoji | 🔴 Critical / 🟡 Recommendation / 🔵 Note |
| 2 | Mode A formula for every finding | **What:** … **Why bad:** … **How to fix:** … **Link:** … |
| 3 | Anti-repetition rule | one pattern = one full finding + `(N more: file:line, file:line)` |
| 4 | Self-check before output | agent runs checklist on its own draft before writing report |

### 2.2 Stack Detection

Detected from `package.json` (via init.sh JSON). References loaded per stack:

| Project type | Detected by | References loaded |
|---|---|---|
| HTML/CSS | no `package.json` | `HTML.md` + `CSS.md` |
| Vanilla JS | `package.json`, no `typescript` | `Clean-Code-Fundamentals` (Part 1–6) |
| TypeScript | `typescript` in deps | `TypeScript.md` + Fundamentals |
| React + TS | `react` + `typescript` | `React.md` + `TypeScript.md` + Fundamentals |
| Angular | `@angular/core` | ⚠️ banner: "Angular projects are not supported in this version" → stop |

React sub-rules (`react-hooks.md`, `react-testing.md`, `react-patterns.md`) deferred to v1.1.

### 2.3 Output Modes

Three modes selected via flag:

```bash
/pocket-mentor                          # local (default, current behaviour)
/pocket-mentor --output inline          # inline PR comments
/pocket-mentor --output issues          # GitHub issues per Critical finding
/pocket-mentor --output inline,issues   # both
```

**Approval gate** — mandatory for `inline` and `issues` modes:  
Skill shows draft in terminal → mentor confirms → bash script executes.  
Auto-posting is forbidden.

**Requirement:** `gh auth login` must be active. If not — error with setup instructions.

### 2.4 Inline PR Comments (line-specific)

```
bash checkers → findings with file:line
                      ↓
              post-pr-review.sh
              gh api /repos/{owner}/{repo}/pulls/{PR}/reviews
              body: [{path, line, body}]
```

- Findings with specific line → inline comment on that line
- LLM findings without specific line (architectural) → general PR review comment
- One `gh api` call for the entire review (not N separate requests)

**Suggestions** — included when fix is simple (rename, add type, remove console.log):

````
🔴 **Critical**: `data` doesn't reflect intent.

**Why bad:** reader can't understand what's inside without context.

```suggestion
const users = await fetchUsers();
```
````

Suggestions only on lines present in the PR diff.  
Architectural fixes (multi-file) → prose explanation only, no suggestion block.

### 2.5 New bash scripts

```
scripts/
  post-pr-review.sh     # posts line-specific inline comments via gh api
  create-issues.sh      # gh issue create per Critical finding
```

### 2.6 Versioning

`v0.9.7 → v1.0`

Files changed: `SKILL.md`, `README.md`, `feature_list.json`,  
`scripts/post-pr-review.sh` (new), `scripts/create-issues.sh` (new).

---

## 3. student-reviewer (GitHub Actions)

### 3.1 Location

In `mentor-resources` repo:

```
mentor-resources/
├── .github/
│   └── actions/
│       └── student-reviewer/
│           ├── action.yml          # action entry point
│           ├── review.mjs          # Node.js — AI call + comment posting
│           ├── package.json        # openai SDK
│           └── references/
│               └── clean-code/     # synced from clean-code/ root
└── templates/
    └── workflows/
        └── student-review.yml      # student copies this to their repo
```

### 3.2 How student connects

1. Copy `templates/workflows/student-review.yml` to their `.github/workflows/`
2. Open a PR → action runs automatically
3. Get inline comments directly in the PR

No account setup, no API key required for default mode.

### 3.3 Action flow

```
PR opened / synchronized
        ↓
checkout PR code
        ↓
detect stack (HTML/CSS → JS → TS → React; Angular → silent skip)
        ↓
load relevant clean-code references
        ↓
call AI (GitHub Models default / custom key override)
        ↓
post line-specific comments + suggestions via GitHub API
```

### 3.4 AI Provider

Uses `openai` npm SDK (GitHub Models is OpenAI-API-compatible):

```js
// Default — GitHub Models (zero friction, no setup)
baseURL: 'https://models.inference.ai.azure.com'
apiKey:  process.env.GITHUB_TOKEN   // auto-available in every Action

// Override — student brings their own key
baseURL: process.env.AI_BASE_URL    // any OpenAI-compatible provider
apiKey:  process.env.AI_API_KEY
model:   process.env.AI_MODEL
```

If override env vars are set → use them. Otherwise → fallback to GitHub Models.  
Supports any OpenAI-compatible endpoint: Anthropic, Gemini, Ollama, Azure, etc.

### 3.5 Clean-code references

`sync-references.sh` extended with second target:

```bash
# existing
rsync clean-code/ .claude/skills/pocket-mentor/references/clean-code/

# added
rsync clean-code/ .github/actions/student-reviewer/references/clean-code/
```

`review.mjs` reads files locally and injects into system prompt by stack — same logic as v1.0.

### 3.6 Differences from pocket-mentor v1.0

| | pocket-mentor v1.0 | student-reviewer |
|---|---|---|
| Trigger | mentor manually | automatic on PR |
| Approval gate | yes | no |
| Output | inline / issues / local | inline only |
| Voice | technical, neutral | educational, explains "why" |
| Suggestions | yes | yes |
| Angular | warning banner + stop | silent skip |
| AI provider | Claude (mentor has key) | GitHub Models default |

### 3.7 Voice difference

Same rules, different framing:

| Dimension | pocket-mentor | student-reviewer |
|---|---|---|
| Tone | peer review | teaching moment |
| Explanations | concise (mentor knows why) | expanded "why this matters" |
| Severity label | 🔴 Critical | 🔴 Fix before merge |
| Encouragement | none | 🟢 What's working section |

---

## 4. Shared infrastructure

### 4.1 clean-code/ — single source of truth

```
clean-code/               ← edit here only
    HTML.md
    CSS.md
    TypeScript.md
    React.md
    Clean-Code-Fundamental-Part1.md … Part6.md
    index.md
```

`sync-references.sh` propagates changes to both consumers.  
Never edit reference copies directly.

### 4.2 Future: React sub-rules (v1.1)

```
clean-code/
    react-hooks.md       # useState, useEffect, deps array
    react-testing.md     # RTL, what to test
    react-patterns.md    # composition, lifting state, memo
```

Not in scope for v1.0.

---

## 5. Timeline

| Phase | Scope | Estimate |
|---|---|---|
| v1.0 | SKILL.md Tier 1 + stack detection + gh CLI scripts | 2 weeks |
| student-reviewer | GitHub Actions + review.mjs + provider abstraction | 5 weeks |
| v1.1 | React sub-rules, student-reviewer improvements | TBD |
