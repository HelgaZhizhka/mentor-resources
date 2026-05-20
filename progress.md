# mentor-resources — Progress Log

Append-only session log. Newer entries at the bottom. For granular history (per-commit), see `git log`. This file is for **multi-session continuity** — what was the last decision, what's the next step, what's blocked.

Entry format: one section per session, in reverse-chronological-narrative order within the file. Use this template:

```markdown
## YYYY-MM-DD — Topic / focus

**Done:** ...

**Decisions:** ...

**Next:** ...

**Blockers:** ...
```

---

## 2026-05-20 — Repo cleanup + harness reset

**Done:**
- Removed pre-pivot scaffolding: `packages/engine/`, `packages/cli/`, monorepo configs (pnpm-workspace.yaml, root tsconfig, root eslint.config.js, root package.json), root `init.sh` for monorepo, old `AGENTS.md` / `feature_list.json` / `progress.md`.
- Removed superseded docs: `docs/pocket-mentor/SPEC.md`, `CONTEXT.md`, `SESSION-HANDOFF.md`, `docs/superpowers/plans/2026-05-18-pocket-mentor-v0.9-skill.md`.
- Refreshed pocket-mentor README and SKILL.md to reflect v0.9.5 reality (4 checkers, `--context` URL support, gh-api preference for GitHub, AskUserQuestion failure-mode, score-vs-penalty rules, git findings visible in Stack section).
- Restored minimal harness: new `AGENTS.md` (~60 lines, routing layer), `CLAUDE.md` (pointer to AGENTS.md), new `init.sh` (smoke-tests the skill against this repo + warns on uncommitted changes), and now this `progress.md` + `feature_list.json`.

**Decisions (durable):**
- Repo positioning: `mentor-resources` hosts Claude Code skills (currently one: pocket-mentor) plus curriculum and student configs. Future skills land under `.claude/skills/<name>/`.
- `feature_list.json` tracks per-skill, not per-task inside a skill. Internal skill scope lives in commit messages and `SKILL.md` version bumps.
- Verification = `init.sh` runs the skill's bootstrap against this repo and checks JSON structure (not `ok=true` — mentor-resources has no `package.json` by design).
- No aggregated `shellcheck` step in `init.sh` — kept per-script at edit time.

**State of skills:**
- `pocket-mentor` — **v0.9.5, stable**. Feature-complete for the 2026-05-21 demo. Deferred: GitHub PR auto-publish, per-line review comments, AST-level checkers.

**Next:**
- 2026-05-21 — live demo run of `/pocket-mentor` on a real student PR.
- Post-demo — discussion with Dima/Andrey about positioning and next iteration.
- Post-demo — triage + implement skill publish mechanism so mentors can install without cloning mentor-resources. Issue: `.scratch/skill-publish/issues/01-publish-pocket-mentor-skill.md`.

**Blockers:**
- None. Demo-ready.

---
