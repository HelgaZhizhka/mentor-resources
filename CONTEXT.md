# Domain Context — mentor-resources

This file is the canonical glossary for the `mentor-resources` repository.
Use these terms exactly as defined when writing issues, ADRs, commit messages, and skill prompts.
Do not drift to synonyms the glossary explicitly avoids.

---

## Glossary

### Skill bundle
A self-contained installable directory under `~/.claude/skills/<name>/` consisting of:
- `SKILL.md` — the LLM prompt and execution rules
- `scripts/` — bash mechanics (init.sh + checkers)
- `references/` — frozen copy of curriculum files

Each skill bundle is developed in `.claude/skills/<name>/` inside this repo and installed on a mentor's machine via symlink (dev) or copy (snapshot).

Current skill bundles:
- `pocket-mentor` — broad mentor review of cloned student PRs across supported frontend stacks.
- `react-course-review` — React-course-specific mentor review focused on student learning goals.

**Avoid:** "skill" alone when the artifact is meant (prefer "skill bundle"); "plugin"; "agent".

### React-course review
The course-calibrated review performed by the `react-course-review` skill bundle. It checks React/React+TypeScript assignments against RS School learning goals: React fundamentals, hooks, forms, data flow, TypeScript, UI/UX minimum, error handling, security basics, maintainability, and the provided task context.

It is intentionally pedagogical. It should explain what is broken, why it matters in React, how to fix it, which course principle is involved, and what can wait.

**Avoid:** "production React review" (too strict for ordinary course work); "Vercel review" (external production/performance-oriented skills are only optional supplements).

### Checker
A bash script under `scripts/checkers/` that inspects the student repository for one class of issues and emits a single JSON object to stdout. Each checker is non-interactive, accepts `--project-dir <path>`, and is `shellcheck`-clean.

Current generic checkers used by `pocket-mentor` and `react-course-review`: `check-ts-usage`, `check-no-console`, `check-git-quality`, `check-commented-code`.

**Avoid:** "linter" (checkers are not linters — they complement ESLint, not replace it); "validator".

### JSON contract
The schema every checker must emit:
```
{ checker, ok, summary, findings[], stats{} }
```
`findings[]` items carry `file`, `line`, `match`, `rule`. The contract is considered stable — breaking it requires a skill bundle version bump and a note in `SKILL.md`.

**Avoid:** "checker output", "checker JSON" (both acceptable informally, but "JSON contract" is the term when discussing stability guarantees).

### Task context
The markdown file describing a specific RS School assignment: acceptance criteria, scoring rubric, penalties, and task-specific instructions. Passed to a mentor-review skill via `--context <path-or-url>` (local path or GitHub URL). When provided, it is treated as authoritative over generic clean-code rules and enables score/rubric sections in the review report.

**Avoid:** "rubric" as a synonym for the whole document (rubric is only the scoring part); "task README" (too vague — not all task contexts are READMEs).

### Rubric
The scoring breakdown inside a task context: a list of criteria with point values and optional penalties. The rubric is what drives the Score table in the review report. A task context may contain a rubric, but not all task contexts do.

**Avoid:** "task context" when only the scoring breakdown is meant.

### Mentor
An RS School code reviewer who installs and uses a mentor-review skill bundle to review student PRs. The mentor runs `/pocket-mentor` or `/react-course-review` inside a cloned student repository, reads and edits the resulting review report, and decides what feedback to send to the student. The mentor does not modify the skill bundle source.

**Avoid:** "user" (too generic); "reviewer" alone (ambiguous — the skill also "reviews").

### Skill author
The developer who maintains this repo and the skill bundle. Writes bash scripts, edits `SKILL.md`, cuts releases, and runs smoke tests. Currently one person. Distinguished from mentor because they interact with the source, not just the installed artifact.

**Avoid:** "developer" (too generic); "maintainer" (acceptable synonym).

### Student repository
The git repository cloned from a student's PR branch. The skill bundle runs inside it and writes the review report there. Distinct from the mentor-resources repo (skill source) and the installed skill bundle under `~/.claude/skills/<skill-name>/`.

**Avoid:** "student repo" is an acceptable short form; "project" alone (ambiguous — could mean the skill project).

### Review report
The markdown file written to the student repository after a mentor-review skill run. `pocket-mentor` writes `CODE_REVIEW_REPORT.md`; `react-course-review` writes `REACT_COURSE_REVIEW.md`. It is a **draft** for the mentor to edit and curate — not sent directly to the student. Fix snippets are illustrative and require mentor verification before sharing. The report can be overridden to a different path via `--output-path`.

**Avoid:** "output" (too generic); "feedback" (feedback is what the mentor sends after editing the report, not the report itself).

---
