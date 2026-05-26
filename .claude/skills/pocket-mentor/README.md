# Pocket Mentor — Claude Code skill

Structured RS School-style code review of a cloned student repository.

Version: **v1.0.2**

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated
- [gh CLI](https://cli.github.com/) installed and authenticated (`gh auth login`) — required only for `--output inline` and `--output issues` modes
- [jq](https://jqlang.github.io/jq/) — required only for `--output inline` and `--output issues` modes (`brew install jq`)

## Install

### Option 0 — `npx skills add` (recommended for mentors)

One command, no repo clone, no manual file handling. The [`vercel-labs/skills`](https://github.com/vercel-labs/skills) CLI downloads only the skill bundle (~80 KB) and places it in `~/.claude/skills/pocket-mentor/`.

```bash
npx skills@latest add HelgaZhizhka/mentor-resources -g -a claude-code --skill pocket-mentor
```

- `-g` — install globally to `~/.claude/skills/` (drop the flag to install into the current project's `.claude/skills/` instead).
- `-a claude-code` — install only the Claude Code variant (skip Cursor, Gemini CLI, OpenCode, etc.).
- `--skill pocket-mentor` — install only this skill from the repo (rather than every `SKILL.md` it finds).

Update later with `npx skills update pocket-mentor`. Remove with `npx skills remove pocket-mentor`.

See [ADR-0003](https://github.com/HelgaZhizhka/mentor-resources/blob/master/docs/adr/0003-skills-sh-for-skill-publish.md) for the reasoning behind this choice.

### Option A — manual symlink (for skill development)

Use this if you intend to edit the skill yourself — changes in the repo propagate to Claude Code instantly, no `npx skills update` round-trip required.

```bash
git clone https://github.com/HelgaZhizhka/mentor-resources.git ~/Projects/mentor-resources
mkdir -p ~/.claude/skills
ln -s ~/Projects/mentor-resources/.claude/skills/pocket-mentor ~/.claude/skills/pocket-mentor
```

### Verify

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
> /pocket-mentor
```

With a task-specific rubric (local markdown):

```
> /pocket-mentor --context ./task-readme.md
```

With a task-specific rubric (GitHub URL — the skill uses `gh api` under the hood):

```
> /pocket-mentor --context https://github.com/rolling-scopes-school/tasks/blob/master/stage2/tasks/fun-chat/README.md
```

Optional: override the output path (default is `./CODE_REVIEW_REPORT.md` in the project root):

```
> /pocket-mentor --context ./task.md --output-path ./reviews/student-X.md
```

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

## What the skill does

1. **Bootstrap (`scripts/init.sh`)** — detects `package.json` (including in subdirectories), package manager, TypeScript config, ESLint config, README presence; installs dependencies if missing; runs `lint` + `build` scripts. Emits a single JSON object summarising everything.
2. **Focused checkers (`scripts/checkers/*.sh`)** — four bash checkers, each emitting a JSON contract:
   - `check-ts-usage.sh` — `any`, `as Type` assertions, `!` non-null
   - `check-no-console.sh` — `console.log` / `console.debug` in `src/`
   - `check-git-quality.sh` — branch on `main`, forbidden tracked files (`node_modules`, `.env`, `dist`), non-Conventional-Commits subjects
   - `check-commented-code.sh` — blocks of ≥3 consecutive commented-out code lines
3. **LLM analysis** — Claude reads the student's source, grounds findings in `references/clean-code/*`, and aggregates them with the bash-checker output.
4. **Report** — writes `CODE_REVIEW_REPORT.md` with sections: Stack, Strengths, Critical issues, Recommendations, Score (only with `--context`), Summary, Manual checks.

You then edit the report and decide what to forward to the student.

## Init.sh flags

`init.sh` accepts these flags (the skill normally invokes it without flags, but they are useful for manual runs):

- `--project-dir <path>` — explicit project directory (defaults to `$PWD`)
- `--yes` — install dependencies without prompting
- `--no-install` — skip dependency install even if `node_modules` is missing

## Failure modes

- **`--context` fetch fails** — the skill **must not** silently fall back to general knowledge (no `curl`, no `gh api` retry, no model swap). It calls `AskUserQuestion` and asks the mentor whether to provide a local copy, paste the content, or proceed without context. If the mentor chooses "no context", the Score section is omitted from the report.
- **Bootstrap fails** (no `package.json`, install fails) — `ready_to_review: false` in the JSON; the skill writes a minimal report explaining the bootstrap failure rather than a fabricated review.

## Bundle contents

```
SKILL.md                              # prompt + scoring rules + report template
references/clean-code/                # frozen curriculum, copied from mentor-resources/clean-code
scripts/init.sh                       # bootstrap
scripts/checkers/check-ts-usage.sh
scripts/checkers/check-no-console.sh
scripts/checkers/check-git-quality.sh
scripts/checkers/check-commented-code.sh
scripts/sync-references.sh            # dev helper: re-sync from mentor-resources/clean-code
```

## Updating

When `mentor-resources/clean-code/*` changes, re-run `scripts/sync-references.sh` from the skill bundle. If installed via symlink (Option A), changes are picked up automatically; if installed via copy (Option B), re-run Option B.

## Status

v1.0 — severity system (🔴/🟡/🔵), Mode A finding formula (What/Why/How to fix/Reference), anti-repetition rule, pre-output self-check, stack detection (HTML/CSS/JS/TS/React; Angular guard), inline PR comments with suggestions via `gh api`, GitHub issues mode via `gh issue create`.

v1.0.1 — Agent-First protocol (surface significant problems beyond the checker list), Goals-vs-Steps audit, Language section simplified.

v1.0.2 — Opus-literal hardening: per-stack mandatory reference citation (e.g. `React.md` must be cited for React projects), quantifiable rubric violations always get a standalone finding (not only a Score row).
