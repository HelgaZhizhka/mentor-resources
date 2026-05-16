# Pocket Mentor v0.9 — Implementation Spec

> **Status:** UNDER REVISION (2026-05-16). Architecture aligned with [architecture-pivot-ru.md](./architecture-pivot-ru.md).
> **Original scope (2026-05-13):** v0.9-alpha, single-rubric demo on async-race.
> **Current scope (2026-05-16):** v0.9, production-usable on multiple courses via four-layer rubric composition + separate public rubrics repo. No fixed timeline.
> **Background:** strategic / product context in [CONTEXT.md](./CONTEXT.md).
> **Paid web composer:** deferred indefinitely. v0.9 is open-source only.

This document is the canonical entry point for any Claude Code session resuming work on Pocket Mentor v0.9. Read it after `AGENTS.md`, before touching code.

**What changed vs original spec (2026-05-13):**
- **Four-layer rubric composition** replaces single-rubric-per-task model. Active rubric = `common-review` + explicit stack via `--stack <id>` (or `default_stack` from overrides) + (optional `--task <id>`) + mentor overrides.
- **Combined YAML format** replaces two-layer (markdown + enrichment) — one file contains both criterion text and check configuration.
- **Rubrics move from `rubrics/` in this repo to separate public `pocket-mentor-rubrics` repo.** Open contribution model. CLI supports `--rubrics-source <git-url>` for alternative sources.
- **`RubricParser` (LLM-driven markdown → criteria) deferred.** Bootstrap workflow `pocket-mentor rubrics generate` is post-v0.9 — initial rubrics authored manually by initiator with LLM assistance during planning.
- **Stack is explicit, not auto-detected.** Mentor passes `--stack <id>` per invocation, or sets `default_stack: <id>` in `~/.pocket-mentor/overrides.yaml`. No `StackDetector`, no `applies_when` field, no `package.json` inspection for stack selection. Auto-detect was tempting but fails on Next.js / Remix / Astro / monorepo cases — explicit is simpler and more predictable.
- **Penalty handling** required for layer-3 task rubrics (e.g. Stage 2 deadline miss, no cross-check).
- **Timeline removed** — original 28-day sprint deprecated. Milestones remain as ordered scope, not dated.
- **Stage 2 + Mentor Review** focus retained from original; **React-course flat rubric** added as supported pattern (layers 1+2 only, no `--task` flag).

Sections below have been aligned with the four-layer architecture. Sections marked **[SUPERSEDED]** are kept for history but no longer authoritative.

---

## 1. Goal **[REVISED]**

Ship a CLI that mentors can use to review student PRs on **multiple active courses** (not a single demo task). The active rubric is composed at review time from up to four layers:

```
pocket-mentor review <pr-url> --stack react --as-draft                    # flat: common + react
pocket-mentor review <pr-url> --stack react --task <id> --as-draft        # adds layer 3: per-task rubric
pocket-mentor review <pr-url> --as-draft                                   # common-only (no stack arg, no default_stack)
pocket-mentor review <pr-url> --stack react --level senior --as-draft     # full output, expert tone
```

Composition order: `common-review.yaml` (always) + stack rubric from `--stack` or `default_stack` in overrides (e.g. `react.yaml`) + optional task rubric (e.g. `stage2/async-race.yaml`) + local mentor overrides (`~/.pocket-mentor/overrides.yaml`). Engine reads layers from the local clone of the rubrics repo, merges them, runs mech-checkers + LLM analysis on the student PR diff, and posts the result as a GitHub PR review in `PENDING` (draft) state. The mentor curates in GitHub's native review UI and submits.

**Definition of done for v0.9:**

- [ ] CLI installable: `npm install -g pocket-mentor-cli` (or runnable via `npx`)
- [ ] `pocket-mentor init` wizard sets up: GitHub token, LLM API key, clones rubrics repo to `~/.pocket-mentor/rubrics/`, creates empty `overrides.yaml`
- [ ] Engine reads rubric YAMLs from local clone (no runtime markdown parsing)
- [ ] CLI flag `--stack <id>` validates against available rubric IDs in the rubrics repo; missing/unknown stack prints available options and exits non-zero. If neither `--stack` nor `default_stack` (from overrides) is set, common-only review runs with a one-line notice in CLI output.
- [ ] Layer composition implemented: criteria merging by ID, override semantics, penalty handling for layer 3
- [ ] **Starter rubric set** in `pocket-mentor-rubrics`: `common-review.yaml`, `react.yaml`, `stage2/async-race.yaml`, `_template.yaml`, `CONTRIBUTING.md`
- [ ] Engine emits output conforming to schema in CONTEXT.md §"Engine output (structured)"
- [ ] CLI posts result as GitHub draft review (`event: PENDING`), prints draft review URL
- [ ] CLI flag `--rubrics-source <git-url>` works (alternative source for layers 1–3)
- [ ] CLI flag `--level junior|standard|senior` works (default `junior`); filters violations by severity, adjusts LLM-comment tone and length
- [ ] `default_stack` field in `~/.pocket-mentor/overrides.yaml` honored when `--stack` is omitted
- [ ] CLI flag `--language ru|en` works (default `en`); controls language of LLM-generated comments and summary
- [ ] Comment caps (`max_per_criterion`, `max_per_file`, `max_total` in `common-review.yaml`'s `review_limits`) respected by Aggregator
- [ ] Review body opens with summary of top-3 highest-impact violations
- [ ] Review body includes `rubrics_version` footer: commit SHA of rubrics repo + list of applied layer rubric IDs (audit trail for reproducibility)
- [ ] `GitHubDeliverer` falls back to body's "Additional notes" section when a violation's line is outside the PR diff (instead of failing 422)
- [ ] Smoke-tested on at least 1 historical PR for both modes (flat = React-course; with `--task` = Stage 2 async-race)
- [ ] `mentor-resources` repo tagged `v0.9`, README updated with usage + install
- [ ] `pocket-mentor-rubrics` repo public, README documents the layer model and contribution flow

---

## 2. Out of scope for v0.9 **[REVISED]**

The v0.9 release deliberately excludes:

- **`packages/skill`** — Claude Code skill packaging deferred to v1.0.
- **Web composer / SaaS** — deferred indefinitely.
- **`pocket-mentor rubrics generate <markdown-url>`** — LLM-driven README → YAML scaffold. Deferred until real demand from second author. v0.9 rubrics authored manually with LLM assistance in planning.
- **Multiple parallel rubrics sources** — `--rubrics-source` accepts ONE source URL at a time (replaces default). Multi-source merge is v1.0+.
- **JSON Schema CI for rubric PRs** — informal review by maintainer in v0.9. Formal schema validation when contribution volume grows.
- **Additional stack rubrics beyond React** — `react.yaml` shipped in baseline; `angular.yaml` + `vue.yaml` etc. added as courses adopt the tool. Stack is selected explicitly via `--stack` flag.
- **Broad calibration** — minimum smoke-test per rubric only. Full calibration is v1.0 work after mentor feedback.
- **Functional / runtime testing of the student's app** — out of scope for entire MVP. Pocket Mentor does **Mentor Review only** (static analysis of non-functional code quality: architecture, types, configs, conventions). It does **not** run the student's code or check whether features work. That track (RS School's "Cross-Check") needs headless-browser infra and is a separate product. See CONTEXT.md §"Cross-Check vs Mentor Review" for the school's terminology.
- **Auto-pull of rubrics** — `pocket-mentor rubrics sync` is explicit, not automatic. Mentor controls update cadence.
- **Rubric authoring UI** — authors edit YAML in their text editor. UI for rubric editing is paid-tier feature.
- **TANDI integration** — Pocket Mentor is autonomous in v0.9. Any integration with the new RS School course-management system is a separate conversation.

If a task feels in-scope but isn't on the milestone list in §10, it is out of scope. Resist scope creep.

---

## 3. Architecture **[REVISED]**

**Two repos:**

```
mentor-resources/                          # this repo — engine + CLI + curated material
├── packages/
│   ├── engine/                            # library, all business logic
│   │   ├── src/
│   │   │   ├── rubric/                    # RubricLoader (reads combined YAML from local clone)
│   │   │   ├── composer/                  # NEW — RubricComposer (merges layers 1–4)
│   │   │   ├── pr/                        # PRFetcher (Octokit)
│   │   │   ├── checkers/                  # MechChecker registry
│   │   │   ├── llm/                       # LLMOrchestrator (Claude API / OpenRouter)
│   │   │   ├── aggregate/                 # Aggregator → Output schema
│   │   │   ├── deliver/                   # GitHubDeliverer (draft review)
│   │   │   ├── types.ts
│   │   │   ├── schemas.ts                 # Zod schemas (combined YAML, output)
│   │   │   └── index.ts
│   │   └── package.json / tsconfig.json
│   └── cli/                               # bin: pocket-mentor
│       └── src/index.ts                   # arg parsing, dispatches to engine
├── docs/pocket-mentor/                    # planning + spec
├── clean-code/, templates/                # existing — referenced from rubrics
├── AGENTS.md, feature_list.json, progress.md, init.sh
└── ...

pocket-mentor-rubrics/                     # SEPARATE PUBLIC REPO — all rubric YAMLs
├── README.md
├── CONTRIBUTING.md
├── _template.yaml
├── common-review.yaml                     # layer 1
├── react.yaml                             # layer 2
└── stage2/                                # layer 3 (task rubrics)
    └── async-race.yaml
```

**Local at mentor's machine:**

```
~/.pocket-mentor/
├── token                                  # GitHub PAT (fallback to gh/env)
├── rubrics/                               # clone of pocket-mentor-rubrics
└── overrides.yaml                         # layer 4 — mentor personal customisation
```

**Principles:**

- Engine is pure business logic. Side-effects (HTTP, filesystem, GitHub API) are accessed through interfaces injected at the entry point. No `fetch()` deep inside a parser.
- CLI is a thin wrapper: parse argv, build dependencies, call engine, render output. Zero business logic in `packages/cli`.
- Rubrics are external. The engine reads combined YAML from a local clone of `pocket-mentor-rubrics` (or a `--rubrics-source` alternative). No HTTP per review for rubric content.
- Stack selection is explicit (mentor passes `--stack <id>` or sets `default_stack` in overrides). No `applies_when` matching, no `StackDetector`, no `package.json` inspection for the purpose of choosing stack. Student's `package.json` is still fetched for mech-checkers that legitimately need it (dependency presence, version checks, etc.).

---

## 4. Modules (engine) **[REVISED]**

| Module | Location | Responsibility |
|---|---|---|
| `RubricLoader` | `engine/src/rubric/loader.ts` | Read combined YAML files from local clone (or `--rubrics-source` directory). Validate via Zod. Returns `Rubric { rubric_id, criteria, penalties?, ... }`. List available stack rubric IDs (for `--stack` validation in CLI). **Note:** existing `RubricFetcher` + `EnrichmentLoader` are superseded — replaced by this loader on the new combined format. |
| `RubricComposer` | `engine/src/composer/composer.ts` | Merge layers in order: common (layer 1) → stack rubric from `--stack`/`default_stack` (layer 2, may be absent) → optional task rubric (layer 3 if `--task`) → mentor overrides (layer 4). Resolution: higher layer overrides matching criterion IDs; `disable` in overrides removes; `additional_criteria` in overrides adds. Returns final composed `Rubric`. |
| `PRFetcher` | `engine/src/pr/fetcher.ts` | Octokit: `pulls.get`, `pulls.listFiles`. Returns `{ diff, files[], base_sha, head_sha, repo, number }`. `package.json` of student is fetched on-demand by mech-checkers that need it (e.g. dependency-presence checker), not as part of standard PR context. |
| `MechChecker` | `engine/src/checkers/registry.ts` + `checkers/<id>.ts` | Registry of pure functions `(prContext, criterion) => Violation[]`. Generic & parametrised via `checker_config`. Existing eight checkers from M3 are kept and reused under the new format. |
| `LLMOrchestrator` | `engine/src/llm/orchestrator.ts` | Compose prompt: criterion text + diff slice + `llm_focus` + level-specific template (junior/standard/senior — controls tone, length, example requirement). Call Claude/OpenRouter via Vercel AI SDK. Validate JSON output via Zod. Generate review-body summary picking top-3 highest-impact violations. |
| `Aggregator` | `engine/src/aggregate/aggregator.ts` | Merge mech + llm violations → final `Output` schema (CONTEXT.md §"Engine output"). Computes score, breakdown. Filters violations by `--level` (severity threshold). Enforces `review_limits` caps (max per criterion / per file / total) — overflow becomes a single summary comment "+N similar". Applies layer-3 penalties (deadline miss, missing cross-check, etc.). |
| `GitHubDeliverer` | `engine/src/deliver/github.ts` | Octokit: `pulls.createReview` with `event: PENDING`, `comments: [...]`. Returns draft review URL. **Inline-vs-body fallback:** for each violation, attempt an inline comment if its line is present in the PR diff (compute set of `(file, line)` positions from `pulls.listFiles`); otherwise push the violation into a body section "Additional notes (outside diff)" with `file:line` reference. Stamps a `rubrics_version` footer into the review body: rubrics-repo commit SHA + list of applied layer rubric IDs. |

**Cross-cutting:**

- `engine/src/types.ts` — shared types (`Criterion`, `Penalty`, `Violation`, `Output`, `Rubric`, ...). Single source for both engine and CLI.
- `engine/src/schemas.ts` — Zod schemas for the combined YAML format and the engine's output. Engine boundaries validate runtime data (rubric YAMLs, student `package.json`, LLM responses).

---

## 5. Data Flow **[REVISED]**

```
1. CLI parses argv:
     pocket-mentor review <pr-url> --as-draft [--stack <id>] [--task <id>] [--rubrics-source <url>] [--language ru|en] [--level junior|standard|senior]

2. CLI resolves auth:
     gh auth token  ||  GITHUB_TOKEN  ||  ~/.pocket-mentor/token

3. CLI loads overrides (`~/.pocket-mentor/overrides.yaml`) early — needed to resolve `default_stack`, `language`, `level` when CLI flags are omitted.

4. CLI resolves effective stack:
     --stack <id>  ||  overrides.default_stack  ||  null (common-only)
   Validates against available stack rubric IDs from RubricLoader.listStacks(); on mismatch prints available options and exits non-zero.

5. CLI builds engine dependencies (HTTP client, GitHub client, LLM client, rubrics dir)
   and calls engine.review({ prUrl, stack?, task?, rubricsSource?, language, level, deliveryMode }).

6. PRFetcher.fetch(prUrl)
     → PRContext { diff, files[], base_sha, head_sha, repo, number }

7. RubricLoader.loadCommon() → Rubric (layer 1)

8. If stack != null:
     RubricLoader.loadStack(stack) → Rubric (layer 2)

9. If --task <id>:
     RubricLoader.loadTask(id) → Rubric (layer 3, may include `penalty` block)

10. RubricLoader.loadOverrides("~/.pocket-mentor/overrides.yaml") → Rubric (layer 4, may be empty)

11. RubricComposer.compose([layer1, layer2?, layer3?, layer4])
      → Rubric  (final composed rubric: criteria merged, IDs deduplicated,
                 disabled criteria removed, additional criteria appended,
                 penalties carried through)

12. For each criterion in composed rubric (parallel where safe):
      - method = "mech"
          → MechChecker.run(checker_id, prContext, criterion) → Violation[]
      - method = "llm"
          → LLMOrchestrator.review(criterion, prContext, llm_focus) → Violation[]
      - method = "hybrid"
          → mech first; LLM enriches each mech violation with rationale + judgement

13. For each penalty in composed rubric (layer 3 typically):
      - if method = "mech" → run checker, apply points_delta if violated
      - if method = "llm"  → judge, apply points_delta if violated

14. Aggregator.aggregate(violations[], penalties[])
      → Output { comments[], summary { body, score, breakdown }, rubric }

15. Delivery:
      --as-draft        → GitHubDeliverer.createDraftReview(prUrl, output) → URL → stdout
      --output json     → write Output as JSON to stdout
      --output markdown → render Output as markdown to stdout
```

---

## 6. Error Handling

Fail closed at boundaries. Trust internal calls. No defensive validation for invariants the type system already enforces.

| Failure | Behavior |
|---|---|
| School repo / SHA 404 | `RubricFetchError` with the URL attempted. Suggest `--cache-only` (future). |
| Enrichment YAML missing | `EnrichmentNotFoundError` listing available rubric IDs in `rubrics/`. |
| Enrichment Zod validation fail | `EnrichmentInvalidError` with diff against expected schema. |
| LLM API timeout / 429 | Retry 3× exponential backoff (1s / 4s / 16s). Then `LLMError` with `request_id`. |
| LLM JSON output fails Zod | Retry once with stricter prompt. Then `LLMOutputInvalidError`. |
| Mech checker throws | Catch, log warning, treat criterion as `no violations`. **Do not fail the whole review.** |
| GitHub 401/403/404 | `GitHubAuthError`. Suggest `gh auth status`. |
| GitHub rate limit | Respect `X-RateLimit-Reset`. If hit during a single review, fail with retry-after time. |
| PR has no diff (empty / draft) | Return `Output` with empty comments and a summary explaining nothing to review. Not an error. |

---

## 7. Verification

Per global CLAUDE.md ("Do not add tests unless asked"), v0.9 has **no unit test suite**. Verification is layered, automated, and runs on every diff.

| Layer | Tool | Trigger |
|---|---|---|
| Types | `pnpm exec tsc --noEmit` (strict, existing config) | `init.sh` and pre-commit |
| Style | `pnpm lint` (existing ESLint) | `init.sh` and pre-commit |
| Logic | `feature-dev:code-reviewer` subagent on the diff | Before every commit |
| Cross-feature consistency | `/requesting-code-review` → reviewer subagent → `/receiving-code-review` | At milestone boundary (end of M1, M3, M4, M5) |
| End-to-end (M5+ only) | Smoke against `HelgaZhizhka/pocket-mentor-test-fixtures` (private repo, 2–3 synthetic PRs) | Before claiming M5 done |

**Definition of done per feature (for `feature_list.json` evidence):**

1. `pnpm exec tsc --noEmit` passes
2. `pnpm lint` passes
3. `feature-dev:code-reviewer` reviewed, every flagged issue triaged (fixed or push-back recorded)
4. For M5: smoke test against fixtures passed (URL of created draft review in evidence)
5. `feature_list.json` and `progress.md` updated, then commit

---

## 8. Harness Layer

Built per the `harness-creator` skill's five-subsystem framework. Lives at `mentor-resources` repo root (governs all agent work in the repo, not just Pocket Mentor).

| Subsystem | File | Purpose |
|---|---|---|
| Instructions | `AGENTS.md` | Routing layer: startup workflow, working rules, DoD. Links to SPEC.md for detail. ≤ 100 lines. |
| State | `feature_list.json` | M0–M6 features with `status`, `dependencies`, `evidence`. Updated at end of each feature. |
| State (continuity) | `progress.md` | Session log: what was done, what's next, blockers, decisions. Updated at session end. |
| Verification | `init.sh` | `pnpm install && pnpm lint && pnpm exec tsc --noEmit`. Runs at session start. |
| Scope | (in `AGENTS.md`) | "One in-progress feature at a time." DoD checklist. |
| Lifecycle | `init.sh` + `docs/pocket-mentor/SESSION-HANDOFF.md` template | Session bootstrap + handoff procedure. |

**Why repo-root, not packages/-scoped:** `mentor-resources` will house other agent-driven work later (Helga's existing prompt evolution, future rubrics, future skills). A repo-wide harness makes that uniform.

---

## 9. Calendar **[SUPERSEDED]**

The original 28-day single-rubric calendar is no longer authoritative. Milestone scope (next section) is the source of truth. Timeline is open — set as work progresses, not fixed up front. See `feature_list.json` for current per-milestone state.

---

## 10. Per-milestone scope **[REVISED]**

**M0–M3 are complete** under the original architecture. Their outputs (pnpm workspace, types/schemas, eight generic mech-checkers with registry) are reused under the new architecture. The new format migration is part of M4 below.

### M0 — Monorepo setup + tooling ✅ done

Repo scaffolding (`packages/`, eslint override, harness files, `init.sh`). No business logic.

### M1 — Engine core ✅ done (will be refactored in M4)

Original outputs: `RubricFetcher` (HTTP + cache), `EnrichmentLoader` (Zod-validated `.enrichment.yaml`), `PRFetcher` (Octokit). Built for the old two-layer format. **Superseded by `RubricLoader` in M4** — the HTTP/cache mechanism and Zod-validation patterns are reused, but the format (combined YAML, single-source local clone) is different.

### M2 — Enrichment YAML for async-race ✅ done (output to be re-expressed in M4)

Original output: `rubrics/async-race.enrichment.yaml`. **Will be re-authored as `pocket-mentor-rubrics/stage2/async-race.yaml` in combined-YAML format in M4-bootstrap.**

### M3 — Generic mech-checkers ✅ done

Eight generic, parametrised mech-checkers with registry pattern. Reusable as-is under the new architecture — `checker_id` + `checker_config` references in the new combined YAML format will resolve to the same checker functions.

### M4 — Format migration + layer composition + LLM orchestrator

Three streams:

**M4a — Format migration:**
- Create public `pocket-mentor-rubrics` repo (separate from this one)
- Define combined-YAML Zod schema (criteria + check config in one file, with optional `penalty` block for task rubrics)
- Implement `RubricLoader` (replaces `RubricFetcher` + `EnrichmentLoader`)
- Author starter rubrics: `common-review.yaml`, `react.yaml`, `stage2/async-race.yaml`, `_template.yaml`
- Add `CONTRIBUTING.md` to rubrics repo

**M4b — Layer composition:**
- `--stack <id>` CLI flag — explicit stack selection. Validated against available stack rubric IDs (`RubricLoader.listStacks()`). On unknown value: list options and exit non-zero. No `--stack` and no `default_stack` → common-only review (with one-line CLI notice).
- `default_stack` field in `~/.pocket-mentor/overrides.yaml` — persistent fallback when `--stack` is omitted. Lets a mentor on one course type once and forget.
- `RubricComposer` — merges layers 1+2+3+4 with override / disable / additional_criteria semantics
- Mentor overrides format + loader (`~/.pocket-mentor/overrides.yaml`) — fields: `default_stack?`, `language?`, `level?`, `max_llm_tokens?`, `disable[]`, `additional_criteria{}`, `modify{}`

**M4c — LLM orchestrator + aggregator + output calibration:**
- Prompt composer: takes composed criterion + diff slice + `llm_focus` + level-specific template (junior/standard/senior) + language template (ru/en); structural shape — ≤3 sentences, mandatory before/after example, no jargon
- Vercel AI SDK client (Claude default, OpenRouter fallback) with retries, Zod validation
- **Optional LLM token cap:** mentor can set `max_llm_tokens` in `~/.pocket-mentor/overrides.yaml`. When set, aggregator skips remaining `method: llm` criteria once the cap is reached, marks them `skipped_over_budget` in body footer. Not silent truncation. No product-level default cap — mentor brings own API key and decides.
- **Large-PR chunking:** when PR has > 20 changed files OR diff > 4000 lines, `LLMOrchestrator` processes criteria per-file batches (each batch ≤ 10 files) instead of full diff per call. Reliability decision (context-window pressure), not a cost decision. Mech-only criteria unaffected. Thresholds tunable in `common-review.yaml`.
- Aggregator: merges violations from mech + llm; filters by `--level` (severity threshold); enforces `review_limits` caps with "+N similar" summary on overflow; applies layer-3 penalties; produces `Output` schema
- Summary generator: picks top-3 highest-impact violations for the review body header
- CLI flag `--level=junior|standard|senior` plumbed end-to-end (default `junior`)
- CLI flag `--language=ru|en` plumbed end-to-end (default `en`). Maps to language template in prompt composer. Same flag may also be set persistently via `~/.pocket-mentor/overrides.yaml` field `language`.

### M5 — GitHub draft delivery + CLI

- `GitHubDeliverer.createDraftReview(prContext, output)` → URL
- Handle GitHub API edge cases (multi-line comments require `start_line` + `start_side`)
- **Inline-vs-body fallback:** compute set of diff positions from `pulls.listFiles`; for each violation try inline, on miss push into body section "Additional notes (outside diff)" with `file:line` reference. Avoids 422 errors for repo-wide findings (tsconfig, missing .gitignore, etc.).
- **Reproducibility footer:** review body ends with `rubrics_version: <commit-sha>` and a list of applied layer rubric IDs + their hashes. Lets mentors (and CI) verify which rubric set produced this draft.
- **Mentor feedback channel print:** after a successful draft, CLI prints a one-liner pointing to the project's GitHub Discussion thread / issue tracker for reporting bad comments. URL is configurable in `~/.pocket-mentor/overrides.yaml` (`feedback_url`), defaults to upstream `mentor-resources` Discussion.
- **Local history log:** every draft is mirrored to `~/.pocket-mentor/history/<repo>-<pr-number>.json` (the full `Output` we generated). Local-only, not transmitted. Lets mentor manually share specific draft if asked.
- CLI commands:
  - `pocket-mentor init` — wizard: GitHub token, LLM key, clone rubrics repo, create empty overrides
  - `pocket-mentor review <pr-url> [--task <id>] [--rubrics-source <url>] --as-draft|--output json|--output markdown`
  - `pocket-mentor rubrics sync` — explicit pull from rubrics repo
  - `pocket-mentor overrides edit` — open `~/.pocket-mentor/overrides.yaml` in `$EDITOR`
- Error formatting at CLI layer (engine throws typed errors; CLI prints friendly messages)
- Smoke against `pocket-mentor-test-fixtures` — at least 1 PR for flat mode (React) + 1 PR for `--task=async-race`

### M6 — Polish + tag

- README usage section (both modes: flat + `--task`)
- `pocket-mentor-rubrics` README documenting layer model, contribution workflow, template
- Update `feature_list.json` to all-completed
- `git tag v0.9` on `mentor-resources`; `git tag v0.9-baseline` on `pocket-mentor-rubrics`
- Demo rehearsal on a real historical PR (both modes)
- (Initiator) share with Dima for feedback

---

## 11. Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-05-13 | Variant A timeline: 28-day to v0.9-alpha, not 5-6 week v1.0 | Helga prioritized speed-of-demo for Dima/Andrey over breadth |
| 2026-05-13 | Async-race is the pilot rubric | Most structured of stage 2 (190 pts non-functional). Engine architecture obvious from it. |
| 2026-05-13 | Pnpm monorepo extending existing `mentor-resources` | Existing repo has TS strict + ESLint + workspace plumbing already |
| 2026-05-13 | School repo is source of truth for rubrics | Helga's anti-duplication principle. Engine fetches at runtime. |
| 2026-05-13 | RubricParser is LLM-driven, not regex | School markdown formats vary; LLM tolerates better |
| 2026-05-13 | Drop paid web composer from v0.9 entirely | Helga explicit: focus on open-source only |
| 2026-05-13 | Mentor-PAT auth via `gh auth token` cascade | Zero infra, no bot account, comments appear from mentor |
| 2026-05-13 | GitHub draft PR review (`event: PENDING`) is the curation surface | Built into GitHub, no custom UI needed |
| 2026-05-13 | Per-feature review = `feature-dev:code-reviewer` subagent; milestone review = subagent wrapped in `/requesting-code-review` + `/receiving-code-review` skills | Balance discipline vs. per-task overhead |
| 2026-05-13 | No tests except M5 smoke against private fixtures repo | Per CLAUDE.md "no tests unless asked"; smoke catches GitHub API edge cases |
| 2026-05-13 | Repo-wide harness (AGENTS.md at root), not per-package | `mentor-resources` will host more agent work; uniform harness |
| 2026-05-13 | No custom `.claude/agents/code-reviewer.md` | Built-in subagent reads project CLAUDE.md; no wrapper needed |
| 2026-05-14 | LLM clients use Vercel AI SDK (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/openai`) instead of direct provider SDKs | Single interface for all providers — adding Groq/Gemini/Mistral is one import line. `LLMClient` interface preserved for testability. Built-in `maxRetries` replaces custom retry module. |
| 2026-05-14 | OpenRouter via `@ai-sdk/openai` with custom `baseURL: openrouter.ai/api/v1` | No dedicated `@openrouter/ai-sdk-provider` needed; OpenRouter is OpenAI-compatible; slash model strings like `anthropic/claude-sonnet-4.5` work verbatim. |
| 2026-05-14 | LLM model selectable via `ANTHROPIC_MODEL` / `OPENROUTER_MODEL` env vars | Per SPEC §12 "allow override via env". No recompile needed to switch models at runtime. |
| 2026-05-15 | Combined YAML format (criteria + check config in one file) | Removes runtime markdown parsing; eliminates ID drift between two layers; lets authors edit criterion text without touching upstream school file. |
| 2026-05-15 | Rubrics move to separate public repo `pocket-mentor-rubrics` | Decouples rubric updates from engine releases. Adding a rubric = one PR, no engine rebuild. |
| 2026-05-16 | Four-layer composition (common + stack + task + overrides) | One model covers both flat-rubric courses (React: layers 1+2) and per-task courses (Stage 2: layers 1+2+3). Layer 3 is opt-in via `--task`. |
| 2026-05-16 | Open authoring model, public rubrics repo from day 1 | Removes single-author bottleneck. Initiator authors baseline; further rubrics via PR. No `from-readme` / multi-source infra until real demand. |
| 2026-05-16 | `--rubrics-source <git-url>` CLI flag for alternative source | Lets teams/courses point CLI at their own rubrics repo. Minimum decentralisation with near-zero implementation cost (RubricFetcher already parameterised by repo). |
| 2026-05-16 | Stage 2 included in v0.9 via layer 3 (not deferred to v1.0) | Async-race was the original starting use-case; deferring it would be regression. Layer 3 adds trivial complexity to the same composition model. |
| 2026-05-16 | Original 28-day calendar deprecated; no fixed timeline | Scope shifted to multi-course usability; timeline reset to "set as work progresses, not up front". |
| 2026-05-16 | Output calibration via `severity` + `--level` + `review_limits` + structural comment template + summary-first body | Strict rubric + linter will find more violations than a human flags. Without calibration, a beginner PR gets 40+ inline comments and the student demotivates. Calibration moves triage explicitly into the pipeline (LLMs don't triage well on their own). Default level `junior` because most course students are beginners. |
| 2026-05-16 | Dropped stack auto-detection entirely; stack is explicit via `--stack <id>` or persisted as `default_stack` in `overrides.yaml` | Initial plan had `applies_when` matching against `package.json`. Real-world cases (Next.js / Remix / Astro / monorepo / workspace deps / transitive deps) all break that. Rather than band-aid via `--stack` override-flag, removed the whole class: no `StackDetector`, no `applies_when` field, no `package.json` inspection for stack choice. Simpler code, more predictable behavior, mentor sets default once. |
| 2026-05-16 | Added `--language ru\|en` CLI flag (default `en`); persistable via overrides | Generated comments need a deliberate language choice. RS School courses are bilingual; mentors should pick per-mentor language, not per-CLI-restart. Comments do not mix languages within one review. |
| 2026-05-16 | Added `rubrics_version` footer in draft body + commit-SHA of rubrics repo + applied layer IDs | Without it, re-running a review after `git pull` in rubrics-repo silently changes results. Footer gives an audit trail and reproducibility without needing semver yet. |
| 2026-05-16 | Inline-vs-body fallback in `GitHubDeliverer` instead of separate `ReviewAnchor` module | GitHub API rejects inline comments on lines outside the PR diff. Findings about `tsconfig.json` / missing `.gitignore` / repo-wide issues need a home. Method on the deliverer is simpler than introducing an abstraction; pure-summary mode kept as fallback config flag. |
| 2026-05-16 | LLM cost is informational (README docs typical per-model usage); cap is opt-in per mentor (`max_llm_tokens` in `overrides.yaml`); per-file batching for large PRs (>20 files OR >4000 diff lines) is reliability, not cost | Mentors bring own API key + choose own model; product shouldn't impose a budget. README gives numbers so mentor can decide. Batching exists to keep within context windows on big PRs, not to save money. Cap is opt-in for mentors who want a safety net. |
| 2026-05-16 | Mentor feedback via three local-only mechanisms (history log, CLI-printed feedback URL, private pilot channel); no telemetry | Privacy-by-default still stands. We need signal, but signal must stay opt-in and mentor-controlled. `pocket-mentor reflect <pr-url>` (draft vs published diff) deferred to v1.0 — same local-only model. |

---

## 12. Open / deferred items

- **`pocket-mentor-test-fixtures` private repo** — needs creation before M5 day 25. Owner: Helga. Should contain 2–3 anonymized historical async-race PRs.
- **Drift detection from upstream sources** — when a rubric criterion references an upstream RS School document (e.g. `pull-request-review-process.md`, task READMEs), the YAML may carry an optional `source: { url, commit_sha }`. Post-v0.9 subcommand `pocket-mentor rubrics check-drift` surfaces diffs between pinned and current upstream. v0.9: no drift checking, rubrics are pinned at authorship time.
- **Penalty mechanism in Output schema** — layer-3 penalties (e.g. Stage 2 deadline miss `-25`, no cross-check `-15`) need a representation. Already partially specified in `types.ts` (`Penalty`, `PenaltyKind`). To finalise in M4c when Aggregator is implemented: top-level `Output.applied_penalties[]` vs `Violation.penalty_kind` on a synthetic violation.
- **Override semantics edge cases** — what if mentor `overrides.yaml` disables a criterion that is part of a hybrid (mech + llm) pair? Spec: disable the criterion entirely (both mech and llm parts). What if overrides override a `points_max`? Spec: allowed, overriding wins. Validate at load time with clear error if structurally invalid.
- **LLM model choice** — default to `claude-opus-4-7` for review quality; allow override via env. To be decided in M4.
- **LLM cost — informational only** — each mentor uses their own API key and chooses their own model. Project does not impose a budget. README will document typical per-review token usage on common models (e.g. Opus vs Haiku vs OpenRouter mid-tier) so mentor can estimate. Mentor opts into a hard cap by setting `max_llm_tokens` in `~/.pocket-mentor/overrides.yaml`; on overflow remaining LLM criteria are skipped with `skipped_over_budget` marker. No default cap.
- **Large-PR chunking** — reliability decision (not cost): for PRs > 20 changed files OR > 4000 diff lines, LLM calls run per-file batches (≤10 files each) to keep within context windows. Thresholds tunable in `common-review.yaml`.
- **Language of generated comments** — default `en`. Mentor sets per-invocation via `--language=ru|en` or persistently via `language: ru` in `~/.pocket-mentor/overrides.yaml`. Prompt composer carries a small language-specific template (tone register + pronouns). Comments do not mix languages within one review.
- **License** — MIT vs. Apache-2.0 for `mentor-resources`. Probably MIT (consistent with most of Helga's repos). Confirm before M6 tag.
- **Anthropic API key handling** — read from env (`ANTHROPIC_API_KEY`). No support for OpenAI in v0.9. Document in README.
- **Telemetry** — none in v0.9. Don't add it. Privacy + simplicity.
- **Mentor feedback collection** — three local-only mechanisms in v0.9: (1) every draft is mirrored to `~/.pocket-mentor/history/<repo>-<pr-number>.json`; (2) CLI prints a feedback-channel URL after each draft (GitHub Discussion in `mentor-resources`); (3) pilot mentors invited to a private channel (Telegram / GitHub Discussion) for direct reports. Post-v0.9: `pocket-mentor reflect <pr-url>` command will diff the historical draft against the published review to surface accepted-vs-deleted comments — also local-only, opt-in share.
- **Reproducibility / rubrics versioning** — every draft review body ends with a `rubrics_version` footer carrying the commit SHA of the rubrics repo and the list of applied layer rubric IDs. Lets a mentor re-run with the same SHA and get identical scope. Full semver for rubrics is v1.0 work.
- **GitHub diff-position constraint** — inline comments may only target lines present in the PR diff. `GitHubDeliverer` handles overflow (repo-wide findings like `tsconfig.json` issues) by pushing into a body section "Additional notes (outside diff)". No separate `ReviewAnchor` module — fallback is a method on the deliverer. Pure-summary mode (no inline at all) is a config option for early calibration but defaults off.

---

## 13. References

- [CONTEXT.md](./CONTEXT.md) — full product context, glossary, validation signals, prior art, open-core history
- [outreach/letter-to-dima-andrey-draft.md](./outreach/letter-to-dima-andrey-draft.md) — letter and anatomy
- [Engine output schema (locked)](./CONTEXT.md#output-format--delivery)
- [Rubric architecture — four-layer composition (locked)](./CONTEXT.md#rubric-architecture--four-layer-composition-combined-yaml-separate-repo)
- [architecture-pivot-ru.md](./architecture-pivot-ru.md) — Russian-language presentation of the four-layer plan for Dima
- Global CLAUDE.md (`~/.claude/CLAUDE.md`) — code style, response style, decision-making rules
- harness-creator skill (`~/.claude/skills/harness-creator/`) — five-subsystem framework
