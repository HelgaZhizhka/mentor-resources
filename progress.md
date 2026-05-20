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
- Post-demo — discussion about positioning and next iteration.
- Post-demo — triage + implement skill publish mechanism so mentors can install without cloning mentor-resources. Issue: `.scratch/skill-publish/issues/01-publish-pocket-mentor-skill.md`.

**Blockers:**
- None. Demo-ready.

---

## 2026-05-20 — Full session: v0.9.4–v0.9.6, harness reset, Matt Pocock flow

**Done:**
- **v0.9.4** — stricter `--context` failure-mode (explicit forbidden fallbacks list, AskUserQuestion mandatory), self-check instruction for Fix snippets in SKILL.md.
- **v0.9.5** — score-vs-penalty decision tree (never apply both for same violation), git line in Stack section, non-conventional commits listed verbatim in report.
- **Repo cleanup** — removed pre-pivot scaffolding: `packages/engine/`, `packages/cli/`, monorepo configs, old `AGENTS.md`/`feature_list.json`/`progress.md`, `docs/pocket-mentor/SPEC.md`, `CONTEXT.md`, `SESSION-HANDOFF.md`, build plan. README and CONTRIBUTING updated.
- **Harness reset** — new `AGENTS.md` (routing, DoD, workflow), `CLAUDE.md` symlink, `feature_list.json` (per-skill), `progress.md`, `init.sh` (shellcheck gate + smoke test).
- **Matt Pocock skills** — `docs/agents/issue-tracker.md` (local markdown), `triage-labels.md` (defaults), `domain.md` (single-context). `## Agent skills` block in AGENTS.md. `.scratch/` added to `.gitignore`.
- **Harness improvements** — Definition of Done (3 change types), shellcheck automated in `init.sh`, AGENTS.md fully in English.
- **v0.9.6** — colored stderr output in `init.sh` via full Matt Pocock flow: `/grill-me` → `/to-prd` → `/to-issues` → `/executing-plans`. `info/ok/fail/skip` functions, TTY + `NO_COLOR` auto-disable.
- **CONTEXT.md + ADRs** — `/grill-with-docs` session produced 8-term glossary and ADR-0001 (skill-first over engine+CLI), ADR-0002 (bash checkers over AST). `docs/pocket-mentor/` retired.
- **Skill publish issue** — `.scratch/skill-publish/issues/01-...` created (Status: needs-triage).

**Decisions (durable):**
- `progress.md` + git log hybrid for session continuity (no progress.md as granular log).
- `feature_list.json` is per-skill, not per-task.
- `init.sh` runs shellcheck on all `.sh` files as step 1 (automated gate).
- Definition of Done is per change-type (skill behaviour / curriculum / tooling).
- `.scratch/` gitignored — local issue tracker only.
- `CONTEXT.md` + `docs/adr/` are the canonical domain docs; `docs/pocket-mentor/` removed.

**State of skills:**
- `pocket-mentor` — **v0.9.6, stable**. Testing in student repo pending before PR to master.

**Next:**
- Test `/pocket-mentor` v0.9.6 on student repo (anastasiashlyk-JSFE2025Q3/fun-chat or new PR).
- Open PR: `feature/pocket-mentor-v0.9-redesign` → `master`.
- Post-demo (2026-05-21) — RS School positioning discussion.
- Post-demo — triage skill publish issue (`.scratch/skill-publish/issues/01-...`).

**Blockers:**
- None.

---
