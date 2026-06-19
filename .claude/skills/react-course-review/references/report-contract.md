# React Course Review Report Contract

Read this file before writing `REACT_COURSE_REVIEW.md` or a custom `--output-path` report.

## Language Contract

Translate all human-facing content when the selected language is not English. For Russian, use these labels consistently:

| English | Russian |
|---|---|
| Scope | Область проверки |
| Strengths | Что сделано хорошо |
| Course blockers | Блокеры курса |
| React learning feedback | Учебные замечания по React |
| Later improvements | Можно улучшить позже |
| Functional Rubric Estimate | Оценка по функциональным критериям |
| Recommended Mentor Score | Рекомендуемая менторская оценка |
| Priority Fixes | Приоритет исправлений |
| Process Notes | Процессные заметки |
| Manual checks for mentor | Ручные проверки для ментора |
| Generated Files | Созданные файлы |
| Summary for student | Итог для студента |
| File | Файл |
| Evidence | Подтверждение |
| What | Что происходит |
| Why it matters in React | Почему это важно в React |
| Course principle | Принцип курса |
| How to fix | Как исправить |
| Reference | Источник |
| Draft score | Черновая оценка |
| Confidence | Уверенность |
| Basis | Основание |
| Why this score | Почему такая оценка |
| Score delta from functional estimate | Почему оценка отличается от функциональной |
| Fastest path to improve | Самый быстрый путь к улучшению |
| Mentor-final-call note | Примечание для ментора |
| Criterion / Max / Estimated / Evidence / Comment | Критерий / Максимум / Оценка / Подтверждение / Комментарий |
| Problem / Priority / Complexity | Проблема / Приоритет / Сложность |

Code identifiers, packages, script names, checker names, file paths, and standard React ecosystem terms may stay in English. Do not leave untranslated English skeleton headings or labels in Russian output.

## Finding Contract

Every blocker and course-feedback item uses this shape:

```markdown
### <severity> <short title>

**File:** `path/to/file.tsx:line`
**Evidence:** <Command-verified | Source-verified | Structural | Inferred> — <short proof>
**What:** <one precise sentence>
**Why it matters in React:** <rendering, state, data flow, or user impact>
**Course principle:** <fundamentals | hooks | data | forms | TypeScript | UI/UX | security | error handling | code quality | task requirements>
**How to fix:** <concrete next step>
**Reference:** <loaded local curriculum filename and section when useful>
```

For a line-specific blocker, include a short exact current snippet when it materially proves the claim. For structural findings, cite all relevant files instead of inventing a single representative line. For inferred claims, state the runtime or test evidence needed to confirm them.

Before/after code is optional. Include it only when the change is local, safe, and compatible with the student's current configuration. Never emit a snippet that would reintroduce another reported problem.

## Canonical Report Structure

Use every section below in order. Omit Functional Rubric Estimate when no scoring rubric was loaded. Translate the structure, labels, table headers, checklist items, and notes according to the selected language.

```markdown
# REACT COURSE REVIEW: <project name>

> <warning only when task context is missing: generic course review; functional rubric estimate omitted>

## Scope
- Course focus: <provided or inferred>
- React / TypeScript / tooling / router / tests: <detected values>
- Source coverage: <reviewed areas and any excluded/unreadable relevant files>
- Execution mode: safe/static | scripts allowed | install allowed
- Verified by agent: install <status>, lint <status>, build <status>, test <status and script>, runtime <status>

## Strengths
1. <specific evidence-backed strength>

## 🔴 Course blockers
<finding contract, or an explicit statement that no confirmed blockers were found>

## 🟡 React learning feedback
<finding contract, or an explicit statement that no high-conviction feedback was found>

## 🔵 Later improvements
<brief advanced/polish items; no padding>

## Functional Rubric Estimate
| Criterion | Max | Estimated | Evidence | Comment |
|---|---:|---:|---|---|
| **Total** | **100** | **NN** | | <functional-only estimate> |

## Recommended Mentor Score
**Draft score:** <0-100>/100
**Confidence:** high | medium | low
**Basis:** functional rubric + code review | code review only | code review with missing task context

**Why this score:**
- <2-4 evidence-backed reasons>

**Score delta from functional estimate:** <required when values differ; omit without estimate>

**Fastest path to improve:**
1. <highest-impact fix>
2. <next fix>
3. <next fix>

> Mentor-final-call note: this is an agent recommendation, not the official grade. Apply the course coefficient and final RS App score manually.

## Priority Fixes
| # | Problem | Priority | Complexity |
|---:|---|---|---|
| 1 | ... | 🔴 Critical / 🟡 High / 🔵 Later | Low / Medium / High |

## Process Notes
- Git/PR hygiene: <branch, commits, forbidden tracked files, README>
- Mechanical signals: <checker findings not promoted to main findings>
- Verification limits: <all skipped, failed, inferred, or manual layers>

## Manual checks for mentor
- [ ] Main task scenarios work in a browser
- [ ] Browser console has no runtime errors
- [ ] Core controls work with keyboard navigation
- [ ] Mobile layout has no obvious broken states
- [ ] <task-specific scenarios not confirmed by runtime/e2e evidence>

## Generated Files
- `REACT_COURSE_REVIEW.md` or custom report: yes
- `inline-draft.json`: yes/no/not requested
- `issues-draft.json`: yes/no/not requested
- GitHub posting: not requested / cancelled / posted after approval

## Summary for student
<short, kind, specific, actionable wrap-up>
```

## Scoring Contract

- Functional Rubric Estimate answers only whether rubric behaviour appears implemented. Mark static-only rows as inferred.
- Recommended Mentor Score incorporates confirmed code quality, correctness, test, and verification risks.
- Explain every deduction through a report finding or explicit verification limitation.
- Do not deduct twice when one fact appears in both a rubric criterion and a penalty. Score the criterion on its own terms; list an explicit rubric penalty as advisory unless the rubric says the criterion itself becomes zero.
- Do not award `high` confidence from build/lint/unit tests alone. Main flows require browser/runtime or relevant integration/e2e evidence.
