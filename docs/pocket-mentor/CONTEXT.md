# Pocket Mentor — Domain Context

> Working name: **Pocket Mentor**. Status: pre-MVP. Decisions captured here are locked unless explicitly revisited. Earlier specs in `docs/superpowers/specs/` predate these decisions and are **superseded** — keep only as reference.

## What this product is

**AI co-pilot for frontend mentors reviewing student PRs.** A mentor receives a student PR (GitHub URL), picks a rubric (per-task YAML), runs the engine. Output is a **draft PR review** pre-loaded with inline comments, summary, and estimated score — created via the GitHub API in `PENDING` state. The mentor curates in GitHub's native review UI (toggle/edit/discard each comment), then clicks **Submit review**.

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

### Rubric architecture — two layers, school as source of truth

**Locked.** Rubrics are not duplicated into our repo. The school's official markdown files are the **single source of truth**.

**Layer 1 — School markdown (source of truth, not ours):**
- `github.com/rolling-scopes-school/tasks/blob/master/stage2/tasks/<task>/non-functional-requirements.md` (or `MentorsCheckCriteria.md` depending on task)
- Engine fetches at runtime (cached + version-pinned to commit SHA)
- Contains criteria, points, penalties — the authoritative score sheet

**Layer 2 — Our enrichment (metadata layer, ours):**
- `rubrics/<task>.enrichment.yaml` in our repo
- Per criterion in the school markdown: `method` (`mech` / `llm` / `hybrid`), pointer to mech-check script, LLM focus hint
- Does NOT contain criterion text or point values — those come from layer 1
- Tiny files (~30-50 lines per task)

**Method types:**
- **Mechanical (`mech`)** — checkable by deterministic script, no AI. Examples: ESLint config presence, no forbidden deps in `package.json`, `any` usage, function length, file count. Two runs of the same input give the same output. Zero LLM tokens.
- **LLM (`llm`)** — requires judgement. Examples: architecture quality, naming clarity, separation of concerns.
- **Hybrid** — script narrows the question (finds candidates), LLM decides if they matter in context. Example: jscpd finds duplications, LLM judges if they're meaningful.

Empirical split on async-race rubric: ~60% `mech`, ~20% `llm`, ~20% `hybrid`. This is the wedge over generic AI review — we don't ask LLMs what scripts can answer.

**Versioning:**
- Enrichment YAML pins `source_commit: <sha>` for reproducibility
- CLI subcommand `pocket-mentor rubrics check-updates` shows diff vs school's current master
- Mentor controls update cadence; no auto-pull in production

**Why this matters (school confirmed 2026-05):** RS School has announced that stage 2 tasks **will change**. Layer-1-from-school architecture means: when school updates a task, we update the pinned commit, review the enrichment for breakage, ship a new rubric version. No content duplication, no race condition on what "the real rubric" is.

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
- **Claude Code skill + CLI** — wraps the founder's existing `reviewer.md` prompt as a packaged, callable tool. Single engine, multiple invocation modes.
- **Per-task rubrics** (`rubrics/async-race.yaml`, `rubrics/puzzle.yaml`, etc.) — machine-readable scoring definitions derived from RS School TZs. Each criterion tagged `mech` | `llm` | `hybrid`.
- **Mech-checker scripts** — already partially exist in `templates/scripts/`. Extended with rubric-driven runners.

All three pieces work locally on the mentor's machine, using their personal Claude / OpenAI API key. **Zero hosting cost** for the school. **Zero infrastructure dependency** on the founder.

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

- `HelgaZhizhka/mentor-resources` — public, open-source. Home of engine + rubrics + mech-checkers. Currently contains the founder's existing prompt and scripts; will be extended with `packages/skill`, `packages/cli`, `packages/rubrics`, `packages/mech-checkers`.
- `HelgaZhizhka/pocket-mentor` — private. Home of the paid web composer. Not yet started.
- This working directory (`pocket-mentor` local) — planning + spec docs during pre-MVP. Will become the home of the paid web composer once implementation starts.

## RS School AI club context — what the school is actually building (2026-05-12 lecture)

Confirmed via the Tandem-project working session led by Dima (product) and Andrey (engineer):

- **No school-wide platform.** "System for agents using school resources" is a **wiki of MD files** that volunteer agents read. Explicitly rejected: hosted MCP servers, vector DBs, anything that costs money. *Direct quote: "это не MCP, это просто инфраструктура, заточенная под агентов".*
- **"We're poor" is structural.** Stated 4+ times in the session. Any partnership form factor that requires school-paid infrastructure will be declined.
- **Code review at scale is an open problem.** Asked by Oleg (~1:53 in lecture): *"100-120 студентов, ежедневно по 120 новых комитов, как это всё проверять в большом объёме?"* — Dima deflected (described his Tandem-specific approach), no general school answer offered.
- **They already use ad-hoc AI review.** "rescue" skill pattern mentioned; GPT-5.5 cited as "best for code review." But no rubric-anchored solution exists; it's all generic AI review.
- **Andrey independently validated the engine wedge.** *Quote: "в программировании можем алгоритмически проверить и убедиться, что агент работает правильно"* — this is exactly the mech/llm/hybrid split the rubric architecture is built on.

**Strategic implication:** the school is not building a competitor; it's surfacing a need they don't have a plan to fill. Open-source engine + rubrics positioned as a contribution (not a sale) is the right vector.
