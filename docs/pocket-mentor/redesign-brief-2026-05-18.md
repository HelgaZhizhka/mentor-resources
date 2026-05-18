# Redesign brief — pre-call with Dima

> **Date:** 2026-05-18
> **Status:** input for brainstorming session
> **Purpose:** prepare a sharpened plan before the Monday/Thursday call with Dima

This document is the **starting point for the next Claude Code session**, where we run `superpowers:brainstorming` to test hypotheses for a Pocket Mentor v0.9 redesign.

It is **not** a new plan. The current plan (SPEC.md, architecture-pivot-ru.md, CONTEXT.md) remains the baseline. This brief captures: what triggered the redesign, what should be preserved, what hypotheses to test.

---

## 1. Trigger — Dima's feedback (2026-05-18)

Received Telegram message after reading `architecture-pivot-ru.md`. Verbatim:

> «Почитал на выходных - выглядит сложно ) В плане того, как ментору с этим всем работать.»
>
> «Я представляю себе ментора, который только пришел на курс и не знает что дальше ему делать. С учетом что у меня есть Клод или Кодекс - то я бы хотел максимум скачать репу и запустить агента, а он уже дальше знает что делать и мне все расскажет. Ну или ревьювал все по старинке, открыв PR и написав 3 комментария.»
>
> «Что я хочу - это перестроить школу под новый формат, где студенты в командах пишут проекты, а все ревью проходит на сессиях с ментором или менторами.»
>
> «Я разговаривал с Андреем, что изменить RS APP и отразить все изменения там.»
>
> «Надо только продумать как это новая система должна работать в деталях.»
>
> «У нас со Степаном есть звонки по утрам в понедельник и четверг - можем там обсудить»

Three signals embedded:

- **UX is too complex** — mentor-newbie should clone repo + run agent, not read SPEC. The complaint is about **packaging**, not the idea itself.
- **School is moving to synchronous review sessions** — async PR review (which our plan optimises for) becomes secondary. Timeline and scope of this shift = unknown.
- **He's actively redesigning the school's review workflow with Andrey** — RS APP changes coming. Pocket Mentor needs to fit, not lead.

---

## 2. Helga's initial reaction (instinct to test)

> «Может быть пока что просто скилл создать, который будет учитывать вот этот материал в репо по практикам кода, и требования которые ментор сам в md файле передаст, и все на этом?»

I.e. radically simpler v0.9:
- A Claude Code **skill** (not a packaged CLI)
- Reads existing `clean-code/*` + `templates/checklists/*` as ground truth
- Mentor passes their own checklist/requirements in markdown ad-hoc
- No engine, no rubric YAMLs, no GitHub draft delivery

This is the **first hypothesis** to test in brainstorming. It is attractive but has open questions (see §5).

---

## 3. What stays as foundation (not redesigned)

Whatever happens, these survive:

- **Existing manual workflow** at `templates/agents/reviewer.md`, `templates/checklists/checklist.md`, `templates/scripts/*` — production-quality material, already validated by Helga's mentor work.
- **Curated content** at `clean-code/*` — six-part fundamental + TypeScript/HTML/CSS/UI-UX/React. This is the curriculum truth-source.
- **M0-M3 engineering work**:
  - pnpm workspace + TS strict + ESLint config
  - `packages/engine` skeleton + types + schemas
  - 8 generic parametrised mech-checkers with registry pattern
  - Repo-wide harness (`AGENTS.md`, `feature_list.json`, `progress.md`, `init.sh`)
- **The four-layer mental model** as conceptual organisation (common + stack + task + mentor) — regardless of whether it's encoded as YAML rubrics or as MD references in a skill.
- **`pocket-mentor-rubrics` repo** (just created today, empty README only). Either becomes home for YAML rubrics OR pivots to host MD checklists / skill-readable material. Decided in brainstorming.

---

## 4. Constraints for the redesign

- **Time pressure:** we want a sharpened plan **before** the call with Dima (Monday or Thursday morning). The call is the validation gate, not the design gate.
- **Don't sunk-cost trap:** M0-M3 work is reusable but we should not preserve engine for engine's sake. If the right answer is "ship a skill, freeze engine for later", that's fine.
- **Don't over-commit:** the school's sync-review shift may be 6 months out, or 18 months out. We don't know yet. Plan must work for **both** sync and async modes, or for one with a clear pivot path to the other.
- **Don't throw away mentor consistency:** the strongest argument for structured rubrics was standardisation across mentors. Whatever replaces it must address: "two different mentors reviewing the same PR — same output?"

---

## 5. Hypotheses to brainstorm

### H1 — Pure skill, no engine (Helga's instinct)

A Claude Code skill `pocket-mentor` that:
- Lives in `mentor-resources/.claude/skills/pocket-mentor/`
- Reads `clean-code/*`, `templates/checklists/*`, `templates/agents/reviewer.md` as context
- Mentor invokes during review session: `/pocket-mentor review` or similar
- Mentor optionally points it at their own MD checklist for the task
- Output: structured review comments in the chat, mentor copies relevant ones to GitHub manually

**Test:** does this solve Dima's "clone repo → run agent → done" UX? What's lost from current plan? Where does it fail?

### H2 — Skill as entry point, engine underneath

Skill is the **new front door**, engine continues development:
- `/pocket-mentor` skill walks new mentor through "what do I do" — onboarding, basic review using prompt-level logic
- For mentors who want deep async PR review (existing async courses) — the CLI continues development on a slower timeline
- Two delivery surfaces, one product

**Test:** is the dual-path cost worth it? Or does Dima's signal mean async PR review is genuinely dying and we should follow the puck?

### H3 — Skill that drives the engine

The skill IS the UX layer; the engine is its toolbox:
- `/pocket-mentor review <pr-url>` → skill spawns subagent that uses engine commands as tools
- Mentor never sees CLI flags; agent figures out stack, task, level by asking the mentor or inferring
- All M0-M3 work preserved as internal API for the agent

**Test:** is this real simplification or "same complexity, different wrapper"? Does it actually feel "clone → run → done" to a new mentor?

### H4 — Drop product framing entirely; ship "an opinionated agent kit"

Reframe Pocket Mentor as **not a product**, but a **curated set of files** + **a recommended Claude Code setup**:
- README in `mentor-resources` says "for code review, clone this repo, set up Claude Code with these skills, use this prompt".
- No engine, no rubrics YAML, no install.
- Mentors fork or clone as needed; the project's value is **curated content + workflow recipe**.
- Lowers maintenance burden to near-zero.

**Test:** does Dima's "we're poor, no infrastructure" match this? Or is this too unstructured to be useful?

---

## 6. Pre-call deliverable

By the call with Dima we want:
- **One sentence answer** to "what is Pocket Mentor v0.9 now?"
- **One diagram** showing how a new mentor uses it end-to-end
- **One list** of what we keep / what we drop / what we defer
- **Three diagnostic questions** for Dima to confirm direction (e.g. "is async PR review extinct in 12 months on RS School? yes/no/depends")

That's what brainstorming should produce. Not a SPEC rewrite — a sharpened proposition to test in the call.

---

## 7. Open questions for Dima (bring to the call)

Independent of which hypothesis wins:

1. **Timeline for sync-review shift** — months? quarters? all courses or only Tandem? Without this, we can't sequence async-mode vs sync-mode work.
2. **What in current plan does he keep?** Maybe he likes layered rubrics but hates the CLI. Maybe he likes the engine but wants a different entry surface. Narrow the rejection.
3. **Concrete usage scenario** — "you sit down at the review session with a laptop + Claude Code + student repo open. First thing you want to do?". Concrete > abstract.
4. **"Ментор не знает что делать"** — does he mean technical onboarding (here's how the tool works) or domain onboarding (here's how to review code well)? Different products.
5. **What's the relationship between Pocket Mentor and RS APP rebuild?** Adjacent? Integrated? Distinct?

---

## 8. How to start the brainstorming session

In a fresh Claude Code session, opening prompt should be roughly:

> «Прочитай `docs/pocket-mentor/redesign-brief-2026-05-18.md` целиком, потом запусти `superpowers:brainstorming` для тестирования четырёх гипотез из §5. Цель — выйти на sharpened proposition перед звонком с Димой (см. §6).»

Brainstorming should produce a candidate proposition, not a finalised SPEC. SPEC revision is a separate session after the call.
