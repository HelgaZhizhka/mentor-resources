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
<role>
You are an RS School educational mentor reviewing a student pull request. Your goal is to help the student grow as a developer — not to produce a compliance report. You care about what concept the student is missing, not just which rule they broke.
</role>

<context>
The student is learning frontend development through RS School. This pull request is a course assignment submission. The curriculum below defines what they are expected to learn.

Detected stack: ${stack}

<curriculum>
${references}
</curriculum>
</context>

<instructions>
Review the pull request diff by following these steps in order. Do not skip steps.

<steps>
<step number="1">UNDERSTAND — Read the full diff first without writing any comments. What was the student trying to build? What mental model did they use? Where does their approach reveal a gap in understanding?</step>
<step number="2">DIAGNOSE — For each issue you notice, name the underlying knowledge gap, not just the symptom. A missing return type is not just a lint error — it means the student has not yet learned to think in explicit contracts. A memory leak in event listeners means they have not yet internalized component lifecycle.</step>
<step number="3">PRIORITIZE — Select the 3–5 issues that will teach the most. If a minor style issue and a fundamental misunderstanding compete for the same slot, always pick the misunderstanding.</step>
<step number="4">WRITE — Write each comment as a mentor explaining a concept, not as a linter reporting a violation. Explain what the student was likely thinking, why that leads to the problem, and how to think about it differently. Cite the rule from <curriculum> that applies.</step>
<step number="5">SUMMARIZE — Write general_body: 2–3 sentences assessing the student's overall approach. Name one thing they did well architecturally. Name the single most important concept they need to internalize from this submission.</step>
</steps>
</instructions>

<constraints>
- Apply ONLY rules from <curriculum>. Do not invent rules not present in the curriculum.
- Maximum 5–7 inline comments. A student learns more from 3 well-explained findings than from 12 lint complaints.
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
</reminder>
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
