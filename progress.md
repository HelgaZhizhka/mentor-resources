# Pocket Mentor v0.9-alpha — Session Progress Log

Each session appends a new entry at the bottom. Newer entries below.

---

## Session 1 — 2026-05-13 — Spec migration & harness scaffolding

**Done this session:**
- Migrated `CONTEXT.md` and `outreach/letter-to-dima-andrey-draft.md` from the `pocket-mentor` scratch directory into `docs/pocket-mentor/`
- Wrote canonical implementation spec `docs/pocket-mentor/SPEC.md` (13 sections, ~370 lines)
- Spec self-review pass — clarified penalty mechanism, pinned-SHA action steps, cross-check phrasing; removed multi-mentor scope item
- Created harness files at repo root: `AGENTS.md`, `feature_list.json`, `progress.md` (this file), `init.sh`
- Created `docs/pocket-mentor/SESSION-HANDOFF.md` template
- Branch: `feature/pocket-mentor-v0.9-spec`

**Next session should:**
- Open in `~/Projects/mentor-resources` (not the `pocket-mentor` scratch dir)
- Run `./init.sh` — verify green
- Read `AGENTS.md` → `docs/pocket-mentor/SPEC.md` → `feature_list.json` → `progress.md` (this file)
- M0 is `in-progress`; invoke `/writing-plans` to break M0 into specific tasks
- Then start implementing M0: update `pnpm-workspace.yaml`, scaffold `packages/engine` and `packages/cli`, add ESLint override

**Decisions this session (durable):**
- Variant A timeline: 28-day to v0.9-alpha, not 5-6 week v1.0
- Async-race is the pilot rubric (most structured of stage 2, 190 pts non-functional)
- Pnpm monorepo extending existing `mentor-resources` (TS strict + ESLint + workspace plumbing already in place)
- School repo is source of truth for rubrics — engine fetches at runtime, pinned to commit SHA in enrichment YAML
- RubricParser is LLM-driven (not regex) for tolerance to school markdown format variations
- Mentor-PAT auth via `gh auth token` cascade; comments appear from mentor's account
- GitHub draft PR review (`event: PENDING`) is the curation surface — no custom UI needed
- Per-feature review = `feature-dev:code-reviewer` subagent only; milestone review = same subagent wrapped in `/requesting-code-review` + `/receiving-code-review` skills
- No tests except M5 smoke against `HelgaZhizhka/pocket-mentor-test-fixtures` (per global CLAUDE.md)
- Repo-wide harness at root, not per-package (`mentor-resources` will host more agent work later)
- No custom `.claude/agents/code-reviewer.md` — built-in subagent reads project CLAUDE.md / AGENTS.md
- Paid web composer deferred indefinitely; v0.9 is open-source only

**Blockers / open items:**
- None blocking M0 start
- Helga to create `HelgaZhizhka/pocket-mentor-test-fixtures` private repo before M5 day 25
- Helga to choose pinned school commit SHA at start of M2 (~5-min task — see SPEC §12)
- License decision (MIT vs Apache-2.0) before M6 tag

**Files added / modified this session:**
- `AGENTS.md` (new)
- `feature_list.json` (new)
- `progress.md` (new, this file)
- `init.sh` (new)
- `docs/pocket-mentor/CONTEXT.md` (migrated)
- `docs/pocket-mentor/SPEC.md` (new)
- `docs/pocket-mentor/SESSION-HANDOFF.md` (new template)
- `docs/pocket-mentor/outreach/letter-to-dima-andrey-draft.md` (migrated)

---

## Session 3 — 2026-05-14 — M1: Engine core

**Done this session:**
- Updated M1 plan to include OpenRouter multi-provider support (Task 6 extended)
- Installed engine runtime deps: zod, js-yaml, @octokit/rest, @anthropic-ai/sdk, openai, @octokit/request-error, @types/js-yaml
- `errors.ts` — PocketMentorError hierarchy (8 typed error classes)
- `types.ts` — shared domain types (Criterion, Violation, PRContext, Enrichment, ...)
- `schemas.ts` — Zod schemas for enrichment YAML + LLM output (+ penaltySchema refine for kind=fixed)
- `http.ts` — HttpClient interface + fetchHttpClient (native fetch)
- `llm/client.ts` — LLMClient interface + AnthropicLLMClient + OpenRouterLLMClient
- `enrichment/loader.ts` — EnrichmentLoader (YAML + Zod validation)
- `rubric/fetcher.ts` — RubricFetcher (HTTP + disk cache at ~/.pocket-mentor/cache/)
- `rubric/parser.ts` — RubricParser (LLM-driven markdown → Criterion[])
- `pr/url.ts` — parsePRUrl helper
- `pr/fetcher.ts` — PRFetcher (Octokit: metadata + paginated files + raw diff)
- `index.ts` — public surface re-exports all of the above
- feature-dev:code-reviewer on full M1 diff; applied all 5 fixes

**Decisions this session (durable):**
- Migrated LLM clients to Vercel AI SDK (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/openai`) — replaces `@anthropic-ai/sdk` + `openai` + custom `retry.ts`. Adding any new provider is now one import line. See SPEC §11 decisions log.
- OpenRouter via `@ai-sdk/openai` with `baseURL: https://openrouter.ai/api/v1` (no dedicated OR package needed).
- OpenRouter support added to M1 (not deferred): `OpenRouterLLMClient` uses Vercel AI SDK's `@ai-sdk/openai`. CLI selects provider from env var (ANTHROPIC_API_KEY vs OPENROUTER_API_KEY) — wired in M5.
- OpenRouter default model: `anthropic/claude-sonnet-4.5` (dot separator, not hyphen)
- GitHub diff media type: `application/vnd.github.diff` (not the legacy v3 variant)
- `cachePathFor` in RubricFetcher guards against path traversal via `path.resolve` + startsWith check
- `penaltySchema` now enforces `kind=fixed → points required` via Zod refine
- `LLMOutputInvalidError` now accepts optional `cause` to preserve stack trace

**v1.0 ideas (out of scope for v0.9):**
- `pocket-mentor rubrics generate <task-name>` — CLI fetches rubric markdown, LLM drafts enrichment YAML, mentor reviews and saves. ~10 min per task vs writing from scratch.
- Community YAMLs via PRs — mentors contribute enrichment files for other RS School tasks (puzzle, fun-chat, migration, etc.), Helga reviews.
- Helga writes curated YAMLs for all ~6-8 existing stage2 tasks to ship with v1.0 package.

**Deferred fixes (address in M4 before LLMOrchestrator):**
- `llm/client.ts`: `LLMResponse.stopReason` typed as `string | null` but SDK never returns null — change to `string` or `FinishReason`
- `llm/client.ts`: `LLMError.requestId` always `undefined` after Vercel AI SDK migration — recover via `APICallError.responseHeaders?.['x-request-id']` from `@ai-sdk/provider`

**Next session should:**
- M2 is `in-progress`: write `rubrics/async-race.enrichment.yaml`
- M2 is the Helga-expertise bottleneck — engine code is ~zero, output is one well-thought YAML file
- Before starting: pin school commit SHA (open https://github.com/rolling-scopes-school/tasks/commits/master, copy latest SHA touching async-race non-functional-requirements.md)
- YAML schema to follow: `enrichmentFileSchema` in `packages/engine/src/schemas.ts`
- Per criterion: decide `method` (mech/llm/hybrid), set `checker_id` for mech, set `llm_focus` for llm/hybrid

**Blockers / open items:**
- None blocking M2
- Helga to create `HelgaZhizhka/pocket-mentor-test-fixtures` private repo before M5 day 25
- License decision (MIT vs Apache-2.0) before M6 tag
- `no-console` rule will conflict with CLI stdout printing in M5 — add CLI-specific eslint override then

**Files added / modified this session:**
- `docs/superpowers/plans/2026-05-13-M1-engine-core.md` (new — M1 plan, updated for OpenRouter)
- `packages/engine/package.json` (new deps)
- `packages/engine/src/errors.ts` (new)
- `packages/engine/src/types.ts` (new)
- `packages/engine/src/schemas.ts` (new)
- `packages/engine/src/http.ts` (new)
- `packages/engine/src/llm/client.ts` (new)
- `packages/engine/src/enrichment/loader.ts` (new)
- `packages/engine/src/rubric/fetcher.ts` (new)
- `packages/engine/src/rubric/parser.ts` (new)
- `packages/engine/src/pr/url.ts` (new)
- `packages/engine/src/pr/fetcher.ts` (new)
- `packages/engine/src/index.ts` (updated — full public surface)

---

## Session 2 — 2026-05-13 — M0: monorepo setup + tooling

**Done this session:**
- Wrote M0 implementation plan: `docs/superpowers/plans/2026-05-13-M0-monorepo-setup.md`
- Relocated student-facing `tsconfig.json` + `eslint.config.js` into `templates/configs/` (history preserved via `git mv`)
- Updated `templates/configs/README.md` explaining student-vs-project configs distinction
- Registered `packages/*` in `pnpm-workspace.yaml`
- Added `tsconfig.base.json` — shared Node-only strict compiler options (no DOM, no JSX)
- Scaffolded `packages/engine` (`@pocket-mentor/engine` 0.0.0) + `packages/cli` (`@pocket-mentor/cli` 0.0.0) with placeholder `src/index.ts`
- Added solution-style root `tsconfig.json` (files:[], references to packages)
- Added new root `eslint.config.js` — Node-only flat config (TS strict, unicorn, import order, prettier; no React/jsx-a11y; scoped to `packages/**/*.ts`)
- Pruned React-only devDeps from root `package.json`; added explicit `@eslint/js`
- Tracked `pnpm-lock.yaml` (removed from `.gitignore` — inherited student-template decision was wrong for monorepo)
- Updated `init.sh` to use `pnpm -r typecheck` instead of root `tsc --noEmit`
- Updated `LINTER-README.md` paths to `templates/configs/`
- `./init.sh` exits 0 end-to-end: install + lint + per-package typecheck
- Ran `feature-dev:code-reviewer` on full M0 diff; applied all triaged fixes

**Decisions this session (durable):**
- `pnpm-lock.yaml` is now tracked — reproducibility required for M5 smoke test and M6 demo
- Root `eslint.config.js` is Node-only; student-facing React config lives in `templates/configs/`
- Dropped `max-lines-per-function: 30`, `max-params: 3`, `no-magic-numbers` from engine lint rules (RS School student rules, too aggressive for Octokit/prompt wrangling)
- `complexity: warn 10` and `max-params: warn 4` instead of error — surfaces drift without blocking
- `noInlineConfig: true` in ESLint — team contract, documented in config header comment
- `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` removed from root devDeps (bundled by `typescript-eslint` meta-package)
- `.env` / `.env.*` added to `.gitignore` before M1 introduces GITHUB_TOKEN + ANTHROPIC_API_KEY

**Next session should:**
- Open in `~/Projects/mentor-resources` on branch `feature/pocket-mentor-v0.9-spec`
- Run `./init.sh` — verify green
- M1 is `in-progress`; invoke `/writing-plans` to break M1 into specific tasks
- M1 scope: `RubricFetcher` (HTTP + cache), `EnrichmentLoader` (Zod), `RubricParser` (LLM-driven), `PRFetcher` (Octokit), shared `types.ts` + `schemas.ts`
- Dependencies to install in M1: `zod`, `@octokit/rest`, `@anthropic-ai/sdk`, plus `@types/node` already in root

**Blockers / open items:**
- None blocking M1 start
- Helga to create `HelgaZhizhka/pocket-mentor-test-fixtures` private repo before M5 day 25
- Helga to choose pinned school commit SHA at start of M2 (~5-min task, see SPEC §12)
- License decision (MIT vs Apache-2.0) before M6 tag
- `no-console` rule will conflict with CLI stdout printing in M5 — add CLI-specific eslint override then

**Files added / modified this session:**
- `docs/superpowers/plans/2026-05-13-M0-monorepo-setup.md` (new — M0 plan)
- `templates/configs/tsconfig.json` (moved from root)
- `templates/configs/eslint.config.js` (moved from root)
- `templates/configs/README.md` (new)
- `pnpm-workspace.yaml` (added packages glob)
- `tsconfig.base.json` (new)
- `tsconfig.json` (new — solution stub)
- `eslint.config.js` (new — Node-only flat config)
- `packages/engine/package.json`, `tsconfig.json`, `src/index.ts` (new)
- `packages/cli/package.json`, `tsconfig.json`, `src/index.ts` (new)
- `package.json` (pruned React devDeps, new scripts)
- `pnpm-lock.yaml` (now tracked)
- `init.sh` (updated typecheck step)
- `LINTER-README.md` (updated paths)
- `AGENTS.md` (fixed DoD wording + tsconfig reference)
- `.gitignore` (removed pnpm-lock.yaml exclusion, added .env)

---

## Session 4 — 2026-05-15 — M3: parametrised mech-checkers

**Decisions:**
- Variant C: trust ESLint config for non-penalty rules (function length, code style) — only verify rule is configured in ESLint config. For penalty checks (forbidden-imports, typescript-any-usage) always AST-scan since students can use eslint-disable.
- `EnrichmentEntry.checkerConfig: Readonly<Record<string, unknown>>` — each checker validates its own config via Zod at call time.
- 8 generic parametrised checkers replace 9 earlier specific ones — adding a new rubric is YAML-only work.
- `function-length` → `eslint-rule-configured(max-lines-per-function)` — no AST scan, trust the lint config.
- `html-body-allowed-tags` fix: use `NodeType.ELEMENT_NODE` instead of tagName duck-typing.
- `repo-reader`: import `describeError` from errors.ts (dedup), guard PocketMentorError re-throw.

**Next session:** M4 = LLM orchestrator + aggregator (prompt composer, Vercel AI SDK call, Zod output validation, score aggregation).

---

## Session 5 — 2026-05-16 — Architectural pivot: four-layer rubric composition

**Done this session (planning/spec only — no code changes):**
- Wrote `docs/pocket-mentor/architecture-pivot-ru.md` — Russian-language plan finalised for sharing with Dima. Includes Mermaid flowchart of review pipeline, ASCII layer diagram, source-of-truth table for each layer, combined-YAML format example with `penalty` block, "не дублируем линтер" principle, two-role model (Mentor User / Rubric Author), open authorship model.
- Aligned `docs/pocket-mentor/CONTEXT.md` §"Rubric architecture" with the four-layer model (was: combined-YAML single-file-per-task; now: layered composition + opt-in task layer + `--rubrics-source` for alternative sources).
- Aligned `docs/pocket-mentor/SPEC.md` with the new architecture: §1 Goal, §2 Out of scope, §3 Architecture (two repos, layer diagram), §4 Modules (`RubricLoader` replaces `RubricFetcher` + `EnrichmentLoader`; added `StackDetector`, `RubricComposer`), §5 Data Flow (11-step layered pipeline), §10 Per-milestone scope (M4 split into M4a/M4b/M4c). Marked §9 Calendar as `[SUPERSEDED]` — no fixed timeline. Added decisions for 2026-05-15/16 to §11 log.
- Restructured `feature_list.json`: M0–M3 retain status `done` with `carryover_under_new_architecture` notes. M4 split into M4a (format migration + RubricLoader + starter rubrics in new repo), M4b (StackDetector + RubricComposer + overrides), M4c (LLM orchestrator + aggregator + penalty handling). M5 expanded (init wizard, `--task`, `--rubrics-source`, `rubrics sync`, `overrides edit`, dual-mode smoke test). M6 expanded (second repo's README + tag).

**Decisions this session (durable):**
- **Four-layer composition** (locked): common (always) + auto-detected stack + optional task (--task flag) + mentor overrides. Covers both flat-rubric courses (React: layers 1+2) and per-task courses (Stage 2: layers 1+2+3) in one model.
- **Combined YAML format** (re-confirmed): criteria + check config + optional `applies_when` + optional `penalty` in one file. Replaces legacy two-layer (markdown TZ + enrichment YAML) split.
- **Rubrics in separate public repo** `HelgaZhizhka/pocket-mentor-rubrics`. Open contribution from day 1. Initial baseline authored by Helga; further rubrics via PR. Maintainer model, not single-author.
- **`--rubrics-source <git-url>`** CLI flag — minimum decentralisation. Lets teams/courses point CLI at their own rubrics repo. Near-zero implementation cost (RubricFetcher already parameterised by repo).
- **Stage 2 included in v0.9** via layer 3. Starter task rubric is `stage2/async-race.yaml` — keeps the original async-race use-case viable. Other Stage 2 tasks added by Helga as needed; not all-or-nothing.
- **Sources of truth** are official + curated: RS School `pull-request-review-process.md` (Helga is author); RS School React tasks README; clean-code/* curated material; per-task READMEs. Не выдумываем критерии.
- **"Не дублируем линтер"** principle re-locked: layer 1 checks that ESLint is configured correctly (mech) and that lint passes (mech). It does NOT re-check rules ESLint enforces. LLM only for judgement work.
- **Author workflow for new YAMLs in v0.9:** Helga + LLM in planning chat (README → YAML draft → review → commit). Not a CLI command yet — `pocket-mentor rubrics generate` deferred until real demand from second author.
- **Multi-source, JSON Schema CI, `from-readme` command** — all deferred. Build infrastructure when demand appears, not before.
- **Original 28-day calendar** deprecated. Timeline open, scope-driven.
- **TANDI integration** out of v0.9. Pocket Mentor is autonomous.
- **Output calibration for student level** (new this session, late addition): `severity: error | warning | info` on each criterion (rubric author decides) + CLI flag `--level=junior | standard | senior` (mentor decides per student; default `junior`) + `review_limits` caps in `common-review.yaml` (`max_per_criterion`, `max_per_file`, `max_total`) + structural LLM-comment template (≤3 sentences, mandatory before/after example, no jargon, no external link unless via YAML `reference:`) + summary-first review body (top-3 highest-impact violations at the top). Rationale: a strict rubric + linter will find more violations than a human flags; without calibration, beginner students get 40+ comments and disengage. Calibration moves triage explicitly into the pipeline because LLMs don't triage well on their own. Implementation lands in M4c.

**Documents in final state for sharing with Dima:**
- `docs/pocket-mentor/architecture-pivot-ru.md` — self-contained, can be sent standalone.
- `docs/pocket-mentor/CONTEXT.md` — aligned (audience, differentiation, distribution model unchanged).
- `docs/pocket-mentor/SPEC.md` — aligned (architecture, modules, data flow, milestones updated).

**Next session should:**
- Decide go/no-go on starting M4a (creating `pocket-mentor-rubrics` repo) based on Dima's feedback on `architecture-pivot-ru.md`.
- If proceeding: invoke `/writing-plans` to break M4a into specific tasks (repo creation, combined-YAML Zod schema, RubricLoader implementation, three starter rubric files, _template.yaml + CONTRIBUTING.md).
- Re-author `rubrics/async-race.enrichment.yaml` (legacy) → `pocket-mentor-rubrics/stage2/async-race.yaml` (combined format) as part of M4a content lift.

**Blockers / open items:**
- Dima's feedback on `architecture-pivot-ru.md` (presentation pending).
- License decision (MIT vs Apache-2.0) for both repos before M6 tag.
- Helga to create `HelgaZhizhka/pocket-mentor-test-fixtures` private repo before M5 smoke test.
- Helga to create `HelgaZhizhka/pocket-mentor-rubrics` public repo at start of M4a.

**Files added / modified this session:**
- `docs/pocket-mentor/architecture-pivot-ru.md` (new — written and iteratively refined this session)
- `docs/pocket-mentor/CONTEXT.md` (updated §"What this product is" + §"Rubric architecture")
- `docs/pocket-mentor/SPEC.md` (updated §1, §2, §3, §4, §5, §9 marked superseded, §10, §11 decisions log, §12 open items, §13 references)
- `feature_list.json` (restructured: M4 → M4a/M4b/M4c, M5/M6 expanded, carryover notes on M0–M3)
- `progress.md` (this entry)

---

## Session 4 — 2026-05-16 — Post-review revisions to plan

Triggered by two external reviews (Opus and ChatGPT) of the v0.9 plan. Agreed corrections applied to `SPEC.md`, `architecture-pivot-ru.md`, `CONTEXT.md`, and `feature_list.json`.

**Decisions this session (durable):**
- **Dropped stack auto-detection.** Stack is explicit: `--stack <id>` CLI flag, or `default_stack` field in `~/.pocket-mentor/overrides.yaml`. No `StackDetector`, no `applies_when` field, no `package.json` inspection for stack selection. Reason: auto-detect breaks on Next.js / Remix / Astro / monorepo / workspace-deps / transitive-deps. Rather than band-aid with `--stack` override, removed the whole class. Code is simpler; behavior is more predictable.
- **Added `--language ru|en` flag** (default `en`); persistable via `overrides.yaml` (`language`). Comments don't mix languages in one review.
- **Added `rubrics_version` footer** to draft review body (commit SHA of rubrics repo + applied layer IDs). Audit trail for reproducibility; semver deferred to v1.0.
- **Inline-vs-body fallback in `GitHubDeliverer`** for findings whose line is outside the PR diff (e.g. `tsconfig.json` issues). Not a separate `ReviewAnchor` module — just a method on the deliverer.
- **LLM cost is informational, not policy.** Each mentor uses own API key + own model; project doesn't dictate budget. README will document typical per-review usage. Mentor opts into hard cap via `max_llm_tokens` in `overrides.yaml`; on overflow remaining LLM criteria are marked `skipped_over_budget`. No default cap.
- **Large-PR chunking is reliability** (context window), not cost. Per-file batches (≤10 files) for PRs > 20 changed files OR > 4000 diff lines.
- **Mentor feedback collection is local-only.** Three mechanisms: history log at `~/.pocket-mentor/history/<repo>-<pr-number>.json`, CLI prints feedback-channel URL after each draft, private pilot channel (Telegram / GitHub Discussion). `pocket-mentor reflect <pr-url>` (draft-vs-published diff) is v1.0 — also local-only. Telemetry remains explicitly off.

**Reviews considered:**
- Opus: most points landed. Validated rubric versioning, cost-budget gap, `applies_when` brittleness, localization. Disagreed: hybrid semantics is actually defined (SPEC §5 step 12).
- ChatGPT: ReviewAnchor / GitHub-position concern is real and now handled. Sandboxing concern is mooted (no code execution in scope). Repository IR / confidence scoring / telemetry were premature for v0.9 — recorded for v1.0 backlog.

**Files modified this session:**
- `docs/pocket-mentor/SPEC.md` — §1 DoD bullets, §3 architecture (removed `detector/`, principle reworded), §4 modules (`StackDetector` removed, `GitHubDeliverer` extended), §5 data flow (steps renumbered), §10 M4b reworded (explicit `--stack`, `default_stack`), §10 M4c (language flag, optional token cap, chunking framing), §10 M5 (inline/body fallback, rubrics_version footer, feedback channel print, history log), §11 decisions log (4 new entries: --stack flag, language, rubrics_version, inline-vs-body, cost reframe, stack auto-detect drop), §12 open items reframed.
- `docs/pocket-mentor/architecture-pivot-ru.md` — §1 summary reworded ("явно через --stack"), §2 layer diagram & flow updated, §5 CLI examples + new "additional flags" block, §6 YAML format (removed `applies_when`), §8 rewritten ("Указание стека" — explicit selection), §9 roadmap (4 new rows: language, rubrics_version footer, inline/body fallback, mentor feedback; cost reframe), §11 risks row updated, §12 "Что прошу подтвердить" extended (auto-detect drop noted in #1, added #7-#10).
- `docs/pocket-mentor/CONTEXT.md` — §"What this product is" reworded, layer diagram updated, "One combined YAML file contains" — removed `applies_when`, added explanation for explicit stack.
- `feature_list.json` — M4a description (no `applies_when`, RubricLoader.listStacks()), M4b renamed and rewritten (no StackDetector, explicit `--stack` validation, overrides field list expanded).

**Next session should:**
- Helga reviews the diff across these four docs and confirms.
- If approved → kick off M4a per the now-revised description (rubrics repo, combined YAML schema sans `applies_when`, RubricLoader with `listStacks()`).
- Helga to create `HelgaZhizhka/pocket-mentor-rubrics` public repo at start of M4a.

---

## Session 4 closing — 2026-05-18 — Dima feedback received, redesign triggered

**External event:** Dima Varabei (RS School product) responded to the plan via Telegram with structural pushback. Verbatim feedback captured in `docs/pocket-mentor/redesign-brief-2026-05-18.md` §1. Three signals: (1) UX too complex for a mentor-newbie, (2) school moving to synchronous review sessions (away from async PR review), (3) RS APP rebuild coordinated with Andrey, Pocket Mentor needs to fit into that.

**Decision:** Helga wants redesign **before** the call with Dima (Monday/Thursday morning), to come with a sharpened proposition rather than an unrevised plan. Existing work (current plan + repo creation + M0-M3 engine) remains as foundation; redesign tests how to repackage / refocus, not what to throw away.

**Created:** `docs/pocket-mentor/redesign-brief-2026-05-18.md` — input doc for next session. Contains:
- Dima's feedback verbatim (§1)
- Helga's initial instinct: skill-only v0.9 (§2)
- What stays as foundation, no matter the redesign (§3)
- Constraints for redesign (§4)
- Four hypotheses to brainstorm: H1 pure skill / H2 dual surface / H3 skill drives engine / H4 agent kit (§5)
- Pre-call deliverable: one-sentence framing + diagram + keep/drop/defer + 3 diagnostic questions (§6)
- Open questions for Dima (§7)

**Next session should:**
- Be a fresh session.
- Open with: «Прочитай `docs/pocket-mentor/redesign-brief-2026-05-18.md` целиком, потом запусти `superpowers:brainstorming` для тестирования четырёх гипотез из §5».
- Produce sharpened proposition for the Dima call. **Not** a SPEC rewrite — that's a follow-up session after the call validates direction.

**Files modified this entry:**
- `docs/pocket-mentor/redesign-brief-2026-05-18.md` (new)
- `progress.md` (this entry)
