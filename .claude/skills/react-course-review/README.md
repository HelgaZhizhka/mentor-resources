# React Course Review — Claude Code skill

Pedagogical review of RS School React-course student projects.

Version: **v0.6.1**

## What This Skill Is For

`react-course-review` checks React assignments against course learning goals, not against an ideal production React app. It is meant for mentors reviewing student submissions where feedback should explain:

- what is broken;
- why it matters in React;
- how to fix it;
- which course principle is involved;
- what is critical now and what can wait.
- what preliminary mentor score is reasonable on a 100-point scale.

Use it when the project is a React or React+TypeScript assignment and the mentor wants course-level feedback.

For non-React tasks, use [`pocket-mentor`](../pocket-mentor/README.md).

## Install

Recommended for mentors:

```bash
npx skills@latest add HelgaZhizhka/mentor-resources -g -a claude-code --skill react-course-review
```

Development symlink:

```bash
git clone https://github.com/HelgaZhizhka/mentor-resources.git ~/Projects/mentor-resources
mkdir -p ~/.claude/skills
ln -s ~/Projects/mentor-resources/.claude/skills/react-course-review ~/.claude/skills/react-course-review
```

## Use

From a cloned student repository:

```text
> /react-course-review
```

With task requirements or a scoring rubric:

```text
> /react-course-review --context ./task.md
```

With a course focus:

```text
> /react-course-review --context ./task.md --focus hooks
```

Supported focus values:

- `fundamentals`
- `hooks`
- `data`
- `forms`
- `testing`
- `final`

Force report language:

```text
> /react-course-review --context ./task.md --language ru
```

Supported language values:

- `auto` — session language, Russian fallback for flags-only invocations
- `ru` — Russian report prose, headings, labels, tables, checklist items, and GitHub comment bodies
- `en` — English report prose and labels

Optional output path:

```text
> /react-course-review --context ./task.md --output-path ./reviews/react-review.md
```

Post filtered inline PR comments after mentor approval:

```text
> /react-course-review --context ./task.md --output inline
```

Create GitHub issues for 🔴 Course blockers after mentor approval:

```text
> /react-course-review --context ./task.md --output issues
```

Both:

```text
> /react-course-review --context ./task.md --output inline,issues
```

## What It Checks

1. **Bootstrap** — detects React, TypeScript, common tooling, router/test dependencies, package manager, README, ESLint config; installs dependencies when allowed; runs `lint`, `build`, and one discovered test script. Package manager detection prefers lockfiles, then `packageManager` in `package.json`, then `npm`.
2. **Mechanical signals** — optional bash checkers for TypeScript escape hatches, console calls, commented-out code, and git hygiene.
3. **React-course review** — LLM inspection grounded in `clean-code/*` references:
   - React fundamentals: components, props, state ownership, keys, controlled inputs, conditional rendering;
   - hooks: side effects, dependencies, unconditional hooks, loops, derived state, custom hooks;
   - TypeScript: props, API/data models, `any`, assertions, optional fields;
   - data flow: loading/error/empty states, fetch ownership, duplicated async logic;
   - forms: labels, validation, visible errors, submit behaviour, manageable state;
   - UI/UX minimum: keyboard use, mobile layout, visible states;
   - security and error handling: secrets, unsafe HTML, empty `catch`, missing user-visible errors;
   - course-calibrated maintainability: state/model ownership, thin abstractions, scattered conditionals, type boundaries, and test seams;
   - code quality: component size, copy-paste, names, business logic in JSX, magic values.

## Output

The skill always writes `REACT_COURSE_REVIEW.md` by default. With `--output inline`, `--output issues`, or `--output inline,issues`, it also writes draft JSON files and asks for mentor approval before posting anything to GitHub.

Sections follow the selected report language. In `--language ru`, headings, labels, table headers, checklist items, and GitHub comment bodies are Russian; code identifiers, package names, script names, and file paths stay in English.

Canonical sections:

- Scope
- Strengths
- 🔴 Course blockers
- 🟡 React learning feedback
- 🔵 Later improvements
- Functional Rubric Estimate, only when `--context` has a rubric
- Recommended Mentor Score, advisory 0-100 after code-review risks
- Priority Fixes
- Process Notes
- Manual checks for mentor
- Generated Files
- Summary for student

GitHub modes:

- `inline-draft.json` → line-specific PR review comments, filtered for student readability.
- `issues-draft.json` → GitHub issues for 🔴 Course blockers only.

Every major finding uses:

- `What`
- `Evidence`, required for blockers when useful
- `Why it matters in React`
- `Course principle`
- `How to fix`
- `Reference`

These labels are translated in non-English output.

## Companion Skills

These can be useful, but they are not the main review filter for students:

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns
npx skills add https://github.com/hieutrtr/ai1-skills --skill react-testing-patterns
```

Optional for final projects:

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
```

`vercel-react-best-practices` is better reserved for advanced students or final projects. It can be too production/performance-oriented for ordinary course assignments.

## Bundle Contents

```text
SKILL.md
README.md
references/clean-code/
scripts/init.sh
scripts/checkers/check-ts-usage.sh
scripts/checkers/check-no-console.sh
scripts/checkers/check-commented-code.sh
scripts/checkers/check-git-quality.sh
scripts/post-pr-review.sh
scripts/create-issues.sh
scripts/sync-references.sh
```

## Status

v0.1.0 — initial standalone React-course review skill bundle. It reuses the mentor-resources clean-code references and generic bash checkers, but changes the prompt center from broad clean-code review to React-course pedagogy.

v0.2.0 — aligned with React mentor-review practice: no separate student-level flag, evidence-first blockers, explicit security/error-handling checks, and an advisory 0-100 Recommended Mentor Score with confidence and final-call note.

v0.3.0 — adds output modes: local report, filtered inline PR comments, GitHub issues for 🔴 Course blockers, and combined inline+issues. GitHub publishing uses draft JSON files plus a mandatory mentor approval gate before running `gh`.

v0.4.0 — adds `--language auto|ru|en`, separates Functional Rubric Estimate from Recommended Mentor Score, requires score-delta explanation when they differ, adds Priority Fixes and Generated Files sections, and caps score confidence at `medium` when build/lint/tests/runtime were skipped.

v0.5.0 — adds a course-calibrated maintainability pass inspired by strict architecture review: look for simpler state/model ownership, scattered conditionals, thin hooks/helpers, unclear type boundaries, and missing test seams without turning student review into a production approval gate. Adds Process Notes for git/checker findings that should be visible to mentors but not over-promoted to React blockers.

v0.5.1 — fixes `--language ru` localisation by requiring translated report headings, labels, table headers, checklist items, mentor notes, and GitHub comment bodies. Technical identifiers remain in English.

v0.6.0 — adds test script discovery to bootstrap. The init script prefers `test:coverage`, `coverage`, `test:cov`, `coverage:test`, `test:ci`, `test:run`, `test:unit`, then plain `test` with `CI=true`, and reports the selected script plus pass/fail/skip status in JSON.

v0.6.1 — improves package manager detection: lockfiles still win, then `packageManager` from `package.json`; supports `npm`, `pnpm`, `yarn`, and `bun`, with PATH fallback for common macOS locations.
