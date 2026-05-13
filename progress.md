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
