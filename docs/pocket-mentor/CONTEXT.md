# Pocket Mentor — Domain Context

> Working name: **Pocket Mentor**. Status: pre-MVP. Decisions captured here are locked unless explicitly revisited. Earlier specs in `docs/superpowers/specs/` predate these decisions and are **superseded** — keep only as reference.

## What this product is

**AI co-pilot for frontend mentors reviewing student PRs.** A mentor passes a student PR URL (and optionally `--stack <id>` and `--task <id>`). The engine composes the active rubric from up to four layers (common + explicit stack + optional task + mentor overrides) and produces a **draft PR review** pre-loaded with inline comments, summary, and estimated score — created via the GitHub API in `PENDING` state. The mentor curates in GitHub's native review UI (toggle/edit/discard each comment), then clicks **Submit review**.

Combines mechanical checks (lint, deps, structure — ~60% of rubric) with LLM-driven analysis (architecture, naming, UX — ~20%) and hybrid checks (~20%).

It is NOT a mock-interview tool. It is NOT an LMS. It is NOT a student-facing product in MVP. It does not host learning materials.

## What this product is NOT

- **Not a live AI-interviewer.** No mock interviews, no voice, no Q&A simulation. (Considered and rejected — interview frequency is too low, AI-readiness too marginal, distribution non-viral.)
- **Not an LMS.** No hosted learning content. Learning material is commodity (MDN, javascript.info, freeCodeCamp). We link out, we don't reproduce.
- **Not RS School branded.** RS School is the founder's source of expertise and a beta audience, but the product is independent and works for students of any frontend course/bootcamp.
- **Not a generic code reviewer** (CodeRabbit, Copilot Review). Those review *production* code against *general* best practices. We review *educational* code against a *specific TZ's rubric*, with pedagogical tone.

## Glossary

### TZ (Техническое задание / Technical Specification)
The assignment document for a coding task. Contains functional requirements (what the app must do) and technical requirements (how it must be built — frameworks allowed/forbidden, code style, file structure). May include explicit point allocations per criterion (e.g. RS School format: `Login validation (+5)`, `-100% for using React`).

### Rubric
The scoring breakdown derived from a TZ. Each rubric item is one criterion with a point value and a check method. Two kinds of items:
- **Mechanical** — checkable by script. Examples: ESLint passes, no forbidden deps in `package.json`, function length ≤ 40 lines.
- **Subjective** — requires LLM judgment. Examples: architecture quality, UX feedback responsiveness, naming clarity.

### Submission
A student's attempt at a task. Consists of source code (eventually as a GitHub repo URL) plus a reference to which TZ it's solving. One TZ → many submissions across users.

### Review
The output the product produces for a submission. A structured scorecard following the TZ's rubric format, with:
- Per-criterion verdict (`✓` / `±` / `✗`) and points awarded
- Per-criterion explanation in pedagogical tone (why it's wrong, what's expected, link to reference)
- **Estimated** total score (suggestion, not authority — see "Score authority" below)
- Pattern-detection across criteria when relevant ("you're consistently weak on accessibility")

### Score authority — locked
The **mentor has final say** on the score. Engine output is always labelled as `estimated_score` / "AI suggestion." The score appears in the draft review's summary body where the mentor can edit it in GitHub's native UI before submitting. Engine never enforces or locks numbers. This is non-negotiable: the mentor is the human in the loop, the AI assists.

### Cross-Check vs Mentor Review
RS School-specific terminology with two distinct review tracks per task:
- **Cross-Check** = peer review of *functional* requirements (does the feature work?). Example: async-race functional = 215 pts. Requires runtime testing of the app — opening it in a browser, clicking through, verifying behaviour.
- **Mentor Review** = expert review of *non-functional* requirements (architecture, code quality, tooling, type safety). Example: async-race non-functional = 190 pts. Pure static analysis — no runtime needed.

**MVP scope = Mentor Review only.** Cross-check (functional) is out of scope until v2 — would require headless-browser testing infrastructure (a whole separate product). This narrowing is deliberate: it matches exactly the role RS School mentors are vacating in the 2026 transition.

### Rubric architecture — four-layer composition, combined YAML, separate repo

**Locked (revised 2026-05-16).** Final rubric is composed at review time from up to four layers, each a self-contained combined YAML file (criteria text + check config in one). Layers 1–3 live in a separate public git repo (`pocket-mentor-rubrics`); layer 4 is local to the mentor.

**Why four layers.** Different courses use different rubric paradigms:
- **Flat-rubric courses** (e.g. RS School React — 25 pts mentor review, same criteria for every task) → layers 1 + 2 only.
- **Per-task-rubric courses** (e.g. RS School Stage 2 — each task has its own criteria + points + penalties) → layers 1 + 2 + 3.
- Personal preferences of the mentor (disable criteria, add custom ones) → layer 4.

```
Layer 4: Mentor overrides       ~/.pocket-mentor/overrides.yaml         (local, optional)
Layer 3: Task rubric             pocket-mentor-rubrics/stage2/<id>.yaml  (opt-in via --task)
Layer 2: Stack rubric            pocket-mentor-rubrics/<stack>.yaml      (explicit via --stack or default_stack in overrides)
Layer 1: Common review           pocket-mentor-rubrics/common-review.yaml (always)
```

Composition order: layer 1 is the base; higher layers add criteria, override fields on matching IDs, or disable IDs from below.

**One combined YAML file contains:**
- `rubric_id`, `title`, `description` — metadata
- `criteria` — each with title, points_max, text (shown to student in PR comment), method (`mech` / `llm` / `hybrid`), and — for mech/hybrid — `checker_id` + `checker_config`; optional `llm_focus` for llm/hybrid
- `penalty` (typically for layer 3 task rubrics) — point deductions for violations (e.g. "deadline missed: -25", "no cross-check: -15")
- `reference` (optional) — link to upstream curriculum material

Stack rubrics are selected by `rubric_id` matching `--stack <id>` (or `default_stack` in overrides) — there is no `applies_when` field, no auto-detection from `package.json`. Auto-detect was considered and dropped: it fails on Next.js / Remix / Astro / monorepo / workspace-deps cases. Explicit selection is simpler and more predictable.

**Method types:**
- **Mechanical (`mech`)** — checkable by deterministic generic checker, configured via YAML. Examples: dependency present in `package.json`, ESLint rule configured, no forbidden imports, `any` usage scan. Two runs of the same input give the same output. Zero LLM tokens.
- **LLM (`llm`)** — requires judgement. Engine calls Claude/OpenRouter with criterion text + diff slice + `llm_focus` hint. Examples: architecture quality, naming clarity, separation of concerns.
- **Hybrid** — both run; violations merged. Example: component-line-count checker flags >300 LOC files, LLM judges whether they're truly god-components.

**Don't duplicate the linter principle.** Layer 1 checks that ESLint is correctly configured (mech) and that lint passes (mech). It does NOT re-check rules ESLint already enforces. LLM is reserved for judgement work ESLint cannot do.

**Output calibration for student level.** Each criterion declares `severity: error | warning | info` (already present in `ViolationSeverity`). The CLI flag `--level=junior | standard | senior` (default `junior`) filters by severity and adjusts the LLM-comment template's tone, length, and use of examples. Layer 1 `common-review.yaml` carries optional global `review_limits` (max comments per criterion / per file / total) so a single rule with 30 violations becomes "3 examples + summary of 27 more". The LLM-orchestrator enforces a structural comment template (≤3 sentences, mandatory "before/after" snippet, no jargon). The review body starts with a 3-point summary picked from highest-impact violations. Together these prevent overwhelming a beginner with 40 inline comments — which would defeat the pedagogical goal.

**Repository structure:**

```
pocket-mentor-rubrics/                       (separate public git repo)
├── README.md
├── CONTRIBUTING.md                          (how to add a rubric)
├── _template.yaml                           (scaffold for new authors)
├── common-review.yaml                       (layer 1: always applied)
├── react.yaml                               (layer 2: applied via --stack=react)
├── angular.yaml                             (layer 2: planned, --stack=angular)
└── stage2/                                  (layer 3: task rubrics)
    ├── async-race.yaml
    ├── rss-puzzle.yaml
    └── ...
```

Filename = `rubric_id` (with directory prefix for task rubrics, e.g. `stage2/async-race`). No index file — the directory itself is the catalog.

**Sources of truth (not invented):**
- Layer 1 `common-review.yaml` — official RS School `pull-request-review-process.md` + `clean-code/*` curated material + `TypeScript.md`/`HTML.md`/`CSS.md`/`UI-UX.md`.
- Layer 2 `react.yaml` — RS School `react/modules/tasks/README.md` (no props drilling, no god components, no direct DOM, tests pass) + `clean-code/React.md` + reference ESLint/TS configs.
- Layer 3 `stage2/<id>.yaml` — README of the specific task (criteria, exact point allocations, penalty rules).
- Layer 4 — mentor's personal experience.

**Distribution:**
- Authors commit combined YAML to `pocket-mentor-rubrics` via PR. Maintainer reviews and merges.
- Mentor-users get rubrics via `pocket-mentor init` (initial clone) and `pocket-mentor rubrics sync` (update).
- CLI reads rubrics from local clone at runtime — no HTTP per review.
- Alternative source: `--rubrics-source <git-url>` lets mentors/teams point CLI at a fork or a separate repo of rubrics.

**Open authoring model.** The rubrics repo is public from day 1. Initial baseline (common + react + stage2/async-race + template) is authored by the project initiator; further rubrics are open contributions via PR. Maintainer reviews, doesn't author everything. No infrastructure for `rubric from-readme` / multi-source / JSON Schema CI in v0.9 — added when real demand surfaces.

**Versioning:**
- Rubric repo uses git tags (e.g. `v1.0`, `v1.1`) for release coordination
- Per-rubric: optional `source.commit_sha` field for drift detection vs upstream markdown source
- CLI subcommand `pocket-mentor rubrics check-drift` surfaces diffs (post-v0.9)

**Why four layers (not one flat YAML per task):** the universe of criteria is multi-axial — universal (PR hygiene), stack-specific (React patterns), task-specific (async-race game logic), personal (mentor preference). Flattening into a single YAML per task means duplicating universal criteria across N task files; updating "PR formatting rules" then requires editing every rubric. Four-layer composition is DRY by construction. Layer 3 is opt-in so courses with flat rubrics (React-25) don't pay for unused complexity.

## Audience

**MVP user = the mentor**, not the student. Specifically: frontend bootcamp / course mentors who already do manual PR review against a known rubric. RS School mentors are the beachhead because:
- Founder is one of them (deep workflow knowledge)
- Founder authored the AI-agent section in school's official mentoring docs (legitimacy)
- School announced 2026 transition: mentor PR review moves to AI-assisted (timing)

Student-facing product is a **v2** consideration, not MVP scope. Mentor-as-user gives faster validation (one user can review 30 PRs/week → 30 unit-tests of the engine), higher willingness-to-pay, and direct distribution via founder's mentor network.

## Differentiation (vs. ChatGPT / CodeRabbit / Cursor)

The wedge is **packaging + calibration**, not raw review quality:

1. **Rubric-anchored output** — every review is scored against a known TZ rubric, not against generic best practices.
2. **Hybrid checks** — mechanical TZ requirements (lint configs, deps, file structure, husky setup) are run as scripts, not asked to LLMs. LLM is reserved for what only LLMs can do.
3. **Pedagogical tone** — explanations targeted at juniors, with examples from the user's actual code and links to curated docs.
4. **Persistence across submissions** — patterns surfaced across multiple reviews ("you keep missing X").
5. **Workflow integration** — "submit GitHub URL → review in 60 seconds" is the UX, not "paste 15 files into ChatGPT and pray."

ChatGPT can produce *one* review of comparable quality with 30 minutes of prompt engineering. It cannot produce *the same* output 100 times for 100 students at the same standard, structured to a specific course rubric, with mechanical checks executed.

## Validation signals

- **Founder is the author** of the AI-agent section in RS School's official mentoring docs (`pull-request-review-process.md`). The school's docs link to her personal repo `HelgaZhizhka/mentor-resources` as the recommended AI-review path.
- RS School's announced 2026 transition: code review becomes formal/automated, mentors move to live defenses. **They are vacating exactly the role this product fills.**
- TZ format on RS School (e.g. `async-race`, `puzzle`, `fun-chat`) is already structured for machine-readable rubric extraction (explicit points, explicit penalties, checkbox lists).

## Existing prior art (not to be re-built)

The founder has already built and validated v0 as a manual workflow, hosted at `github.com/HelgaZhizhka/mentor-resources`:

- **`templates/agents/reviewer.md`** — production-quality LLM prompt for code review. Already has: 9 review categories, anti-hallucination guards (`не придумывай код, которого нет`), report format with `файл:строка` references, "если передан чеклист задания — используй его критерии и баллы" instruction. **This is the product's IP.** Don't rewrite — wrap.
- **`templates/scripts/`** — bash mech-checkers (eslint, tsconfig, build, console.log).
- **`templates/checklists/checklist.md`** — human checklist for manual review, also referenced in school docs.
- **`clean-code/` (6 parts) + `TypeScript.md`, `HTML.md`, `CSS.md`, `UI-UX.md`** — curated reference material the AI links to in reviews. **This is the curriculum** for review explanations.

The product = web automation layer over this existing manual workflow. Not a from-scratch build.

## Distribution model — open-core

**Locked.** Two product layers, two repos, two licences.

### Free open-source tier (the "engine")

Lives in `github.com/HelgaZhizhka/mentor-resources` (extends existing repo). MIT or Apache-2.0.

Contains:
- **Engine + CLI** (`packages/engine`, `packages/cli`) — wraps the founder's existing `reviewer.md` prompt as a packaged, callable tool. Single engine, multiple invocation modes.
- **Generic mechanical checkers** — parametrised, configured per-criterion via rubric YAML (dep-presence, eslint-rule-configured, forbidden-imports, magic-numbers-scan, typescript-any-usage, etc.). Extensible via registry.

Rubrics themselves live in a **separate repo** (`pocket-mentor-rubrics`) — see §"Rubric architecture" above. This keeps engine releases decoupled from rubric updates: adding support for a new task = adding one YAML file in the rubrics repo, no engine release needed.

Both pieces work locally on the mentor's machine, using their personal Claude / OpenAI API key. **Zero hosting cost** for the school. **Zero infrastructure dependency** on the founder.

### Paid tier (the "web composer")

Lives in a separate private repo (this directory, `pocket-mentor`). Closed-source. SaaS-hosted by founder.

Adds value above the free engine:
- Batch grading dashboard (30 PRs in one view, not 30 browser tabs)
- Cross-review analytics ("you skip category X 70% of the time")
- Multi-mentor team mode + calibration
- Persistent drafts beyond GitHub's PENDING state
- Custom rubric editor (UI for YAML editing)
- Course-coordinator analytics

These are **richer features**, not "the same thing paywalled." The free engine is sufficient for a solo mentor to do their job; the paid tier scales the workflow across teams and time.

### Why open-core is right here

- **Distribution leverage:** RS School constraint is "we're poor, no infrastructure money" (confirmed in 2026-05 AI club lecture — explicit 4+ times). A paid school-wide tool will not be adopted. A free engine will.
- **Defensibility:** the engine alone is reproducible by anyone with the founder's prompt. The web composer is where lock-in lives (data, history, team features).
- **Legitimacy:** founder already publishes mentor tooling open-source under `HelgaZhizhka/mentor-resources`. Continuing that model is consistent with her existing reputation.

## Output format & delivery

**Locked.** Engine returns a structured payload; CLI offers three delivery modes; curation happens in GitHub's native UI.

### Engine output (structured)

```ts
{
  comments: Array<{
    file: string,           // "src/api.ts"
    line: number,           // 12
    side: "RIGHT" | "LEFT",
    category: string,       // "TypeScript"
    severity: "error" | "warning" | "info",
    body: string,           // pedagogical markdown
    points_delta: number,   // -5
    rule_id: string         // "ts-no-any"
  }>,
  summary: {
    body: string,
    score: { earned: 142, max: 190 },
    breakdown: Array<{ category: string, earned: number, max: number }>
  },
  rubric: { id: "async-race", version: "v1" }
}
```

### CLI delivery modes

```
pocket-mentor review <pr-url> --rubric async-race --as-draft
  → creates GitHub PR Review in PENDING state via API; all comments
    pre-loaded inline; summary in review body. PRIMARY MODE.

pocket-mentor review <pr-url> --rubric async-race --output json
  → emits structured JSON. For web composer / scripting / piping.

pocket-mentor review <pr-url> --rubric async-race --output markdown
  → emits human-readable markdown report. Fallback when no GitHub auth.
```

### Why GitHub's native draft review is the curation step

GitHub PR Review API has supported `event: PENDING` for 5+ years. A pending review:
- Shows up to the reviewer as "1 pending review (N comments)" on the PR
- Lets them delete / edit / add comments in the standard GitHub UI
- Is only visible to the student after the mentor clicks **Submit review**

This **is** the curation UX the founder needed — built into GitHub, free, and already familiar to every mentor. No custom web app required for the open-source tier. Paid composer's value is elsewhere (batch, analytics, history), not in basic curation.

## Authentication model

**Locked.** Mentor-owned PAT, no server-side OAuth.

Reasoning:
- **Identity:** comments appear from the mentor's GitHub account, not a bot. Student sees "Review by HelgaZhizhka", which preserves the mentor-student relationship.
- **Cost:** zero infrastructure. Open-source promise requires this.
- **RS School constraint compatibility:** matches the explicit "no hosting, no MCP, no money" position.

CLI auth cascade:
1. `gh auth token` (if `gh` CLI authenticated) — 99% of mentors land here
2. `GITHUB_TOKEN` env var
3. `~/.pocket-mentor/token` file containing a fine-grained PAT with `pull-requests:write` + `contents:read`

Server-side OAuth (GitHub App with installation tokens) is reserved for the **paid web composer** — where it pays for itself via subscription revenue and enables features the free tier doesn't have (server-triggered reviews, scheduled batch grading, etc.).

## Repository structure

- `HelgaZhizhka/mentor-resources` — public, open-source. Home of engine + CLI + generic mechanical checkers. Already contains `packages/engine` and `packages/cli` workspaces, plus existing prompt/scripts under `templates/`.
- `HelgaZhizhka/pocket-mentor-rubrics` — public (planned). Home of all rubric YAML files. Separate repo so adding rubrics doesn't require an engine release. Authors commit; mentors `pocket-mentor rubrics sync`.
- `HelgaZhizhka/pocket-mentor` — private. Home of the paid web composer (deferred indefinitely).
- This working directory (`pocket-mentor` local) — planning + spec docs.

## RS School AI club context — what the school is actually building (2026-05-12 lecture)

Confirmed via the Tandem-project working session led by Dima (product) and Andrey (engineer):

- **No school-wide platform.** "System for agents using school resources" is a **wiki of MD files** that volunteer agents read. Explicitly rejected: hosted MCP servers, vector DBs, anything that costs money. *Direct quote: "это не MCP, это просто инфраструктура, заточенная под агентов".*
- **"We're poor" is structural.** Stated 4+ times in the session. Any partnership form factor that requires school-paid infrastructure will be declined.
- **Code review at scale is an open problem.** Asked by Oleg (~1:53 in lecture): *"100-120 студентов, ежедневно по 120 новых комитов, как это всё проверять в большом объёме?"* — Dima deflected (described his Tandem-specific approach), no general school answer offered.
- **They already use ad-hoc AI review.** "rescue" skill pattern mentioned; GPT-5.5 cited as "best for code review." But no rubric-anchored solution exists; it's all generic AI review.
- **Andrey independently validated the engine wedge.** *Quote: "в программировании можем алгоритмически проверить и убедиться, что агент работает правильно"* — this is exactly the mech/llm/hybrid split the rubric architecture is built on.

**Strategic implication:** the school is not building a competitor; it's surfacing a need they don't have a plan to fill. Open-source engine + rubrics positioned as a contribution (not a sale) is the right vector.
