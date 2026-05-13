# AGENTS.md

`mentor-resources` is an open-source toolkit for RS School frontend mentors.

**Currently active work:** Pocket Mentor v0.9-alpha — 28-day sprint to a demo for the RS School AI club call. Engine + CLI for AI-assisted PR review against school task rubrics. Full spec: [docs/pocket-mentor/SPEC.md](docs/pocket-mentor/SPEC.md).

## Startup workflow

Before writing any code, in order:

1. Read this file
2. Read `docs/pocket-mentor/SPEC.md` (the canonical implementation spec)
3. Run `./init.sh` (deps + lint + typecheck — must exit 0)
4. Read `feature_list.json` — find the one feature with `status: "in-progress"` (or the next `pending` if none in-progress)
5. Read `progress.md` — last session's notes, blockers, decisions
6. At the start of a new milestone (M0, M1, ...), invoke `/writing-plans` to break it into specific tasks before coding

## Working rules

- **One feature at a time.** The one with `status: "in-progress"` in `feature_list.json`. Do not start a new feature without first marking the current one done.
- **TypeScript strict, no `any`.** `tsconfig.base.json` at repo root enforces this (each package extends it); don't loosen it.
- **No tests unless explicitly asked** (per global CLAUDE.md). M5 has a smoke test as the only exception — see SPEC §7.
- **Code review before commit.** Invoke `feature-dev:code-reviewer` subagent on the diff. At milestone boundaries (end of M1, M3, M4, M5) wrap that in `/requesting-code-review` and `/receiving-code-review` skills.
- **No scope creep.** SPEC §2 lists what's out of scope for v0.9. Resist the temptation to add it.
- **Penalty handling** — async-race has `-100% for React`. Representation in Output schema is decided in M4 (see SPEC §12).

## Definition of done (per feature)

Mark a feature `"done"` in `feature_list.json` only when:

- [ ] `pnpm typecheck` passes (alias for `pnpm -r typecheck` — runs per-package)
- [ ] `pnpm lint` passes
- [ ] `feature-dev:code-reviewer` reviewed the diff; every flagged issue triaged (fixed or pushed back with reason)
- [ ] For M5: smoke test against `pocket-mentor-test-fixtures` passed (draft-review URL in `evidence`)
- [ ] `feature_list.json` updated (`status: "done"`, `evidence` filled)
- [ ] `progress.md` updated

## End of session

Before stopping:

1. Update `progress.md` (done, next, blockers, decisions)
2. Update `feature_list.json` (status changes)
3. Run `./init.sh` once more — repo must be in clean restartable state
4. Commit with a descriptive message
5. Push branch (do NOT merge to master without Helga's explicit ok)

## Required artifacts

- `AGENTS.md` (this file) — routing layer
- `feature_list.json` — M0–M6 state tracker
- `progress.md` — session continuity log
- `init.sh` — install + verification entry point
- `docs/pocket-mentor/SPEC.md` — canonical implementation spec
- `docs/pocket-mentor/SESSION-HANDOFF.md` — handoff template

## Useful skills (Claude Code superpowers plugin)

- `/brainstorming` — before any creative / scoping decision
- `/writing-plans` — at the start of each milestone, to break it into specific tasks
- `/requesting-code-review` + `/receiving-code-review` — at milestone boundaries
- `/systematic-debugging` — for diagnosing bugs, especially M5 GitHub API edge cases

## Useful built-in subagents

- `feature-dev:code-architect` — pre-M1 design questions
- `feature-dev:code-reviewer` — per-feature review (auto-reads project CLAUDE.md / AGENTS.md)
- `Explore` — read-only codebase search
