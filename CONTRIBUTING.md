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

### Pocket Mentor skill

**What you can improve:**

- Tune the prompt in `SKILL.md` (rules for Critical issues / Recommendations / Score)
- Add or refine bash checkers under `scripts/checkers/`
- Add new entries to `references/clean-code/`

**Where to find it:**

- `.claude/skills/pocket-mentor/` — skill bundle
- `.claude/skills/pocket-mentor/README.md` — install and usage
- `.claude/skills/pocket-mentor/SKILL.md` — prompt and rules
- `.claude/skills/pocket-mentor/scripts/checkers/*.sh` — focused bash mechanics

**Recommendations:**

- Run `shellcheck` on any changed bash script before opening a PR
- Verify the JSON contract emitted by checkers stays stable (`checker`, `ok`, `summary`, `findings[]`, `stats{}`)
- Smoke-test the skill against a real student PR after non-trivial changes

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

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "docs: add example for async error handling"
git commit -m "fix: correct typo in Clean-Code-Fundamental-Part1.md"
git commit -m "feat: add checklist for TypeScript assignment"
```

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
