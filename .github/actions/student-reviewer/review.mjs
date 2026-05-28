import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Stack detection ──────────────────────────────────────────────────────────

function detectStack(workspace) {
  const pkgPath = join(workspace, 'package.json');
  if (!existsSync(pkgPath)) return 'html-css';

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const deps = {
    ...pkg.dependencies ?? {},
    ...pkg.devDependencies ?? {},
  };

  if ('@angular/core' in deps) return 'angular';
  if ('react' in deps && 'typescript' in deps) return 'react-ts';
  if ('typescript' in deps) return 'typescript';
  return 'vanilla-js';
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

const SYSTEM_PROMPT = (stack, references) => `
You are an RS School code reviewer. Review the student's pull request and produce inline review comments.

## Stack
${stack}

## Rules — apply ONLY these to the detected stack
${references}

## Severity levels
- 🔴 Critical — must fix before merge
- 🟡 Recommendation — should improve
- 🔵 Note — minor / informational

## Finding format (Mode A — use for every finding)
**What:** one sentence describing the problem
**Why bad:** why this matters (cite rule from references above)
**How to fix:** specific action

Include a suggestion block only for simple single-line fixes:
\`\`\`suggestion
corrected line here
\`\`\`

## Anti-repetition
If the same pattern appears 3+ times: write one full finding for the worst instance, append "(N more occurrences: file:line, …)". Do NOT write a separate finding per occurrence.

## Output format
Respond with a JSON object ONLY — no markdown wrapper, no explanation:
{
  "comments": [
    {
      "path": "src/api.ts",
      "line": 12,
      "body": "🔴 **Critical**: ...\\n\\n**What:** ...\\n**Why bad:** ...\\n**How to fix:** ..."
    }
  ],
  "general_body": "prose for architectural findings without a specific line, or empty string"
}
`.trim();

async function callAI(stack, references, prDiff) {
  const client = buildClient();
  const model  = process.env.AI_MODEL || 'gpt-4o';

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT(stack, references) },
      { role: 'user',   content: `Review this pull request diff:\n\n${prDiff}` },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

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

  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: Number(pullNumber),
    body: reviewData.general_body || '',
    event: 'COMMENT',
    comments: lineComments,
  });

  console.log(`Posted review with ${lineComments.length} inline comment(s) to PR #${pullNumber}`);
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

  const stack = detectStack(workspace);
  console.log(`Detected stack: ${stack}`);

  if (stack === 'angular') {
    console.log('Angular projects are not supported in this version. Skipping review.');
    process.exit(0);
  }

  const references = buildReferences(stack);
  console.log('Fetching PR diff...');
  const diff = await fetchPRDiff(owner, repo, prNumber);

  console.log('Calling AI for review...');
  const reviewData = await callAI(stack, references, diff);

  console.log(`Posting ${reviewData.comments?.length ?? 0} comment(s)...`);
  await postReview(owner, repo, prNumber, reviewData);
}

main().catch(err => {
  console.error('Review failed:', err.message);
  process.exit(1);
});
