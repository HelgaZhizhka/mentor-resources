# Student Reviewer v1.2 — Judge Agent

**Date:** 2026-05-28
**Status:** approved
**Scope:** `.github/actions/student-reviewer/review.mjs`

---

## Problem

The finder AI posts all findings it produces directly to the PR. Two problems:

1. **No deduplication** — re-running the action (e.g., on each push) creates duplicate comments about the same issue already covered in a previous review on the same PR.
2. **No confidence filter** — vague or speculative findings reach the student even when the finder wasn't certain.

## Solution

Add a lightweight **judge agent** as a second AI call between the finder and the postReview step. The judge filters findings — it does not re-read the diff, does not have access to curriculum, and does not rewrite content. It only decides `keep` or `drop` for each finding.

---

## Data Flow

```
diff → [finder AI] → raw findings (no limit)
                             ↓
previous reviews → [judge AI] → filtered findings
                                        ↓
                                  log dropped (with reason)
                                        ↓
                                  postReview
```

**Change to finder:** Remove the `Maximum 5–7 inline comments` constraint. The finder should surface everything it's confident about. The judge handles limiting.

---

## New Functions

### `fetchPreviousReviews(owner, repo, pullNumber)`

- Calls `octokit.pulls.listReviews()` for the PR
- Filters to reviews by `github-actions[bot]`
- Extracts: `general_body` (first 120 chars) + each inline comment body (first 120 chars)
- Returns: `string[]` of topic summaries, or `[]` on any error (fail-open)

### `callJudge(findings, previousTopics)`

Second AI call. Inputs:
- `findings` — array of `{ index, path, line, body }` from the finder
- `previousTopics` — array of strings from `fetchPreviousReviews`

**Judge system prompt (short, no XML, no curriculum):**

```
You are a quality filter for an educational code review.

You will receive:
- new_findings: findings a reviewer wants to post on a student PR
- previous_topics: short summaries of what was already said in earlier reviews on this PR

For each finding, decide: keep or drop.

Drop if ANY of these is true:
- The same concept is already covered in previous_topics (semantic match, not word match)
- The finding is vague or speculative (no specific file/line evidence in the body)

Keep everything else.

Output JSON only — no markdown, no explanation:
{
  "decisions": [
    { "index": 0, "decision": "keep", "reason": "specific, not covered before" },
    { "index": 1, "decision": "drop", "reason": "subscription leaks already covered in previous review" }
  ]
}
```

**User message to judge:**

```
Filter these findings.

previous_topics:
<JSON array of previous review summaries>

new_findings:
<JSON array of {index, path, line, body_preview}>
```

`body_preview` = first 200 chars of the finding body (judge doesn't need the full text).

**Returns:** filtered `findings` array (only `keep` decisions), or original `findings` if judge fails.

**Model:** same as finder (`process.env.AI_MODEL || 'gpt-4o'`). No separate model config needed.

**Temperature:** 0.0 — this is a classification task, not creative writing.

---

## Logging

Dropped findings are logged to stdout (visible in Actions logs, not sent to student):

```
Judge: keep  [0] fun-chat/index.html:10 — specific, not covered before
Judge: drop  [1] fun-chat/src/api/web-socket.ts:56 — subscription leaks already covered in previous review
Judge: keep  [2] fun-chat/src/core/mediator/index.ts:3 — new pattern, not covered
```

---

## Error Handling

If `callJudge` throws or returns invalid JSON → log `Judge failed — posting all findings unfiltered` and return original findings unchanged. **Fail-open**: a broken judge never silences a valid review.

If `fetchPreviousReviews` fails → pass `[]` as `previousTopics`. Judge runs with no dedup context (still filters on confidence).

---

## Updated `main()` flow

```
1. fetchPRDiff
2. detectStack
3. fetchTaskRequirements (v1.1)
4. callAI (finder) → rawReviewData
5. fetchPreviousReviews → previousTopics
6. callJudge(rawReviewData.comments, previousTopics) → filteredComments
7. log judge decisions
8. postReview({ ...rawReviewData, comments: filteredComments })
```

---

## Out of Scope

- Judge does not merge or rewrite findings
- Judge does not downgrade severity
- No separate AI model config for judge — reuses `AI_MODEL`
- No UI changes to `action.yml` or `student-review.yml`
