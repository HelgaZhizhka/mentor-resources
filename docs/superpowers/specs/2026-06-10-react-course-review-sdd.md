# Software Design: react-course-review skill bundle

**Date:** 2026-06-10  
**Status:** Draft  
**Skill version:** v0.7.0
**Owner:** Helga Zhizhka

## Summary

`react-course-review` is a standalone Claude Code skill bundle for RS School React-course mentor review. It exists separately from `pocket-mentor` because React assignments need course-calibrated feedback: the review should assess React learning goals and the assignment rubric, not treat every student project as a production React application.

The skill writes a local mentor draft by default and can optionally prepare GitHub inline comments or issues after mentor approval.

## Problem

`pocket-mentor` is a broad code-review assistant for cloned student PRs across multiple frontend stacks. It is useful for final mentor review, but React-course assignments need a more specific rubric:

- React fundamentals: components, props, state ownership, keys, controlled inputs, conditional rendering.
- Hooks: side effects, dependencies, rules of hooks, derived state, custom hooks.
- Data flow: loading/error/empty states and async ownership.
- Forms, TypeScript, UI/UX minimum, security, error handling, and maintainability at a student-course level.

Production-oriented React skills can over-penalize performance or deployment concerns that are not the learning objective for the current task. The new skill keeps the review pedagogical.

## Goals

- Provide a React/React+TypeScript mentor-review workflow grounded in RS School course expectations.
- Read the whole student repository, not only a PR diff.
- Run deterministic bootstrap checks before LLM analysis. Default bootstrap is safe/static; package-script execution and dependency installation require explicit mentor opt-in.
- Support task context through `--context <path-or-url>` and treat it as authoritative over generic clean-code guidance.
- Produce a mentor-editable local report: `REACT_COURSE_REVIEW.md`.
- Support optional GitHub output modes with an approval gate:
  - `--output inline` for filtered line-specific PR comments.
  - `--output issues` for course blockers.
  - `--output inline,issues` for both.
- Support output language selection through `--language auto|ru|en`.

## Non-goals

- It is not a replacement for the mentor's final decision.
- It is not a production readiness gate.
- It does not post anything to GitHub without mentor approval.
- It does not install dependencies or run package scripts by default.
- It does not add naive grep-based React-specific anti-pattern checkers; React semantics stay in LLM analysis to avoid noisy false positives.
- It does not require a `--student-level` flag. The default audience is RS School React-course students; strictness is calibrated by task context, focus, and evidence.

## Users and workflow

Primary user: an RS School mentor who has cloned a student's React assignment repository.

Typical local workflow:

```text
> /react-course-review --context ./task.md --language ru --output local
```

The mentor reads and edits `REACT_COURSE_REVIEW.md`, then decides what to share with the student.

GitHub workflow:

```text
> /react-course-review --context ./task.md --language ru --output inline
```

The skill prepares draft JSON, shows what will be posted, asks for approval, and only then runs the GitHub helper script.

## Architecture

The skill bundle is self-contained under `.claude/skills/react-course-review/`:

```text
SKILL.md
README.md
references/clean-code/
scripts/init.sh
scripts/checkers/*.sh
scripts/post-pr-review.sh
scripts/create-issues.sh
scripts/sync-references.sh
```

Runtime flow:

1. Parse slash-command flags in `SKILL.md`.
2. Load task context when `--context` is provided.
3. Run `scripts/init.sh --safe` against the student repository unless the mentor explicitly requested `--allow-scripts` or `--allow-install`.
4. Read JSON bootstrap output and checker findings.
5. Read relevant source files, primarily under `src/`.
6. Load only the needed clean-code references from `references/clean-code/`.
7. Produce the report and, if requested, draft GitHub output files.
8. Ask for mentor approval before any GitHub publishing script runs.

## Bootstrap behavior

`scripts/init.sh` detects:

- nested application directory;
- package manager from lockfiles first, then `packageManager` in `package.json`, then `npm`;
- React, TypeScript, router, test dependencies, README, ESLint config;
- optionally lint, build, and one discovered test script.

Execution modes:

```text
--safe             no dependency install, no package scripts; default
--allow-scripts    run lint/build/test only if dependencies already exist
--allow-install    may install dependencies and run package scripts
```

Student repositories are treated as untrusted input. Dependency install and `package.json` scripts may execute arbitrary code from the submitted repository, so the full verification path is opt-in.

Test script discovery order:

```text
test:coverage
coverage
test:cov
coverage:test
test:ci
test:run
test:unit
test
```

The script emits JSON with the existing checker-style contract and includes project, safe-mode, lint, build, and test status. A failing test run is evidence for the report, not a shell crash.

## Output contract

Default local report:

```text
REACT_COURSE_REVIEW.md
```

Optional draft files:

```text
inline-draft.json
issues-draft.json
```

Canonical report sections:

- Scope.
- Strengths.
- Course blockers.
- React learning feedback.
- Later improvements.
- Functional Rubric Estimate, only when task context has a rubric.
- Recommended Mentor Score.
- Priority Fixes.
- Process Notes.
- Manual checks for mentor.
- Generated Files.
- Summary for student.

For `--language ru`, headings, labels, table headers, checklist items, mentor notes, and GitHub comment bodies should be Russian. Code identifiers, package names, script names, file paths, and command names stay in English.

## Scoring model

The skill separates two ideas:

- **Functional Rubric Estimate**: task-completion estimate from the assignment context, when a rubric exists.
- **Recommended Mentor Score**: advisory 0-100 score after code-review risks, failing checks, maintainability concerns, and confidence limits.

The report must explain the delta when the recommended score differs from the functional estimate. The final score always belongs to the mentor.

## Evidence rules

- Do not invent code that is not present.
- Course blockers need concrete file/line evidence when possible.
- If code cannot be read, state that explicitly.
- If the project does not compile or tests fail, surface that early.
- Real snippets are useful for major findings, but file/line evidence is the minimum requirement.

## Relationship to other tools

- `pocket-mentor`: broad mentor-review skill across supported frontend stacks.
- `react-course-review`: React-course-specific skill with a pedagogical rubric and React learning feedback.
- Student Reviewer GitHub Action: student-facing diff feedback during development, not whole-project mentor scoring.
- External React skills such as Vercel best-practices are optional supplements, not the primary filter for ordinary course submissions.

## Verification status

Verified on the RS School state-management student repository in local mode:

- nested app directory detected;
- dependencies installed;
- lint passed;
- build passed;
- `test:coverage` selected and failed due to `localStorage.clear is not a function` in test setup;
- report generated in Russian with medium confidence because runtime browser checks were manual.

The skill remains `draft` until it is validated on a second React student assignment through the actual slash-command flow.
