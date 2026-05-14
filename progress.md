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
