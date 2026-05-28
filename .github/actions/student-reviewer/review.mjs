import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Stack detection ──────────────────────────────────────────────────────────

function readPackageDeps(pkgPath) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  return { ...pkg.dependencies ?? {}, ...pkg.devDependencies ?? {} };
}

function stackFromDeps(deps) {
  if ('@angular/core' in deps) return 'angular';
  if ('react' in deps && 'typescript' in deps) return 'react-ts';
  if ('typescript' in deps) return 'typescript';
  return 'vanilla-js';
}

function detectStackFromDiff(diff) {
  const files = [...diff.matchAll(/^\+\+\+ b\/(.+)$/gm)].map(m => m[1]);
  const hasAngular = diff.includes('@angular/core') || files.some(f => /\.component\.(ts|html)$/.test(f));
  const hasTsx = files.some(f => f.endsWith('.tsx'));
  const hasReact = hasTsx || diff.includes("from 'react'") || diff.includes('from "react"');
  const hasTs = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  const hasJs = files.some(f => f.endsWith('.js'));
  if (hasAngular) return 'angular';
  if (hasReact && hasTs) return 'react-ts';
  if (hasTs) return 'typescript';
  if (hasJs) return 'vanilla-js';
  return 'html-css';
}

function detectStack(workspace) {
  // Check root package.json first
  const rootPkg = join(workspace, 'package.json');
  if (existsSync(rootPkg)) return stackFromDeps(readPackageDeps(rootPkg));

  // RS School repos often have the project in a subdirectory — check one level deep
  try {
    const entries = readdirSync(workspace, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const candidate = join(workspace, entry.name, 'package.json');
      if (existsSync(candidate)) return stackFromDeps(readPackageDeps(candidate));
    }
  } catch {
    // ignore read errors
  }

  return null; // signal to main() that workspace detection failed
}

// ── Reference loading ────────────────────────────────────────────────────────

const REFS_DIR = join(__dirname, 'references', 'clean-code');

function loadRef(filename) {
  const filePath = join(REFS_DIR, filename);
  if (!existsSync(filePath)) {
    console.warn(`Warning: reference file not found: ${filename}`);
    return '';
  }
  return readFileSync(filePath, 'utf8');
}

function fundamentals() {
  return [1, 2, 3, 4, 5, 6]
    .map(n => loadRef(`Clean-Code-Fundamental-Part${n}.md`))
    .filter(Boolean)
    .join('\n\n---\n\n');
}

function buildReferences(stack) {
  switch (stack) {
    case 'html-css':
      return [loadRef('HTML.md'), loadRef('CSS.md')].join('\n\n---\n\n');
    case 'vanilla-js':
      return fundamentals();
    case 'typescript':
      return [loadRef('TypeScript.md'), fundamentals()].join('\n\n---\n\n');
    case 'react-ts':
      return [loadRef('React.md'), loadRef('TypeScript.md'), fundamentals()].join('\n\n---\n\n');
    default:
      return '';
  }
}

// ── AI provider ──────────────────────────────────────────────────────────────

function buildClient() {
  const baseURL = process.env.AI_BASE_URL || 'https://models.inference.ai.azure.com';
  const apiKey  = process.env.AI_API_KEY  || process.env.GITHUB_TOKEN;
  return new OpenAI({ baseURL, apiKey });
}

const SYSTEM_PROMPT = (stack, references, taskRequirements) => `
<role>
You are an RS School educational mentor reviewing a student pull request. Your goal is to help the student grow as a developer — not to produce a compliance report. You care about what concept the student is missing, not just which rule they broke.
</role>

<context>
The student is learning frontend development through RS School. This pull request is a course assignment submission. The curriculum below defines what they are expected to learn.

Detected stack: ${stack}

<curriculum>
${references}
</curriculum>
${taskRequirements ? `
<task_requirements>
The student was assigned the following task. Use it to identify which technical requirements are missing or not correctly implemented (e.g. SPA routing, empty body, explicit types, function length limits).

${taskRequirements}
</task_requirements>
` : ''}
</context>

<instructions>
Work through these steps internally before producing output. Do NOT output your reasoning — these steps are your private thinking process. Your only output is the JSON object described in <output_format>.

<steps>
${taskRequirements ? `<step number="1">CHECK REQUIREMENTS — Go through each technical requirement in <task_requirements>. Mark which ones are missing or broken in the diff. These become 🔴 Critical findings.</step>` : '<step number="1">UNDERSTAND — Read the full diff. What was the student trying to build? What mental model did they use?</step>'}
<step number="2">DIAGNOSE — For each issue, name the underlying knowledge gap, not just the symptom.</step>
<step number="3">PRIORITIZE — Select the issues that will teach the most. Missing requirements always take priority over style issues.</step>
<step number="4">WRITE — Draft each comment as a mentor explaining a concept, citing the rule from <curriculum> or the requirement from <task_requirements>.</step>
<step number="5">SUMMARIZE — Draft general_body: one thing done well + the single most important concept to internalize.</step>
</steps>

Once you have completed all steps internally, output ONLY the JSON object. No preamble, no explanation, no markdown — just the JSON.
</instructions>

<constraints>
- Apply ONLY rules from <curriculum>${taskRequirements ? ' and requirements from <task_requirements>' : ''}. Do not invent rules not present in those sources.
- Surface every finding you are confident about — issues that clearly violate a rule from <curriculum> or a requirement from <task_requirements>. Do not pad to reach a number.
- Never just cite a rule number or say "this violates X". Explain the concept the rule is protecting.
- Tone: direct and honest, but respectful. Frame mistakes as learning opportunities.
- If the same pattern repeats 3+ times: write one comment on the clearest instance, note "(N more occurrences: file:line, …)". Do not repeat the same lesson multiple times.
</constraints>

<output_format>
Respond with a JSON object ONLY — no markdown wrapper, no explanation, no text before or after the JSON:
{
  "comments": [
    {
      "path": "src/api.ts",
      "line": 12,
      "body": "SEVERITY **Title**\\n\\nWhat you were probably thinking and why it causes the problem.\\n\\n**The concept:** Plain-language explanation of the underlying principle.\\n\\n**How to fix:** Specific action.\\n\\n> 📖 Rule citation from curriculum"
    }
  ],
  "general_body": "Architectural summary: one thing done well + the single most important concept to internalize."
}

Severity: 🔴 Critical (blocks merge) | 🟡 Recommendation | 🔵 Note

For simple single-line fixes only, add a suggestion block inside the body:
\`\`\`suggestion
corrected line here
\`\`\`
</output_format>

<reminder>
You are writing to a student, not filing a bug report. A comment that helps them understand a concept is worth ten comments that just cite a rule. Write the comment you would want to receive if you were learning this for the first time.

If you are not confident about a finding — skip it. Do not guess. Only report what you can clearly support with evidence from the diff and a rule from <curriculum>.
</reminder>
`.trim();

const GITHUB_MODELS_MAX_CHARS = 12000;

function extractPaths(diff) {
  return [...new Set([...diff.matchAll(/^\+\+\+ b\/(.+)$/gm)].map(m => m[1]))];
}

async function callAI(stack, references, prDiff, taskRequirements = null) {
  const client = buildClient();
  const model  = process.env.AI_MODEL || 'gpt-4o';

  const isGitHubModels = (process.env.AI_BASE_URL || '').includes('inference.ai.azure.com');
  const diff = isGitHubModels && prDiff.length > GITHUB_MODELS_MAX_CHARS
    ? prDiff.slice(0, GITHUB_MODELS_MAX_CHARS) + '\n\n[diff truncated — too large for free tier]'
    : prDiff;

  const paths = extractPaths(diff);

  let response;
  try {
    response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(stack, references, taskRequirements) },
        { role: 'user',   content: `Review this pull request diff.\n\nChanged files (use ONLY these exact paths in your JSON):\n${paths.map(p => `- ${p}`).join('\n')}\n\n<diff>\n${diff}\n</diff>` },
      ],
      temperature: 0.2,
      max_tokens: 8192,
    });
  } catch (err) {
    if (err.status === 413) {
      return {
        comments: [],
        general_body: '⚠️ This PR is too large for the GitHub Models free tier (max 8000 tokens). For a full review, add your own AI provider: set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` in your repository secrets (Settings → Secrets and variables → Actions).',
      };
    }
    throw err;
  }

  const raw = response.choices[0]?.message?.content ?? '{}';
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error('AI response was not valid JSON:', raw.slice(0, 200));
    return { comments: [], general_body: '' };
  }
}

export { detectStack, buildReferences, callAI };

// ── GitHub API ───────────────────────────────────────────────────────────────

import { Octokit } from '@octokit/rest';

function buildOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

async function fetchPRDiff(owner, repo, pullNumber) {
  const octokit = buildOctokit();
  const { data } = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    {
      owner,
      repo,
      pull_number: Number(pullNumber),
      headers: { accept: 'application/vnd.github.v3.diff' },
    }
  );
  return String(data);
}

async function postReview(owner, repo, pullNumber, reviewData) {
  const octokit = buildOctokit();

  const lineComments = (reviewData.comments ?? [])
    .filter(c => c.path && c.line)
    .map(c => ({ path: c.path, line: c.line, side: 'RIGHT', body: c.body }));

  try {
    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: Number(pullNumber),
      body: reviewData.general_body || '',
      event: 'COMMENT',
      comments: lineComments,
    });
    console.log(`Posted review with ${lineComments.length} inline comment(s) to PR #${pullNumber}`);
  } catch (err) {
    if (err.status === 422) {
      console.warn('Inline comments failed (path mismatch) — falling back to general review body');
      const fallbackBody = [
        reviewData.general_body,
        ...lineComments.map(c => `**${c.path}**\n\n${c.body}`),
      ].filter(Boolean).join('\n\n---\n\n');

      await octokit.pulls.createReview({
        owner,
        repo,
        pull_number: Number(pullNumber),
        body: fallbackBody,
        event: 'COMMENT',
        comments: [],
      });
      console.log(`Posted fallback general review to PR #${pullNumber}`);
    } else {
      throw err;
    }
  }
}

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

  if (kept.length === 0 && findings.length > 0) {
    console.warn('Judge dropped all findings — falling back to unfiltered');
    return findings;
  }

  return kept;
}

// ── Task requirements ────────────────────────────────────────────────────────

const TASK_URL_PATTERN = /https:\/\/github\.com\/rolling-scopes-school\/tasks\/[^\s)>\]]+/;
const MAX_TASK_CHARS = 20000;

async function fetchTaskRequirements(owner, repo, pullNumber) {
  try {
    const octokit = buildOctokit();
    const { data } = await octokit.pulls.get({ owner, repo, pull_number: Number(pullNumber) });
    const body = data.body ?? '';
    const urlMatch = body.match(TASK_URL_PATTERN);
    if (!urlMatch) return null;

    const rawUrl = urlMatch[0]
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');

    const response = await fetch(rawUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;

    const text = await response.text();
    return text.length > MAX_TASK_CHARS
      ? text.slice(0, MAX_TASK_CHARS) + '\n\n[task requirements truncated]'
      : text;
  } catch {
    return null;
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  const owner     = process.env.REPO_OWNER;
  const repo      = process.env.REPO_NAME;
  const prNumber  = process.env.PR_NUMBER;
  const workspace = process.env.WORKSPACE || process.cwd();

  if (!owner || !repo || !prNumber) {
    console.error('ERROR: REPO_OWNER, REPO_NAME, PR_NUMBER must be set');
    process.exit(1);
  }

  console.log('Fetching PR diff...');
  const diff = await fetchPRDiff(owner, repo, prNumber);

  const workspaceStack = detectStack(workspace);
  const stack = workspaceStack ?? detectStackFromDiff(diff);
  console.log(`Detected stack: ${stack}${workspaceStack ? '' : ' (from diff)'}`);

  if (stack === 'angular') {
    console.log('Angular projects are not supported in this version. Skipping review.');
    process.exit(0);
  }

  const references = buildReferences(stack);

  console.log('Fetching task requirements from PR description...');
  const taskRequirements = await fetchTaskRequirements(owner, repo, prNumber);
  console.log(taskRequirements ? 'Task requirements loaded.' : 'No task requirements found — general review mode.');

  console.log('Calling AI for review...');
  const reviewData = await callAI(stack, references, diff, taskRequirements);

  const commentCount = reviewData.comments?.length ?? 0;
  if (commentCount === 0 && !reviewData.general_body) {
    console.log('No findings to post — skipping review.');
    process.exit(0);
  }

  console.log(`Posting ${commentCount} comment(s)...`);
  await postReview(owner, repo, prNumber, reviewData);
}

main().catch(err => {
  console.error('Review failed:', err.message);
  process.exit(1);
});
