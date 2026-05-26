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

## 2026-05-20 — v0.9.7 fix + remove obsolete GitHub Actions workflows

**Done:**
- Fixed init.sh to emit colored `[init] ✗ lint check failed` / `[init] ✗ build check failed` when lint or build fail. Previously the color output was only shown during dependency installation, not during lint/build execution.
- Bumped version: v0.9.6 → v0.9.7 in `feature_list.json` and `README.md`.
- Removed obsolete GitHub Actions workflows (`.github/workflows/claude-code-review.yml` and `claude.yml`). These were legacy from the engine+CLI architecture and required `CLAUDE_CODE_OAUTH_TOKEN` which was not configured. Skill-first v0.9.x runs locally via `/pocket-mentor`, not via GitHub Actions.
- Added `CODE_REVIEW_REPORT.md` and `POCKET_MENTOR_EXECUTION_LOG.md` to `.gitignore` — these are local test artifacts.

**Decisions:**
- Patch-level change (bugfix) — no SKILL.md changes, only init.sh.
- GitHub Actions workflows deleted rather than fixed — CI-based review was never part of v0.9.x architecture.

**Next:**
- Demo tomorrow (2026-05-21). Skill is stable at v0.9.7.

**Blockers:**
- None.

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

## 2026-05-25 — pocket-mentor v1.0

**Done:**
- Tier 1 SKILL.md: severity system (🔴/🟡/🔵), Mode A formula (What/Why/How to fix/Reference), Notes template, anti-repetition rule, self-check
- Stack detection: HTML/CSS / Vanilla JS / TS / React+TS; Angular guard with banner
- Output modes: `--output inline` (line-specific PR comments + suggestions via gh api), `--output issues` (gh issue create per Critical)
- New scripts: `post-pr-review.sh`, `create-issues.sh` (both shellcheck-clean)
- Approval gate: mandatory before any gh posting, no auto-posting
- Version: v0.9.7 → v1.0

**Decisions:**
- React sub-rules (react-hooks.md, react-testing.md) deferred to v1.1
- Angular: unsupported guard with banner, no external skill reference
- inline-draft.json + issues-draft.json as LLM→bash handoff format
- 🔵 Notes section added to report template (quality review finding)
- "Why bad" unified to "Why" across Critical and Recommendation templates

**Next:**
- Smoke test on a real student repo (manual)
- Start student-reviewer GitHub Actions project (see plan: docs/superpowers/plans/2026-05-25-student-reviewer.md)

**Blockers:** none

---

## 2026-05-26 — pocket-mentor v1.0.1 closed

**Done:**
- Applied 3 insights from 2026-05-25 LLM expert meeting to SKILL.md:
  - **Agent-First Protocol** (#6) → new `## Surface what you see` section: model surfaces significant problems beyond the checker list (security, race conditions, memory leaks, architectural smells) with standard severity + Mode A format.
  - **Goals vs Steps audit** (#3) → 3 over-specified spots simplified without losing constraints (step ordering, node_modules UX, reference loading).
  - **Prompt optimization** (#5) → 4 substantive manual edits (Role priority order, Forbidden/Required lists, Severity examples, Language section); also adopted Language-as-numbered-list from OpenAI optimizer, later simplified to single signal (mentor's message) + Russian default. Ukrainian dropped from Language entirely (legacy from v0.9.1).
- README severity bug fixed mid-cycle: Critical examples concretized from abstract "RS School process violations" → concrete categories (forbidden tracked files, missing required rubric feature). Stopped promoting missing README to Critical.
- v1.0.1 validated on fun-chat (Opus 4.7): README correctly → 🟡; Agent-First produced 4 new valuable findings (About page missing as 🔴, JSON.parse boundary, password in sessionStorage, markMessageAsRead for own messages); duplicate WS handler correctly escalated 🟡→🔴; subscription accumulation returned and merged into stronger 🔴.

**Decisions (durable):**
- **No model recommendation in skills** — model choice belongs to the user; the skill must be robust across Sonnet/Opus. See `feedback_no_model_recommendation.md`.
- **Opus 4.7 reads prompts literally** — exceptions in Forbidden/Required lists must be spelled out, not inferred. See `feedback_opus_literal_prompts.md`. Discovered via pad-findings regression: "functions >40 lines" rubric finding got dropped because rubric-violation exception was implicit.
- Language section: single signal (mentor's message) + Russian default. CLAUDE.md and repo content rejected as language signals — explicit-only.

**State of skills:**
- `pocket-mentor` — **v1.0.1, stable**.

**Next:**
- v1.0.2 — pad-findings rule exception for quantifiable rubric violations (function length, magic numbers count, duplication count) → separate finding always, not only a Score row.
- Test v1.0.x on a React+TS student project to validate that `React.md` is actually loaded by stack detection and referenced in findings (not only `TypeScript.md` / Fundamentals).
- Student-reviewer GitHub Actions project (plan: docs/superpowers/plans/2026-05-25-student-reviewer.md) — not started.

**Blockers:** none

---

## 2026-05-26 — pocket-mentor v1.0.2 (Opus-literal hardening)

**Done:**
- Tested v1.0.1 on a real React+Next.js+Firebase student project (rest-client-app, prior year final). Two systemic Opus 4.7 literal-interpretation patterns confirmed:
  - **References silently skipped** — stack detection correctly identified React+TS, but `React.md` was cited **0 times** in 14 findings. The model surfaced a valid React-hooks problem (`UserProvider` with 3 overlapping `useEffect`) but linked to `react.dev/learn/you-might-not-need-an-effect` instead of `React.md §3.6`. Curriculum-as-source-of-truth bypassed.
  - **Pad-findings regression confirmed earlier on fun-chat** — quantifiable rubric finding ("functions >40 lines") schlopnut'sya into a Score row without a standalone finding. The `Forbidden: filling sections with weak findings` rule fired too aggressively because the rubric-violation carve-out was implicit.
- v1.0.2 SKILL.md changes:
  - **Strict rules → Required:** added explicit clause that quantifiable rubric violations (function length over limit, magic numbers count, duplication count, missing required feature) MUST have their own finding with `file:line` and fix snippet, even if also reflected in the Score row. Positive framing chosen over negative.
  - **Step 3 LLM analysis:** added "Cite the references you loaded" block — every Critical/Recommendation touching a topic covered by a loaded reference file MUST cite that reference by name. React stack → `React.md` MUST appear in ≥1 Reference line if any finding touches hooks/components/JSX/lifecycle. TS stack → `TypeScript.md` MUST appear if any finding touches `any`/`as`/type guards. External links (react.dev, MDN, OWASP) are supplementary, not replacements.
  - **Self-check:** added 2 new checklist items — reference citations gate (per-stack required filenames) and quantifiable-rubric-violation-as-finding gate.
- Version: v1.0.1 → v1.0.2 (SKILL.md prompt-only change; bash mechanics unchanged).
- New durable memory: `feedback_opus_literal_prompts.md` — Opus 4.7 reads prompts literally, exceptions in Forbidden/Required lists must be spelled out (not inferred).

**Decisions (durable):**
- **Opus 4.7 = literal model.** Prompt rules must spell out exceptions and per-case requirements; the skill cannot rely on the model inferring "obvious" carve-outs. Per-stack required reference filenames is an example of this discipline.
- **References by filename, not external links.** The curriculum (`references/clean-code/*.md`) is the single source of truth; external links exist only to deepen what the curriculum already covers. This preserves the curriculum's role and lets mentor-resources curriculum changes propagate to skill output without rewriting prompts.

**State of skills:**
- `pocket-mentor` — **v1.0.2, stable**.

**Next:**
- Re-test v1.0.2 on the same rest-client-app React project. Verify: `React.md` appears in citations (not only react.dev); pad-findings rule does not drop quantifiable rubric violations (needs `--context` to surface).
- Re-test v1.0.2 on fun-chat (vanilla TS) — verify "functions >40 lines" returns as a standalone finding.
- Student-reviewer GitHub Actions project (plan: docs/superpowers/plans/2026-05-25-student-reviewer.md) — not started.

**Blockers:** none

---
