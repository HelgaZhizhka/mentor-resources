# Pocket Mentor — Claude Code skill

Structured RS School-style code review of a cloned student repository.

Version: **v1.2.0**

## Mentor's note — what this tool is (and isn't)

`pocket-mentor` is a tool *for the tradesperson*. It saves you mechanical work so you can spend more time on the part AI cannot do: the pedagogy of *this* student in *this* moment of their learning.

**What it is for:**
- First pass on a student PR — saves time on lint/build/tsc, formal rules, score against rubric, and citing your own curriculum consistently across reviews.
- An objective base for conversation when a student disputes a finding (the report cites specific files in `clean-code/*`).

**What it is NOT for:**
- A final verdict you copy-paste to the student.
- A replacement for your judgment about *this* student in *this* moment of their learning.
- A scaffold that makes you forget what to look for yourself.

**Three risks to watch:**

1. **Anchoring** — AI returns 8 findings; you treat them as *the* scope. The unique thing this student needs to hear gets lost.
   *Counter:* read the AI report, then close it and ask yourself: "what would I have said without this?"

2. **Standardisation erodes context** — one student just survived a hard month and needs encouragement. Another is coasting and needs a push. A third is ahead and ready for advanced topics. AI writes to all of them the same way.
   *Counter:* adapt tone, depth, and emphasis when you curate the report into the message you send.

3. **Atrophy of your own intuition** — if every review starts with AI, you slowly stop noticing patterns yourself.
   *Counter:* occasionally do a review without the tool to keep the skill alive.

**Use the right output mode for the situation:**

- *Default* (local `CODE_REVIEW_REPORT.md`) → you read, edit, send your own message to the student. Best for most cases.
- `--output inline` → the filtered comments are posted in your name on the PR. Use when findings are clearly actionable and you have sanity-checked them. The inline filter caps 🟡+🔵 at 5 (≤1 🔵); 🔴 are always kept.
- `--output issues` → only 🔴 critical findings become tracked issues. Use when you want the student to have explicit work items, not just inline noise.

**Who this tool is for:**
- Mentors with sustained load (multiple PRs per week) — AI handles mechanics, you preserve energy for pedagogy.
- Mentors who are early in their menthorship journey — AI as scaffolding, gradually replaced by your own intuition.
- Mentors who need consistent reference-grounded reviews and a Score against rubric.

**Who this tool may be less useful for:**
- Senior mentors with strong intuition who prefer a fully personal touch on every PR.
- Reviewers with a tiny student cohort where the time saved is not worth the curation overhead.
- Anyone tempted to rubber-stamp AI output without curating — in that case the tool works against the student, not for them.

## Model selection

Starting with v1.0.3, `SKILL.md` declares `model: claude-sonnet-4-6` in its frontmatter. When you invoke `/pocket-mentor`, Claude Code switches to **Claude Sonnet 4.6** for the duration of that single turn, then returns to whatever model you had active in the session. The override does not modify your settings; it is scoped to the skill invocation only.

**Why this is set:** A 5-model comparison test (Opus 4.7, Sonnet 4.6, Kimi K2, a GPT model, and a free-tier baseline) on the same student project showed that on weaker models the skill **fabricates facts** (e.g. wrong git branch, wrong Conventional-Commits compliance) and **misses structural rubric violations** (routing absence, body content, memory leaks). A mentor forwarding a hallucinated review to a student causes more harm than the friction of a model switch. Sonnet 4.6 was chosen over Opus 4.7 because it produced the most complete report (8 critical findings vs. 6) and is cheaper.

**To override:** Edit `SKILL.md` and change the `model:` line. Use `inherit` to fall back to your session's active model, or set a specific identifier (`claude-opus-4-7`, etc.). Any change is local to your install — the `npx skills update` step will reapply the upstream default unless you keep a local fork.

> ℹ️ The `model:` field is a Claude Code extension to the open Agent Skills standard. Other agents (Cursor, Gemini CLI, OpenCode, …) that support the standard will silently ignore this field.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated
- [gh CLI](https://cli.github.com/) installed and authenticated (`gh auth login`) — required only for `--output inline` and `--output issues` modes
- [jq](https://jqlang.github.io/jq/) — required only for `--output inline` and `--output issues` modes (`brew install jq`)

## Security note

Student repositories are untrusted input. By default, `/pocket-mentor` runs a safe/static bootstrap: it detects project structure and reads files, but it does **not** install dependencies or run `package.json` scripts.

Use execution flags intentionally:

- `--safe` — default; no dependency install, no `npm run lint`, no `npm run build`.
- `--allow-scripts` — run `lint`/`build` only if `node_modules` already exists; do not install dependencies.
- `--allow-install` — may run package manager install and then package scripts. This can execute lifecycle scripts from the student repository.

For unknown or suspicious submissions, start with the default safe mode. Use full execution only in a sandbox or disposable clone, and avoid running it in a directory that contains real tokens, private `.env` files, SSH keys, or unrelated private work.

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

Full mechanical verification on an already-installed project:

```
> /pocket-mentor --allow-scripts
```

Full verification that may install dependencies:

```
> /pocket-mentor --allow-install
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

1. **Bootstrap (`scripts/init.sh`)** — detects `package.json` (including in subdirectories), package manager, TypeScript config, ESLint config, README presence. Default safe mode skips dependency install and package scripts; `--allow-scripts` / `--allow-install` opt into lint/build execution. Emits a single JSON object summarising everything.
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
- `--safe` — skip dependency install and skip all package scripts, even if dependencies already exist

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

v1.0.3 — Turn-scoped model lock to Claude Sonnet 4.6 via the `model:` frontmatter field, after a 5-model comparison test established that weaker models fabricate facts and miss structural rubric violations. See [Model selection](#model-selection) above.

v1.1.0 — Inline-mode filter: when `--output inline`, the student-facing PR comments are capped at 7 findings (all 🔴 Critical + top 3–4 🟡 + at most 1 🔵), prioritized by teaching value. The full `CODE_REVIEW_REPORT.md` is still written with everything for the mentor. Rationale: 30+ inline comments on a student PR overwhelm and lose pedagogical impact — depth over breadth. Local mode unchanged.

v1.1.1 — Refined the inline-mode filter after a real run on fun-chat produced 7 🔴 + 4 🟡 (11 total): the old "total cap: 7" rule was unreachable when 🔴 alone reached the cap, so the model interpreted it ambiguously. New rule: all 🔴 are always kept (no upper bound — hiding a blocker is worse than a longer list), and the 🟡 + 🔵 tier has its own combined cap of 5 (with at most 1 🔵). This matches what the model actually produced and what the mentor judged appropriate.

v1.2.0 — Security hardening after public skill supply-chain research: safe/static bootstrap is now the default, package-script execution requires `--allow-scripts`, dependency installation requires `--allow-install`, SKILL.md defines an explicit untrusted-input boundary, and GitHub draft publishing scripts validate draft shape and caps before posting.
