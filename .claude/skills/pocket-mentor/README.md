# Pocket Mentor — Claude Code skill

Structured RS School-style code review of a cloned student repository.

## Install

### Option A — Claude Code native (preferred when available)

> **Confirmed at v0.9 build time:** `claude plugin install` exists but requires a published marketplace entry. Until `mentor-resources` is wired up as a marketplace, use Option B. See `claude plugin marketplace --help` for the marketplace API once we publish.

```bash
# Once a marketplace entry is published:
# claude plugin install pocket-mentor@<marketplace-name>
```

### Option B — manual copy (always works today)

```bash
git clone https://github.com/HelgaZhizhka/mentor-resources.git /tmp/mentor-resources
mkdir -p ~/.claude/skills
cp -R /tmp/mentor-resources/.claude/skills/pocket-mentor ~/.claude/skills/
```

Verify:

```bash
ls ~/.claude/skills/pocket-mentor/SKILL.md && echo "installed"
```

### Option C — session-only (no install)

```bash
claude --plugin-dir /path/to/mentor-resources/.claude/skills/pocket-mentor
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
