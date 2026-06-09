# AGENTS.md

`mentor-resources` hosts Claude Code skills for RS School mentors, plus reference curriculum (`clean-code/`) and student-facing configs (`templates/configs/`). Each skill is a self-contained bundle under `.claude/skills/<skill-name>/`.

## Current skills

- [`.claude/skills/pocket-mentor/`](./.claude/skills/pocket-mentor/README.md) — structured code review of cloned student PRs (v1.1.1, stable).
- [`.claude/skills/react-course-review/`](./.claude/skills/react-course-review/README.md) — pedagogical React-course review of student React projects (v0.5.0, draft).

When a new skill is added, list it here with a one-line description and a link to its `README.md`.

## Repository layout

```
mentor-resources/
├── .claude/
│   ├── settings.json              # Claude Code hooks (Stop checklist)
│   └── skills/<skill-name>/       # Self-contained skill bundles
├── clean-code/                    # Curriculum — students and mentors read; skill bundles use as references/
├── docs/pocket-mentor/            # Pocket Mentor design docs
├── templates/configs/             # ESLint + tsconfig reference configs for students
├── AGENTS.md                      # This file — routing + conventions
├── CLAUDE.md                      # Symlink → AGENTS.md (Claude Code auto-loads this name)
├── feature_list.json              # Per-skill state tracker (id, version, status)
├── progress.md                    # Multi-session continuity log (newer entries at the bottom)
├── CONTRIBUTING.md                # Contribution guide
├── README.md                      # Public-facing repo entry point
└── init.sh                        # Repo-level verifier (smoke + git status)
```

## Development workflow

At session start:

1. Read this file (you're doing it).
2. Read `progress.md` — the last entry tells you where the previous session ended, what's the next step, and what's blocked.
3. Read `feature_list.json` to see the current skill inventory and statuses.
4. Look at the recent `git log` for context not captured above.

When changing a skill or curriculum:

1. Edit files in `.claude/skills/<skill-name>/` or `clean-code/` directly.
2. If you touched a bash script: run `shellcheck` on it.
3. Bump the skill version in `SKILL.md` (and the `Version` line in the skill's `README.md`) for any skill change that affects behaviour.
4. Run `./init.sh` from this repo root — it must exit 0.
5. Commit with a descriptive message — commit messages are the granular history.

## Working rules

- **One skill per branch.** Don't mix changes across skills in a single PR.
- **Never break the JSON contract** emitted by bash checkers (`{checker, ok, summary, findings[], stats{}}`). If the schema must evolve, document it in `SKILL.md` and bump the skill version.
- **Skill changes are versioned.** Use semantic intent: bug fix → patch, new checker/flag → minor. Reflect the new version in `feature_list.json` (`current_version`) and the skill's `SKILL.md` / `README.md`.
- **`progress.md` is for multi-session continuity, not granular history.** One entry per work session, capturing: what was done, durable decisions, next step, blockers. Granular changes live in `git log`.
- **`feature_list.json` is per-skill, not per-task.** Internal skill scope lives in commit messages and the skill's own version log.
- **Skill prompts and bash scripts stay in English.** Mentor-facing output language is decided at runtime by the skill (see `pocket-mentor/SKILL.md` language-detection block).

## Definition of Done

A change is done when ALL criteria for its type are met.

### Skill behaviour change (feature / fix / prompt)
- [ ] `shellcheck` on changed `.sh` scripts — clean
- [ ] `./init.sh` exits 0 (runs shellcheck on all scripts + smoke test)
- [ ] Version bumped in the skill's `README.md` and in `feature_list.json` (`current_version`)
- [ ] If `SKILL.md` (LLM prompt) changed: `/pocket-mentor` tested in a real student repo
- [ ] Commit message includes the new version number

### Curriculum update (`clean-code/`)
- [ ] `bash .claude/skills/pocket-mentor/scripts/sync-references.sh` — syncs changes into skill/action bundles
- [ ] `./init.sh` exits 0

### Tooling / harness change (`AGENTS.md`, `init.sh`, hooks, etc.)
- [ ] `./init.sh` exits 0
- [ ] No broken links in `AGENTS.md`
- [ ] Commit message explains why the change was made

## Verification

`./init.sh` performs three checks in order:

1. **shellcheck** — runs `shellcheck` on every `*.sh` under `.claude/skills/`. Exits non-zero on the first failure. Catches bash syntax errors and common pitfalls in all skill scripts at once.
2. **Smoke test** — runs `.claude/skills/pocket-mentor/scripts/init.sh --no-install` against this repo and confirms the output is well-formed JSON with the expected fields (`checker`, `ok`, `summary`, `project`). The smoke test does **not** require `"ok": true` — `mentor-resources` itself has no `package.json`, so `ok: false` is the correct result here.
3. **Clean working tree** — warns (does not block) if `git status --porcelain` has output. Reminder to commit before ending the session.

## Adding a new skill

When introducing a new skill:

1. Create `.claude/skills/<skill-name>/SKILL.md` with proper YAML frontmatter (`name`, `description` — see Anthropic skill format).
2. Create `.claude/skills/<skill-name>/README.md` with install + usage.
3. If the skill ships bash mechanics, place them under `scripts/` and follow pocket-mentor conventions:
   - JSON output contract: `{checker, ok, summary, findings[], stats{}}`
   - `--project-dir <path>` flag accepted
   - `shellcheck`-clean
4. Add an entry to **Current skills** in this file with a one-line description.
5. If the skill participates in `./init.sh` smoke checks, extend `init.sh` to include it.

## Agent skills

### Issue tracker

Local markdown under `.scratch/<feature-slug>/` — one feature per directory. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` at repo root (8-term glossary) and `docs/adr/` (ADR-0001, ADR-0002). See `docs/agents/domain.md`.

## End of session

Before stopping:

1. **Update `progress.md`** with one new entry: `## YYYY-MM-DD — topic`, then Done / Decisions / Next / Blockers.
2. **Update `feature_list.json`** if the version or status of any skill changed during the session.
3. Run `./init.sh` — must exit 0.
4. Commit any clean-state changes with a descriptive message.
5. If you leave anything uncommitted on purpose, write a brief note in the WIP commit message explaining why.
