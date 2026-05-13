# Pocket Mentor v0.9-alpha — Implementation Spec

> **Status:** locked, 2026-05-13.
> **Scope:** v0.9-alpha. 28-day sprint to demo for the RS School AI club call (Dima/Andrey).
> **Background:** strategic / product context in [CONTEXT.md](./CONTEXT.md). Outreach materials in [outreach/](./outreach/).
> **Paid web composer:** deferred indefinitely. v0.9 is open-source only.

This document is the canonical entry point for any Claude Code session resuming work on Pocket Mentor v0.9-alpha. Read it after `AGENTS.md`, before touching code.

---

## 1. Goal

Ship a working demo of:

```
pocket-mentor review <pr-url> --rubric async-race --as-draft
```

that fetches the `async-race` rubric directly from `rolling-scopes-school/tasks`, runs mech-checkers + LLM analysis on the student PR diff, and posts the result as a GitHub PR review in `PENDING` (draft) state. The mentor then curates in GitHub's native review UI and submits.

**Definition of done for v0.9-alpha:**

- [ ] CLI installable: `pnpm install -g @pocket-mentor/cli` (workspace publish optional, local link OK for demo)
- [ ] Engine reads `async-race` rubric markdown from school repo (pinned to commit SHA via enrichment YAML)
- [ ] Engine emits output conforming to schema in CONTEXT.md §"Engine output (structured)"
- [ ] CLI posts result as GitHub draft review (`event: PENDING`), prints draft review URL
- [ ] Smoke-tested end-to-end on 1–2 historical async-race PRs from Helga's prior cohorts
- [ ] `mentor-resources` repo tagged `v0.9-alpha`, README updated with usage + install
- [ ] Demo runnable in front of Dima/Andrey in ≤ 5 minutes

---

## 2. Out of scope for v0.9

The 28-day sprint deliberately excludes work that doesn't move the demo forward:

- **Other rubrics** — migration, puzzle, fun-chat, code-review meta-task, decision-making-tool. Architecture must support them; only `async-race` is implemented.
- **`packages/skill`** — Claude Code skill packaging deferred to v1.0.
- **Web composer / SaaS** — deferred indefinitely.
- **Broad calibration** — only 1–2 historical PRs smoke-tested. Full calibration is v1.0 work after Dima/Andrey feedback.
- **Functional / runtime testing of the student's app** — out of scope for entire MVP. Pocket Mentor does **Mentor Review only** (static analysis of non-functional code quality: architecture, types, configs, conventions). It does **not** run the student's code or check whether features work. That track (RS School's "Cross-Check") needs headless-browser infra and is a separate product. See CONTEXT.md §"Cross-Check vs Mentor Review" for the school's terminology.

If a task feels in-scope but isn't on the M0–M6 list in §9, it is out of scope. Resist scope creep: every off-list hour pushes the demo past the cohort window.

---

## 3. Architecture

```
mentor-resources/                          # existing repo, extended
├── packages/                              # NEW — pnpm workspace
│   ├── engine/                            # library, all business logic
│   │   ├── src/
│   │   │   ├── rubric/                    # RubricFetcher, RubricParser
│   │   │   ├── enrichment/                # EnrichmentLoader (Zod-validated)
│   │   │   ├── pr/                        # PRFetcher (Octokit)
│   │   │   ├── checkers/                  # MechChecker registry
│   │   │   ├── llm/                       # LLMOrchestrator (Claude API)
│   │   │   ├── aggregate/                 # Aggregator -> Output schema
│   │   │   ├── deliver/                   # GitHubDeliverer (draft review)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/                               # bin: pocket-mentor
│       ├── src/index.ts                   # arg parsing, dispatches to engine
│       ├── package.json
│       └── tsconfig.json
├── rubrics/                               # NEW
│   └── async-race.enrichment.yaml         # method/checker/prompt mapping per criterion
├── docs/pocket-mentor/                    # this directory
│   ├── CONTEXT.md
│   ├── SPEC.md                            # this file
│   ├── SESSION-HANDOFF.md                 # session continuity template
│   └── outreach/letter-to-dima-andrey-draft.md
├── AGENTS.md                              # NEW — harness routing layer
├── feature_list.json                      # NEW — M0..M6 state tracker
├── progress.md                            # NEW — session log
├── init.sh                                # NEW — pnpm install + lint + typecheck
└── [existing: clean-code/, templates/, README.md, eslint.config.js, tsconfig.json, ...]
```

**Principles:**

- Engine is pure business logic. Side-effects (HTTP, filesystem, GitHub API) are accessed through interfaces injected at the entry point. No `fetch()` deep inside a parser.
- CLI is a thin wrapper: parse argv, build dependencies, call engine, render output. Zero business logic in `packages/cli`.
- Rubrics are not vendored. The engine fetches school markdown at runtime, pinned to a commit SHA declared in `<rubric>.enrichment.yaml`.

---

## 4. Modules (engine)

| Module | Location | Responsibility |
|---|---|---|
| `RubricFetcher` | `engine/src/rubric/fetcher.ts` | HTTP GET `rolling-scopes-school/tasks/<path>` at pinned SHA. Cache to `~/.pocket-mentor/cache/<sha>/<path>`. |
| `RubricParser` | `engine/src/rubric/parser.ts` | Convert raw school markdown → typed `Criterion[]`. Uses LLM (not regex) for format tolerance. |
| `EnrichmentLoader` | `engine/src/enrichment/loader.ts` | Load `rubrics/<id>.enrichment.yaml`. Validate via Zod. Returns `{ source_commit, criteria: Map<criterion_id, { method, checker_id?, llm_focus? }> }`. |
| `PRFetcher` | `engine/src/pr/fetcher.ts` | Octokit: `pulls.get`, `pulls.listFiles`. Returns `{ diff, files[], base_sha, head_sha, repo, number }`. |
| `MechChecker` | `engine/src/checkers/registry.ts` + `checkers/<id>.ts` | Registry of pure functions `(prContext, criterion) => Violation[]`. Examples: `react-imports`, `any-usage`, `eslint-config-presence`. |
| `LLMOrchestrator` | `engine/src/llm/orchestrator.ts` | Compose prompt: criterion text + diff slice + enrichment `llm_focus`. Call Claude API. Validate JSON output via Zod. |
| `Aggregator` | `engine/src/aggregate/aggregator.ts` | Merge mech + llm violations → final `Output` schema (CONTEXT.md §"Engine output"). Computes score, breakdown. Applies full-category penalties (e.g. async-race's `-100% for React` zeros the non-functional total). |
| `GitHubDeliverer` | `engine/src/deliver/github.ts` | Octokit: `pulls.createReview` with `event: PENDING`, `comments: [...]`. Returns draft review URL. |

**Cross-cutting:**

- `engine/src/types.ts` — shared types (`Criterion`, `Violation`, `Output`, ...). Single source for both engine and CLI.
- `engine/src/schemas.ts` — Zod schemas. Engine boundaries validate runtime data (school markdown LLM output, enrichment YAML, LLM responses).

---

## 5. Data Flow

```
1. CLI parses argv:
     pocket-mentor review <pr-url> --rubric async-race --as-draft

2. CLI resolves auth:
     gh auth token  ||  GITHUB_TOKEN  ||  ~/.pocket-mentor/token

3. CLI builds engine dependencies (HTTP client, GitHub client, LLM client)
   and calls engine.review(prUrl, rubricId, deliveryMode).

4. EnrichmentLoader.load("async-race")
     → { source_commit: <sha>, criteria: Map<...>, ... }

5. RubricFetcher.fetch(source_commit, "stage2/tasks/async-race/non-functional-requirements.md")
     → raw markdown (from cache or HTTP)

6. RubricParser.parse(markdown)
     → Criterion[]  (typed: { id, title, points_max, penalty?, text, ... })

7. PRFetcher.fetch(prUrl)
     → PRContext { diff, files[], base_sha, head_sha, ... }

8. For each criterion (parallel where safe):
     - method = "mech"
         → MechChecker.run(checker_id, prContext, criterion) → Violation[]
     - method = "llm"
         → LLMOrchestrator.review(criterion, prContext, llm_focus) → Violation[]
     - method = "hybrid"
         → mech first; LLM enriches each mech violation with rationale + judgement

9. Aggregator.aggregate(violations[])
     → Output { comments[], summary { body, score, breakdown }, rubric }

10. Delivery:
     - --as-draft   → GitHubDeliverer.createDraftReview(prUrl, output) → URL → stdout
     - --output json     → write Output as JSON to stdout
     - --output markdown → render Output as markdown to stdout
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

## 9. Calendar — 28 days

Assumes Monday start, ~5 h/day, AI agents (Claude Code) doing the typing.

| Day | Milestone | Notes |
|---|---|---|
| 1 | M0 — repo setup | Create `packages/`, update `pnpm-workspace.yaml`, write `AGENTS.md` / `init.sh` / `feature_list.json` / `progress.md`. Engine package skeleton. |
| 2 | M0 finish | CLI package skeleton, types/schemas scaffolds, eslint override for engine (no react plugins). `init.sh` green. |
| 3–4 | M1 — RubricFetcher + EnrichmentLoader | Zod schemas, HTTP cache, error types. Code review at end of M1. |
| 5–6 | M1 — RubricParser | LLM-based markdown → Criterion[]. Test against actual `async-race/non-functional-requirements.md`. |
| 7 | M1 — PRFetcher | Octokit wrapping. Auth cascade. Code review at end of M1. |
| 8–9 | M2 — async-race enrichment YAML | **Helga's expertise bottleneck.** Classify all criteria of async-race rubric: mech / llm / hybrid. Define mech `checker_id` and llm `focus` per criterion. |
| 10–13 | M3 — Mech-checkers | Implement registry + checkers for async-race. Likely 8–12 checkers (react-imports, any-usage, eslint-presence, husky-presence, etc.). |
| 14 | M3 finish + milestone review | `/requesting-code-review` → subagent → `/receiving-code-review`. Apply fixes. |
| 15–17 | M4 — LLMOrchestrator | Prompt composition, Claude API client, Zod validation of output, retry logic. |
| 18 | M4 — Aggregator | Merge mech + llm violations. Score arithmetic. Output schema serialization. |
| 19 | M4 milestone review | Full review pipeline. |
| 20–22 | M5 — GitHubDeliverer | Octokit draft review, edge cases (multi-line comments, side: LEFT, empty review handling). |
| 23 | M5 — CLI polish | Final arg parsing, error formatting, help text. |
| 24 | M5 milestone review | Code review of full delivery pipeline. |
| 25 | M5 — smoke test setup | Create `pocket-mentor-test-fixtures` repo with 2–3 historical async-race PRs (anonymized if needed). |
| 26 | M5 — smoke test execution | Run engine against fixtures. Fix anything broken. |
| 27 | M6 — README + tag | Update `mentor-resources/README.md` with v0.9 usage. Tag `v0.9-alpha`. |
| 28 | M6 — demo rehearsal | Run end-to-end on a real historical PR. Record demo if useful. Send letter to Dima/Andrey. |

Slack: 0 days. Any slip eats into M5 buffer.

---

## 10. Per-milestone scope

### M0 — Monorepo setup + tooling

- Update `pnpm-workspace.yaml` with `packages: ['packages/*']`
- Create `packages/engine/`, `packages/cli/` with `package.json`, `tsconfig.json` (extend root config)
- Add eslint override for `packages/engine/**` and `packages/cli/**` removing react-specific rules (engine is Node-only)
- Write `AGENTS.md`, `feature_list.json`, `progress.md`, `init.sh` (+ `chmod +x`)
- Verify `./init.sh` exits 0

**Out of M0:** any business logic. Pure scaffolding only.

### M1 — Engine core

- `RubricFetcher` with on-disk cache
- `EnrichmentLoader` with Zod validation
- `RubricParser` (LLM-driven)
- `PRFetcher` (Octokit)
- Shared types in `engine/src/types.ts`, Zod schemas in `engine/src/schemas.ts`

**Out of M1:** mech checkers, LLM review orchestration, delivery. Just I/O + parsing.

### M2 — async-race enrichment YAML

- Read `rolling-scopes-school/tasks/stage2/tasks/async-race/non-functional-requirements.md` at a chosen pinned SHA
- For each criterion in that file, decide method (`mech` / `llm` / `hybrid`)
- For `mech`: name the `checker_id` (need not exist yet — informs M3)
- For `llm` / `hybrid`: write the `llm_focus` text (1–3 sentences guiding the LLM)
- Output single `rubrics/async-race.enrichment.yaml`

**This is the Helga-expertise bottleneck.** Engine code is ~zero. Output is one well-thought YAML file.

### M3 — Mech-checkers for async-race

- Implement registry: each checker is `(prContext, criterion) => Violation[]`
- Implement each `checker_id` referenced from M2 enrichment
- Likely set (subject to M2 decisions): `react-imports`, `any-usage`, `eslint-config-presence`, `husky-presence`, `prettier-config-presence`, `tsconfig-strict`, `function-length`, `forbidden-deps`

### M4 — LLM orchestrator + aggregator

- Prompt composer: takes criterion + diff slice + `llm_focus` + few-shot examples
- Claude API client (with retries, Zod validation of output)
- Aggregator: merges violations from mech + llm, produces final `Output`
- Score arithmetic: sum points_delta, clip per breakdown, total

### M5 — GitHub draft delivery + CLI

- `GitHubDeliverer.createDraftReview(prContext, output)` → URL
- Handle GitHub API edge cases (multi-line comments require `start_line` + `start_side`)
- CLI command `pocket-mentor review <pr-url> --rubric <id> --as-draft|--output json|--output markdown`
- Error formatting at CLI layer (engine throws typed errors; CLI prints friendly messages)
- Smoke against `pocket-mentor-test-fixtures`

### M6 — Polish + tag

- README usage section
- Update `feature_list.json` to all-completed
- `git tag v0.9-alpha`
- Demo rehearsal on a real historical PR
- (Helga) send letter to Dima/Andrey

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

---

## 12. Open / deferred items

- **`pocket-mentor-test-fixtures` private repo** — needs creation before M5 day 25. Owner: Helga. Should contain 2–3 anonymized historical async-race PRs.
- **Pinned school SHA for M2** — `rolling-scopes-school/tasks` is a **public** repo, no access setup needed. But the engine must fetch rubric markdown from a *specific commit*, not from a moving `master` (otherwise reviews silently break when the school edits the file). Action at start of M2 (≤ 5 min):
  1. Open https://github.com/rolling-scopes-school/tasks/commits/master
  2. Verify the current `stage2/tasks/async-race/non-functional-requirements.md` looks correct
  3. Copy the latest commit SHA
  4. Write it into `rubrics/async-race.enrichment.yaml` as `source_commit: <sha>`

  Engine is then pinned to that version. When the school later updates the rubric, `pocket-mentor rubrics check-updates` (future subcommand, post-v0.9) surfaces the diff so Helga can decide whether to bump.
- **Penalty mechanism in Output schema** — full-category penalties (e.g. "-100% for React") need a representation. Candidates: a special `Violation.penalty_kind: "zero-category" | "fixed"` field, or a top-level `Output.applied_penalties[]`. Decide in M4 when Aggregator is implemented.
- **LLM model choice** — default to `claude-opus-4-7` for review quality; allow override via env. To be decided in M4.
- **License** — MIT vs. Apache-2.0 for `mentor-resources`. Probably MIT (consistent with most of Helga's repos). Confirm before M6 tag.
- **Anthropic API key handling** — read from env (`ANTHROPIC_API_KEY`). No support for OpenAI in v0.9. Document in README.
- **Telemetry** — none in v0.9. Don't add it. Privacy + simplicity.

---

## 13. References

- [CONTEXT.md](./CONTEXT.md) — full product context, glossary, validation signals, prior art, open-core history
- [outreach/letter-to-dima-andrey-draft.md](./outreach/letter-to-dima-andrey-draft.md) — letter and anatomy
- [Engine output schema (locked)](./CONTEXT.md#output-format--delivery)
- [Rubric architecture (locked)](./CONTEXT.md#rubric-architecture--two-layers-school-as-source-of-truth)
- Global CLAUDE.md (`~/.claude/CLAUDE.md`) — code style, response style, decision-making rules
- harness-creator skill (`~/.claude/skills/harness-creator/`) — five-subsystem framework
