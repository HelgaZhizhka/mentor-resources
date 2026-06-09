# React Course Review — Claude Code skill

Pedagogical review of RS School React-course student projects.

Version: **v0.1.0**

## What This Skill Is For

`react-course-review` checks React assignments against course learning goals, not against an ideal production React app. It is meant for mentors reviewing student submissions where feedback should explain:

- what is broken;
- why it matters in React;
- how to fix it;
- which course principle is involved;
- what is critical now and what can wait.

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

Optional output path:

```text
> /react-course-review --context ./task.md --output-path ./reviews/react-review.md
```

## What It Checks

1. **Bootstrap** — detects React, TypeScript, common tooling, router/test dependencies, package manager, README, ESLint config; installs dependencies when allowed; runs `lint` and `build` scripts.
2. **Mechanical signals** — optional bash checkers for TypeScript escape hatches, console calls, commented-out code, and git hygiene.
3. **React-course review** — LLM inspection grounded in `clean-code/*` references:
   - React fundamentals: components, props, state ownership, keys, controlled inputs, conditional rendering;
   - hooks: side effects, dependencies, unconditional hooks, loops, derived state, custom hooks;
   - TypeScript: props, API/data models, `any`, assertions, optional fields;
   - data flow: loading/error/empty states, fetch ownership, duplicated async logic;
   - forms: labels, validation, visible errors, submit behaviour, manageable state;
   - UI/UX minimum: keyboard use, mobile layout, visible states;
   - code quality: component size, copy-paste, names, business logic in JSX, magic values.

## Output

The skill writes `REACT_COURSE_REVIEW.md` by default.

Sections:

- Scope
- Strengths
- 🔴 Course blockers
- 🟡 React learning feedback
- 🔵 Later improvements
- Score, only when `--context` has a rubric
- Manual checks for mentor
- Summary for student

Every major finding uses:

- `What`
- `Why it matters in React`
- `Course principle`
- `How to fix`
- `Reference`

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
scripts/sync-references.sh
```

## Status

v0.1.0 — initial standalone React-course review skill bundle. It reuses the mentor-resources clean-code references and generic bash checkers, but changes the prompt center from broad clean-code review to React-course pedagogy.
