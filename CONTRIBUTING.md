# Contributing to Mentor Resources

Thank you for your interest in the project!
This repository was created for the RS School community and any contribution is welcome.

## Who can contribute?

- **RS School students** — share your experience and improvements
- **Mentors** — add new materials and checklists
- **Experienced developers** — help improve practices and examples
- **Anyone** — fix typos, improve documentation

## Types of contributions

### Clean code materials

**What you can add:**

- New code examples (bad/good)
- Additional practices and recommendations
- Bug fixes or corrections
- Improved explanations

**Where to find it:**

- `clean-code/` — main materials
- `clean-code/Check-List.md` — quick-reference checklist

**Example format:**

**Practice name**

**❌ Bad:**

bad example with an explanation of why

**✅ Good:**

good example with an explanation of why

Explanation of the reasons and consequences

### Mentor-review skill bundles

**What you can improve:**

- Tune the prompt in `SKILL.md` (rules for Critical issues / Recommendations / Notes / severity / stack detection)
- Add or refine bash checkers under `scripts/checkers/`
- Add new entries to `references/clean-code/` (or edit the canonical files in `clean-code/` at repo root — see sync note below)

**Where to find it:**

- `.claude/skills/pocket-mentor/` — broad mentor review across supported frontend stacks
- `.claude/skills/react-course-review/` — React-course-specific mentor review
- `<skill>/README.md` — install and usage
- `<skill>/SKILL.md` — prompt and execution rules
- `<skill>/scripts/init.sh` — bootstrap (project detection, install, lint, build, tests)
- `<skill>/scripts/checkers/*.sh` — focused bash mechanics
- `<skill>/scripts/sync-references.sh` — re-syncs `clean-code/*` from repo root into the skill bundle's `references/clean-code/`

**Architectural decisions** are tracked under [`docs/adr/`](./docs/adr/) — read them before proposing structural changes:

- [ADR-0001](./docs/adr/0001-skill-first-over-engine-cli.md) — why skill-first, not engine + CLI
- [ADR-0002](./docs/adr/0002-bash-checkers-over-ast.md) — why bash + grep, not AST parsing
- [ADR-0003](./docs/adr/0003-skills-sh-for-skill-publish.md) — why `npx skills add` for distribution
- [React Course Review SDD](./docs/superpowers/specs/2026-06-10-react-course-review-sdd.md) — design and boundaries for the React-course skill

**Curriculum sync:** when you edit any file under `clean-code/` (the canonical source), run the sync script for each affected skill bundle:

```bash
bash .claude/skills/pocket-mentor/scripts/sync-references.sh
bash .claude/skills/react-course-review/scripts/sync-references.sh
```

Each skill bundle reads from its own `references/clean-code/` — without sync, mentor-side curriculum and skill-side references will drift.

**Recommendations:**

- Run `shellcheck` on any changed bash script before opening a PR (the repo-level `./init.sh` does this for all skill scripts automatically)
- Verify the JSON contract emitted by checkers stays stable: `{ checker, ok, summary, findings[], stats{} }`. Breaking the contract requires a skill bundle version bump in `SKILL.md` + `README.md` + `feature_list.json`.
- Smoke-test the skill against a real student PR after non-trivial prompt changes — testing on Opus 4.7 specifically is recommended for prompt rule changes (it interprets rules more literally than Opus 4.6 / Sonnet, so it surfaces under-specified rules earlier)
- See [`AGENTS.md`](./AGENTS.md) "Definition of Done" for the full per-change-type checklist (skill behaviour change vs curriculum update vs tooling change)

### ESLint configuration for student projects

**What you can add:**

- New lint rules
- Improvements to existing rules
- Settings tailored to specific stacks

**Where to find it:**

- `templates/configs/eslint.config.js` — vanilla TS config
- `templates/configs/eslint.react.config.js` — React variant
- `templates/configs/LINTER-README.md` — linter documentation

## Pull Request process

### 1. Fork and clone

```bash
# Fork the repository via the GitHub UI
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/mentor-resources.git
cd mentor-resources
```

### 2. Create a branch

```bash
# Create a branch for your changes
git checkout -b your-feature-name
```

### 3. Make your changes

- Follow the existing style of the project
- Check Markdown formatting
- Test scripts before committing

### 4. Commit your changes

Use [Conventional Commits](https://www.conventionalcommits.org/) with a **scope** that identifies the area touched. This repo's convention is `type(scope): subject` — the scope makes `git log` and the change history readable:

```bash
# Curriculum / clean-code changes
git commit -m "docs(clean-code): add AbortController example to React.md §3.3"
git commit -m "fix(clean-code): correct typo in Clean-Code-Fundamental-Part1.md"

# Mentor-review skill changes
git commit -m "feat(pocket-mentor): add severity downgrade rule for style-only findings"
git commit -m "fix(pocket-mentor): handle pnpm-workspace projects in init.sh"
git commit -m "docs(react-course-review): clarify report scoring model"
git commit -m "fix(react-course-review): handle pnpm lockfile detection"

# Architecture decisions and progress
git commit -m "docs(adr): ADR-0004 — describe the decision title"
git commit -m "chore(progress): close session entry"
```

Common scopes used in this repo: `pocket-mentor`, `react-course-review`, `clean-code`, `adr`, `progress`, `student-reviewer` (planned).

### 5. Push and open a PR

```bash
git push origin your-feature-name
```

Then open a Pull Request via the GitHub UI:

**PR structure:**

```markdown
## Description

Brief description of the changes

## What was changed

- Added / fixed / improved ...

## Checklist

- [ ] Follows the existing style
- [ ] Markdown renders correctly
- [ ] No broken links
```

## Questions and help

- **Contribution questions:** open an [Issue](https://github.com/HelgaZhizhka/mentor-resources/issues)
- **Bugs and problems:** open an [Issue](https://github.com/HelgaZhizhka/mentor-resources/issues) with the `bug` label

**Thank you for your contribution! 🧡**
