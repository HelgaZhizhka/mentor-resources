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

## 2026-05-26 — pocket-mentor v1.0.2 validated, closed

**Done:**
- Re-tested v1.0.2 on rest-client-app (React+Next.js+TS, no `--context`) and fun-chat (vanilla TS, with `--context`). Both v1.0.2 rules confirmed working with strong effect.
- **References citation rule (`React.md` MUST appear for React stack)** — rest-client-app: `React.md` cited **~8 times** with specific section anchors (§1.3, §2.4, §3.5, §3.6, §3.8, §5.1, §5.2, §6.1, §8.2). Up from 0 in v1.0.1. The rule didn't just add citations — it forced the model to read `React.md` and surface React-specific findings that weren't there before: `index` as `key` in editable lists (§8.2), `form.tsx` rebuilding yup schema each render + `watch()` instead of `handleSubmit` (§5.2), default exports + barrel `index.ts` anti-pattern (§1.3), `autoComplete="off"` on password fields (§5.1). Curriculum-as-source-of-truth working as designed.
- **Pad-findings exception for quantifiable rubric violations** — fun-chat: "functions >40 lines" returned as standalone Recommendation #1 with 5 files + line ranges + fix snippet (was compressed to a Score row in v1.0.1). Magic numbers became Critical #10 with detailed classification (timeouts, IDs, status strings, length thresholds). Code duplication split across `🔴 Critical #8` (duplicate WS handler) + `🟡 Recommendation #4` (6 send-factory wrappers in communicate-functions). Score table now cross-references the standalone findings — student gets "score → why → fix" in one package.

**Decisions (durable):**
- Two Opus-literal-prompt patterns confirmed and addressed by SKILL.md edits — `feedback_opus_literal_prompts.md` is validated by real-world test.

**State of skills:**
- `pocket-mentor` — **v1.0.2, stable**.

**Observations / minor regressions noted for future:**
- **rest-client-app**: SSRF finding from v1.0.1 was not surfaced in v1.0.2 — the model elevated the auth-cookie-not-verified finding (broken auth = more fundamental) and apparently treated SSRF as secondary. Both are valid; ideally both should appear. Local, not systemic.
- **fun-chat**: magic numbers escalated from 🟡 → 🔴 Critical. Quantifiable rubric violation alone is not a build/security/correctness blocker — by our own severity definition this should be 🟡 (quality). This is an over-correction from the pad-findings rule, where the model conflated "rubric violation must appear" with "rubric violation is Critical". Worth a v1.0.3 clarification in Severity levels: "Quantifiable rubric violation alone ≠ Critical; severity depends on impact (build break / security / correctness → 🔴; quality / style → 🟡)."

**Next:**
- v1.0.3 (optional, not blocking) — Severity levels clarification to prevent rubric-violation-as-🔴 over-correction.
- Student-reviewer GitHub Actions project (plan: docs/superpowers/plans/2026-05-25-student-reviewer.md) — still not started.
- Open PR `feature/pocket-mentor-v0.9-redesign` → `master` when ready.

**Blockers:** none

---

## 2026-05-27 — pocket-mentor v1.0.3 (turn-scoped model lock)

**Done:**
- PR #2 (`feature/pocket-mentor-v0.9-redesign` → `master`) merged via Squash and Merge — 125 commits collapsed into `a820c74` "pocket-mentor v1.0.2: skill-first redesign + Opus-literal hardening". master is now the canonical v1.0.2 state.
- Verified end-to-end install path: `npx skills@latest add HelgaZhizhka/mentor-resources` in a clean `/tmp` directory discovered the skill via GitHub Trees API, downloaded SKILL.md + 4 checkers + init.sh + sync-references.sh + 13 reference files in `references/clean-code/`. Dev symlink at `~/.claude/skills/pocket-mentor` left intact during the test.
- ADR-0003 added: `vercel-labs/skills` (`npx skills add`) chosen as the publish path. Note added on compliance with the open Agent Skills standard at agentskills.io (no layout changes required).
- PR #3 (`docs/sync-readme-contributing-to-v1.0.2`) opened and merged — root README, root CONTRIBUTING, and pocket-mentor README updated to reflect v1.0.2 reality (4 actual checkers vs lint/build, severity system, conditional Score, stack detection, output modes). Added `npx skills add` as the recommended install path.
- Cross-model capability test executed by the user on the fun-chat student project across five models (Opus 4.7, Sonnet 4.6, Kimi K2, a GPT model, free-tier baseline). Results showed weaker models fabricate facts (wrong branch, wrong Conventional-Commits compliance, missed `<div id="app">` body violation) while Sonnet 4.6 produced the most comprehensive report (8 critical findings vs Opus's 6, including a unique architectural bug in `UsersAside.getHtml()` no other model caught).
- PR #4 opened and merged via Squash and Merge — `feat(pocket-mentor): v1.0.3 — turn-scoped model lock to Claude Sonnet 4.6` (squash commit `3a6cd20` on master). SKILL.md frontmatter now sets `model: claude-sonnet-4-6` (a Claude Code extension to the open standard, turn-scoped — does not modify user session settings) and a `compatibility:` empirical disclaimer.
- pocket-mentor README updated with a new `## Model selection` section explaining the lock, the rationale, and the override path. `feature_list.json` bumped to v1.0.3 with restructured watch-items.
- Memory: `feedback_no_model_recommendation.md` refined — the original "no prose prescription" rule still holds, but turn-scoped `model:` frontmatter is now allowed and recommended when output quality has an empirical capability floor. New `observation_model_capability_pocket_mentor.md` records the 5-model test results.

**Decisions (durable):**
- **Open-standard compliance is structural, not a maintained product goal.** Claude Code remains pocket-mentor's primary target. Cross-agent compatibility (Cursor, Gemini CLI, OpenCode, etc.) is a side-effect of following the open format documented at agentskills.io. ADR-0003 makes this explicit.
- **Turn-scoped `model:` field is the right tool when capability matters empirically.** Prose model prescriptions remain forbidden (friction, unenforceable). The `model:` field is enforceable, turn-scoped (doesn't touch user's session), and is the Claude Code extension designed for exactly this case. See `feedback_no_model_recommendation.md` refinement.
- **Sonnet 4.6 > Opus 4.7 on this task.** Empirically, Sonnet found 8 critical issues vs Opus's 6 (including a unique architectural bug) and is cheaper. Counter-intuitive but supported by the 2026-05-27 test data. v1.0.3 locks to Sonnet 4.6 explicitly.

**Process learning:**
- **Don't extend an open PR with new behaviour-change commits without explicit alignment.** I started v1.0.3 work on the v1.0.2 doc-sync branch, then PR #3 was squash-merged while my v1.0.3 push was in flight — the v1.0.3 commit was orphaned on the feature branch and had to be cherry-picked onto a new branch (`feat/pocket-mentor-v1.0.3-model-lock`) and opened as PR #4. Result: clean separation, but added churn. Future: behaviour-change commits go to a fresh branch from master, doc fixes can live alongside if scope is identical.
- **Stale GitHub references are visible even after merge.** PR #3 title was updated mid-flight to claim "v1.0.3" then restored to v1.0.2 after the merge — historical record now points to the right scope.

**State of skills:**
- `pocket-mentor` — **v1.0.3, stable**, locked to Sonnet 4.6 for invocations.

**Watch-items for v1.0.4+** (recorded in `feature_list.json` `next`):
1. Rubric-violation-as-Critical severity escalation — v1.0.2 fun-chat had magic numbers → 🔴. Defer Severity-levels clarification until a 2nd observation on a project where the rubric violation is the only failing class.
2. Opus 4.7 tendency to place findings only in the Score table without a standalone Mode A finding (observed in v1.0.3 5-model test: routing absence went into Score but not into the Critical issues section on Opus, while Sonnet surfaced it correctly). If pattern persists across 2+ further Opus runs, tighten Strict rules to require a standalone Mode A finding for every non-zero Score-table deduction.

**Next:**
- ~~Post-merge verification~~ — ✓ verified by user 2026-05-27 by running `/pocket-mentor` on a real student project; Sonnet 4.6 turn-scoped lock works end-to-end.
- ~~Student-reviewer GitHub Actions project~~ — ✓ completed 2026-05-28, see entry below.
- ~~Optional cleanup~~ — ✓ user cleaned merged branches via GitHub UI 2026-05-27; only `feature/pocket-mentor-v0.9-spec` remains as an intentional archive of the pre-pivot engine+CLI design.

**Blockers:** none

---

## 2026-05-28 — student-reviewer v1.0.0

**Done:**
- `feat/student-reviewer` branch created; all 9 plan tasks completed.
- `.github/actions/student-reviewer/` — composite GitHub Action (action.yml, review.mjs, package.json, package-lock.json, .gitignore).
- `review.mjs` — stack detection, reference loading, AI call (GitHub Models default + any OpenAI-compatible override), Octokit PR diff fetch + inline comment posting.
- `templates/workflows/student-review.yml` — student copies this once, zero API key setup required.
- `sync-references.sh` extended with student-reviewer second target (conditional on directory existence).
- README with quick start + optional provider override instructions.
- Root `.gitignore` fixed: removed global `package-lock.json` ignore (was blocking action scaffold commit).
- `feature_list.json` updated with student-reviewer v1.0.0 entry.

**Decisions:**
- GitHub Models as default (uses GITHUB_TOKEN automatically — zero friction for students).
- No approval gate — runs automatically on PR open/synchronize.
- Angular: exits 0 silently (no review posted, no error).
- Finding format matches pocket-mentor Mode A (What / Why bad / How to fix) for consistency.
- Multi-agent architecture deferred — single-pass first; reconsider if silent reference skips or finding displacement appear in real test runs (per open question in Task 5 of the plan).

**Next:**
- End-to-end test: add `student-review.yml` to a real student repo, open a PR with a deliberate issue, verify inline comments post correctly.
- Merge `feat/student-reviewer` → master via PR.
- v1.1: React sub-rules (react-hooks.md, react-testing.md, react-patterns.md).

**Blockers:** none

---

## 2026-05-28 — student-reviewer v1.1 + Prompting 101 prompt rewrite

**Done:**
- `student-reviewer` PR #5 merged. Full end-to-end test on fun-chat student repo revealed issues:
  - 401 GitHub Models → fixed: added `models: read` permission to workflow template.
  - 413 request too large → fixed: `GITHUB_MODELS_MAX_CHARS = 12000` truncation (GitHub Models only; custom providers send full diff).
  - 400 Anthropic prefill rejected → removed `{ role: 'assistant', content: '{' }` from messages.
  - Wrong stack detection (monorepo) → fixed: subdirectory `package.json` search + diff-based fallback.
  - AI outputting reasoning as text → fixed: "Work through these steps internally... Do NOT output your reasoning".
  - `max_tokens: 2048` truncated JSON → increased to 8192.
  - 422 wrong file paths → fixed: `extractPaths(diff)` + pass path list in user message + 422 fallback to general body.
  - Comments only on linter config → diff was 185k chars, truncated at 6000. Fixed: truncation only for GitHub Models; custom providers get full diff.
- SYSTEM_PROMPT fully rewritten using Prompting 101 framework (XML tags, internal reasoning steps, confidence guard, educational mentor tone).
- v1.1: `fetchTaskRequirements()` — reads RS School task README URL from PR description, fetches raw content, passes as `<task_requirements>` to AI. AI uses CHECK REQUIREMENTS step to surface missing features as 🔴 Critical. Graceful fallback when URL absent or fetch fails.
- `feature_list.json` bumped to v1.1.0.
- `docs/test-reviews/` added to `.gitignore`.

**Decisions:**
- Task URL pattern: `rolling-scopes-school/tasks` GitHub URLs only (narrowly scoped to avoid false positives).
- Truncation at 20 000 chars for task requirements (most README files are < 5k).
- Prompting 101 framework: role / context / curriculum / task_requirements / steps / constraints / output_format / reminder.

**Next:**
- Trigger a new action run with a PR that has a task URL in the description and verify 🔴 Critical findings for missing requirements appear.
- v1.2: make task URL pattern configurable (not hardcoded to RS School) for broader adoption.

**Blockers:** none

---
