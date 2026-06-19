# Pocket Mentor Report Contract

Read this file before writing `CODE_REVIEW_REPORT.md` or a custom local report.

## Finding Contract

Use this structure for every Critical and Recommendation:

```markdown
### <severity> <short title>

**File/Scope:** `path:line` or <explicit structural/command scope>
**Evidence:** <Command-verified | Source-verified | Structural | Inferred> — <short proof>
**What:** <precise problem>
**Why:** <student/task impact>
**How to fix:** <concrete next step>
**Reference:** <loaded local curriculum filename and relevant section>
```

For a line-specific Critical, include a short exact Current snippet when it proves the issue. For architecture/process findings, cite the relevant files, entry points, git history, or command output rather than fabricating one line.

Fix snippets are optional. Include one only for a short, safe correction compatible with project lint/TypeScript configuration. Never teach an unsafe assertion or reintroduce a pattern criticized elsewhere.

## Canonical Report

Translate human-facing headings and labels into the mentor's language. Keep paths, identifiers, package/script/checker names, and code fences in English.

```markdown
# CODE REVIEW: <project name>

> <warning only when task context failed/was omitted; Score omitted>

## Stack and Scope
- Execution mode: safe/static | scripts allowed | install allowed
- Stack/tooling: <detected values>
- Source coverage: <reviewed areas and relevant exclusions/unreadable files>
- Lint/build/test/runtime: <pass/fail/skip/not available>
- Git: branch and checker-derived commit summary
- Verification confidence: high | medium | low — <reason>

## Strengths
1. <specific evidence-backed strength>

## Critical issues
<finding contract, or explicit statement that no confirmed blockers were found>

## Recommendations
<finding contract, or explicit statement that no high-conviction recommendations were found>

## Notes
<brief informational observations; do not pad>

## Score
| # | Criterion | Max | Awarded | Evidence | Comment |
|---|---|---:|---:|---|---|
| **Total** | | **NN** | **NN** | | |

> Mentor-final-call note: this is an agent estimate; the final score belongs to the mentor.

## Summary
<one concise, kind, actionable paragraph>

## Manual checks
The agent did not verify these unless runtime/PR evidence above explicitly says otherwise.

**Pull Request:**
- [ ] Title is clear and informative
- [ ] Description has task link, screenshot, deploy URL, dates, and student self-check
- [ ] PR is not merged

**Functional:**
- [ ] <derive task-specific browser scenarios from loaded context>
- [ ] No runtime console errors
- [ ] Required responsive/interaction/accessibility states work
```

Omit Score entirely when no rubric was loaded. Keep all other sections.

## Scoring and Penalties

- Score only criteria present in loaded context; never reconstruct categories from memory.
- Attach an evidence class to each awarded/deducted row. Mark static-only functionality as inferred.
- Explain deductions through findings or verification limitations.
- Do not deduct twice for one fact.

When one violation appears in both a structural criterion and a Penalties list:

1. Score whether the structural criterion itself is satisfied.
2. Put a separate rubric multiplier/penalty below the table as advisory and do not apply it by default.
3. If the rubric explicitly says the criterion becomes zero, score zero and do not list an additional penalty.

## Anti-Repetition

For three or more occurrences of one pattern, write one full finding for the clearest instance and list the remaining `file:line` locations briefly. Do not create one finding per occurrence.
