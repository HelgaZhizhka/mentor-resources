# Student Reviewer v1.2 — Judge Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a judge agent that filters finder AI output before posting — removes duplicate findings already covered in previous reviews and drops low-confidence findings.

**Architecture:** Two-pass AI pipeline inside `review.mjs`. Pass 1 (finder): reads diff + curriculum + task requirements, outputs raw findings with no count limit. Pass 2 (judge): reads raw findings + previous review summaries, outputs keep/drop decision per finding with reason. Fail-open: judge failure posts all findings unfiltered.

**Tech Stack:** Node.js 20 ESM, `openai` SDK (OpenAI-compatible), `@octokit/rest`

**Spec:** `docs/superpowers/specs/2026-05-28-student-reviewer-judge-agent-design.md`

---

## File Structure

- Modify: `.github/actions/student-reviewer/review.mjs`
  - Remove finder comment limit from `SYSTEM_PROMPT`
  - Add `fetchPreviousReviews()` after `postReview()`
  - Add `callJudge()` after `fetchPreviousReviews()`
  - Update `main()` to wire both new functions between `callAI` and `postReview`

---

### Task 1: Remove finder comment limit

**Files:**
- Modify: `.github/actions/student-reviewer/review.mjs:137`

The finder should surface everything it's confident about. The judge handles filtering, so the artificial cap belongs to the judge layer now.

- [ ] **Step 1: Edit SYSTEM_PROMPT constraints**

In `review.mjs`, find the `<constraints>` block (line ~136). Replace:

```
- Maximum 5–7 inline comments. A student learns more from 3 well-explained findings than from 12 lint complaints.
```

With:

```
- Focus on findings you are confident about. Surface all issues that clearly violate a rule from <curriculum> or a requirement from <task_requirements>. Do not pad findings to reach a number.
```

- [ ] **Step 2: Syntax check**

```bash
node --input-type=module --check < .github/actions/student-reviewer/review.mjs
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add .github/actions/student-reviewer/review.mjs
git commit -m "feat(student-reviewer): remove finder comment limit — judge handles filtering"
```

---

### Task 2: Add `fetchPreviousReviews()`

**Files:**
- Modify: `.github/actions/student-reviewer/review.mjs` — insert after `postReview()` function, before `// ── Task requirements ──` section

This function fetches all reviews previously posted by `github-actions[bot]` on this PR and returns a flat list of topic summaries (first 120 chars of each comment body). Returns `[]` on any error so the judge still runs without dedup context.

- [ ] **Step 1: Add the function**

Insert this block after the closing `}` of `postReview()` and before `// ── Task requirements ──────────────────────────────────────────────────────────`:

```javascript
// ── Previous reviews ─────────────────────────────────────────────────────────

async function fetchPreviousReviews(owner, repo, pullNumber) {
  try {
    const octokit = buildOctokit();
    const { data: reviews } = await octokit.pulls.listReviews({
      owner,
      repo,
      pull_number: Number(pullNumber),
    });

    const botReviews = reviews.filter(r => r.user?.login === 'github-actions[bot]');
    if (botReviews.length === 0) return [];

    const topics = [];

    for (const review of botReviews) {
      if (review.body) topics.push(review.body.slice(0, 120));

      const { data: comments } = await octokit.pulls.listCommentsForReview({
        owner,
        repo,
        pull_number: Number(pullNumber),
        review_id: review.id,
      });
      for (const c of comments) {
        if (c.body) topics.push(c.body.slice(0, 120));
      }
    }

    return topics;
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Syntax check**

```bash
node --input-type=module --check < .github/actions/student-reviewer/review.mjs
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add .github/actions/student-reviewer/review.mjs
git commit -m "feat(student-reviewer): add fetchPreviousReviews — collect prior bot review topics"
```

---

### Task 3: Add `callJudge()`

**Files:**
- Modify: `.github/actions/student-reviewer/review.mjs` — insert after `fetchPreviousReviews()`, before `// ── Task requirements ──`

The judge is a second AI call. It receives raw findings + previous review topics and returns the filtered findings array. Temperature 0.0 — classification, not creative writing. Fail-open: any error returns the original findings unchanged.

- [ ] **Step 1: Add the function**

Insert this block directly after the closing `}` of `fetchPreviousReviews()`:

```javascript
const JUDGE_SYSTEM_PROMPT = `You are a quality filter for an educational code review.

You will receive:
- new_findings: findings a reviewer wants to post on a student PR
- previous_topics: short summaries of what was already said in earlier reviews on this PR

For each finding decide: keep or drop.

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
}`.trim();

async function callJudge(findings, previousTopics) {
  if (findings.length === 0) return findings;

  const client = buildClient();
  const model  = process.env.AI_MODEL || 'gpt-4o';

  const findingSummaries = findings.map((f, i) => ({
    index: i,
    path: f.path,
    line: f.line,
    body_preview: (f.body ?? '').slice(0, 200),
  }));

  let raw;
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Filter these findings.\n\nprevious_topics:\n${JSON.stringify(previousTopics)}\n\nnew_findings:\n${JSON.stringify(findingSummaries)}`,
        },
      ],
      temperature: 0.0,
      max_tokens: 1024,
    });
    raw = response.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    console.warn(`Judge failed (${err.message}) — posting all findings unfiltered`);
    return findings;
  }

  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  let decisions;
  try {
    ({ decisions } = JSON.parse(cleaned));
  } catch {
    console.warn('Judge returned invalid JSON — posting all findings unfiltered');
    return findings;
  }

  const kept = [];
  for (const d of decisions) {
    const label = d.decision === 'keep' ? 'keep ' : 'drop ';
    const finding = findings[d.index];
    console.log(`Judge: ${label} [${d.index}] ${finding?.path ?? '?'}:${finding?.line ?? '?'} — ${d.reason}`);
    if (d.decision === 'keep') kept.push(finding);
  }

  // Safety: if judge dropped everything, fall back to original
  if (kept.length === 0 && findings.length > 0) {
    console.warn('Judge dropped all findings — falling back to unfiltered');
    return findings;
  }

  return kept;
}
```

- [ ] **Step 2: Syntax check**

```bash
node --input-type=module --check < .github/actions/student-reviewer/review.mjs
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add .github/actions/student-reviewer/review.mjs
git commit -m "feat(student-reviewer): add callJudge — filter findings before posting"
```

---

### Task 4: Wire judge into `main()`

**Files:**
- Modify: `.github/actions/student-reviewer/review.mjs` — update `main()` function

Replace the section between `callAI` and `postReview` with the two new steps.

- [ ] **Step 1: Update `main()`**

Find this block in `main()`:

```javascript
  console.log('Calling AI for review...');
  const reviewData = await callAI(stack, references, diff, taskRequirements);

  const commentCount = reviewData.comments?.length ?? 0;
  if (commentCount === 0 && !reviewData.general_body) {
    console.log('No findings to post — skipping review.');
    process.exit(0);
  }

  console.log(`Posting ${commentCount} comment(s)...`);
  await postReview(owner, repo, prNumber, reviewData);
```

Replace with:

```javascript
  console.log('Calling AI for review...');
  const reviewData = await callAI(stack, references, diff, taskRequirements);

  console.log('Fetching previous reviews...');
  const previousTopics = await fetchPreviousReviews(owner, repo, prNumber);
  console.log(`Found ${previousTopics.length} previous review topic(s).`);

  console.log('Running judge...');
  const filteredComments = await callJudge(reviewData.comments ?? [], previousTopics);

  const finalReview = { ...reviewData, comments: filteredComments };

  const commentCount = filteredComments.length;
  if (commentCount === 0 && !finalReview.general_body) {
    console.log('No findings to post — skipping review.');
    process.exit(0);
  }

  console.log(`Posting ${commentCount} comment(s)...`);
  await postReview(owner, repo, prNumber, finalReview);
```

- [ ] **Step 2: Syntax check**

```bash
node --input-type=module --check < .github/actions/student-reviewer/review.mjs
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add .github/actions/student-reviewer/review.mjs
git commit -m "feat(student-reviewer): wire judge into main — v1.2 complete"
```

---

### Task 5: Update version + push + verify

**Files:**
- Modify: `feature_list.json`
- Modify: `progress.md`

- [ ] **Step 1: Bump version in `feature_list.json`**

Change `"current_version": "v1.1.0"` to `"current_version": "v1.2.0"` for the `student-reviewer` entry. Update `"evidence"` to mention v1.2 judge agent.

- [ ] **Step 2: Run `./init.sh`**

```bash
./init.sh
```

Expected: `OK` on shellcheck, smoke test passes, working tree clean after commit.

- [ ] **Step 3: Append progress entry to `progress.md`**

Add a new entry at the bottom:

```markdown
## 2026-05-28 — student-reviewer v1.2 — judge agent

**Done:**
- Added `fetchPreviousReviews()` — reads all `github-actions[bot]` reviews on the PR, extracts topic summaries.
- Added `callJudge()` — second AI call (temperature 0.0) that filters finder output: drops duplicates (semantic match against previous topics) and low-confidence findings.
- Removed artificial `Maximum 5–7` finder limit — judge now controls count.
- Safety net: judge dropping all findings falls back to unfiltered. Any judge error also falls back unfiltered (fail-open).
- Logs every judge decision to Actions stdout with reason.

**Decisions:**
- Judge uses same AI_MODEL as finder — no extra config needed.
- body_preview (200 chars) sent to judge instead of full body — tokens saved.
- Fail-open on all judge errors — a broken judge never silences a valid review.

**Next:**
- Trigger a re-review on a PR that already has bot reviews and verify judge dedup log appears.
- v1.3 candidate: configurable task URL pattern (not hardcoded to RS School).

**Blockers:** none
```

- [ ] **Step 4: Commit docs + push**

```bash
git add feature_list.json progress.md
git commit -m "docs: bump student-reviewer to v1.2.0 + progress entry"
git push origin master
```

- [ ] **Step 5: Trigger test run**

Push an empty commit to the student PR branch to trigger the action:

```bash
# In the student repo (anastasiashlyk-JSFE2025Q3), on the fun-chat branch:
git commit --allow-empty -m "chore: trigger CI" && git push
```

- [ ] **Step 6: Verify in Actions log**

In the GitHub Actions run log, confirm these lines appear:
```
Fetching previous reviews...
Found N previous review topic(s).
Running judge...
Judge: keep  [0] ...
Judge: drop  [1] ... — already covered in previous review
```

And confirm the number of posted comments is lower than previous runs (dedup working).
