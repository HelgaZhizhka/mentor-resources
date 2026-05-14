# M1 — Engine Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the engine's I/O and parsing core: shared types, Zod schemas, error hierarchy, HTTP/LLM/Octokit clients, RubricFetcher, EnrichmentLoader, RubricParser, PRFetcher — everything needed before M2 can write the async-race enrichment YAML and M3 can run mech checkers.

**Architecture:** Pure business logic in `packages/engine/src/`. Side-effects (HTTP, filesystem, GitHub API, Anthropic API) are reached through small interfaces injected at the entry point — no `fetch()` deep inside a parser. Shared types and Zod schemas at the top level so M3/M4 can consume them. Errors are typed and inherit from a single `PocketMentorError` base.

**Tech Stack:** TypeScript strict, ESM, Node ≥20, Zod (boundary validation), js-yaml (enrichment YAML), @octokit/rest (GitHub API), @anthropic-ai/sdk (Anthropic direct), openai (OpenRouter-compatible client). Native `fetch` for raw HTTP.

**Out of M1 (per SPEC §10):** mech checkers (M3), LLM review orchestration (M4), aggregator (M4), GitHub delivery (M5), CLI (M5). M1 is just I/O + parsing.

**Per-task rhythm (no tests per SPEC §7):**
- Write file(s)
- `pnpm --filter @pocket-mentor/engine typecheck` → exit 0
- `pnpm lint` → exit 0
- Commit
- Code-reviewer subagent runs at milestone wrap (Task 12), not per-task

---

## File Structure

```
packages/engine/
├── src/
│   ├── index.ts                  # public surface (re-exports)
│   ├── types.ts                  # shared TypeScript types (Criterion, Violation, PRContext, ...)
│   ├── schemas.ts                # Zod schemas (enrichment YAML, LLM parser output)
│   ├── errors.ts                 # error class hierarchy
│   ├── http.ts                   # HttpClient type + native-fetch impl
│   ├── llm/
│   │   └── client.ts             # LLMClient type + AnthropicLLMClient + OpenRouterLLMClient
│   ├── rubric/
│   │   ├── fetcher.ts            # RubricFetcher (HTTP + disk cache)
│   │   └── parser.ts             # RubricParser (LLM-driven)
│   ├── enrichment/
│   │   └── loader.ts             # EnrichmentLoader (YAML + Zod)
│   └── pr/
│       ├── url.ts                # parsePRUrl
│       └── fetcher.ts            # PRFetcher (Octokit)
└── package.json                  # +zod, +js-yaml, +@types/js-yaml, +@octokit/rest, +@anthropic-ai/sdk, +openai
```

**Decomposition principles applied:**
- Each file has one responsibility.
- Files small enough to hold in mind at once (target ≤ 150 lines each).
- Domain split (`rubric/`, `enrichment/`, `pr/`, `llm/`) instead of layer split.
- Errors / types / schemas centralised so M3/M4 import once from `engine/src/{errors,types,schemas}`.

**Import-extension convention:** all relative imports use `.js` suffix (e.g. `import { X } from './types.js'`). Works with `tsc` (`moduleResolution: bundler`) and Node-ESM after a future build.

**Important eslint rules to know while writing (from M0 root config + `strictTypeChecked`):**
- No `any`; use `unknown` and narrow.
- No `foo!` non-null assertions.
- No `interface`; use `type` (we enforce `consistent-type-definitions: type`).
- Inline type imports: `import { type X, Y } from './m.js'`.
- `unicorn/no-array-reduce: error`, `unicorn/no-array-for-each: error` → use `for...of`.
- `unicorn/prefer-number-properties: error` → `Number.parseInt`, `Number.isNaN`.
- `restrict-template-expressions: error` → only string-like values in `${...}`.
- `noUncheckedIndexedAccess: true` → `arr[0]` is `T | undefined`.
- `complexity: warn 10`, `max-params: warn 4` — warnings, not errors.

---

## Task 1: Install engine runtime dependencies

**Files:**
- Modify: `packages/engine/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Add runtime + types dependencies to packages/engine**

Run from repo root:

```bash
pnpm --filter @pocket-mentor/engine add zod@^3.23.0 js-yaml@^4.1.0 @octokit/rest@^21.0.0 @anthropic-ai/sdk@^0.32.0 openai@^4.0.0
pnpm --filter @pocket-mentor/engine add -D @types/js-yaml@^4.0.9
```

Expected: pnpm resolves and installs the five runtime deps and one types dep into `packages/engine/`, updates `pnpm-lock.yaml`, symlinks them under `packages/engine/node_modules/`.

`openai` is the official OpenAI Node SDK — it's also the standard way to consume OpenRouter, since OpenRouter exposes an OpenAI-compatible API. We use it only for `OpenRouterLLMClient`; all Anthropic-direct calls go through `@anthropic-ai/sdk`.

- [ ] **Step 2: Verify package.json shape**

`cat packages/engine/package.json` should now look approximately like:

```json
{
  "name": "@pocket-mentor/engine",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@octokit/rest": "^21.0.0",
    "js-yaml": "^4.1.0",
    "openai": "^4.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9"
  }
}
```

(Exact versions may differ — let pnpm pick the latest matching the range.)

- [ ] **Step 3: Verify nothing broke**

Run: `pnpm --filter @pocket-mentor/engine typecheck && pnpm lint`
Expected: both exit 0 (engine still has only `export {};`, packages just gained deps).

- [ ] **Step 4: Commit**

```bash
git add packages/engine/package.json pnpm-lock.yaml
git commit -m "feat(engine): add runtime deps (zod, js-yaml, octokit, anthropic-sdk, openai)"
```

---

## Task 2: Error class hierarchy

**Files:**
- Create: `packages/engine/src/errors.ts`

- [ ] **Step 1: Write errors.ts**

```ts
export class PocketMentorError extends Error {
  public readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PocketMentorError';
    this.cause = cause;
  }
}

export class RubricFetchError extends PocketMentorError {
  public readonly url: string;

  constructor(message: string, url: string, cause?: unknown) {
    super(message, cause);
    this.name = 'RubricFetchError';
    this.url = url;
  }
}

export class EnrichmentNotFoundError extends PocketMentorError {
  public readonly rubricId: string;
  public readonly availableRubrics: readonly string[];

  constructor(rubricId: string, availableRubrics: readonly string[]) {
    const available = availableRubrics.length > 0 ? availableRubrics.join(', ') : '(none)';
    super(`Enrichment not found for rubric '${rubricId}'. Available rubrics: ${available}`);
    this.name = 'EnrichmentNotFoundError';
    this.rubricId = rubricId;
    this.availableRubrics = availableRubrics;
  }
}

export class EnrichmentInvalidError extends PocketMentorError {
  public readonly rubricId: string;
  public readonly issues: readonly string[];

  constructor(rubricId: string, issues: readonly string[], cause?: unknown) {
    super(`Enrichment for '${rubricId}' failed validation:\n  - ${issues.join('\n  - ')}`, cause);
    this.name = 'EnrichmentInvalidError';
    this.rubricId = rubricId;
    this.issues = issues;
  }
}

export class LLMError extends PocketMentorError {
  public readonly requestId: string | undefined;

  constructor(message: string, requestId?: string, cause?: unknown) {
    super(message, cause);
    this.name = 'LLMError';
    this.requestId = requestId;
  }
}

export class LLMOutputInvalidError extends PocketMentorError {
  public readonly raw: string;
  public readonly issues: readonly string[];

  constructor(message: string, raw: string, issues: readonly string[]) {
    super(message);
    this.name = 'LLMOutputInvalidError';
    this.raw = raw;
    this.issues = issues;
  }
}

export class GitHubAuthError extends PocketMentorError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'GitHubAuthError';
  }
}

export class PRFetchError extends PocketMentorError {
  public readonly url: string;

  constructor(message: string, url: string, cause?: unknown) {
    super(message, cause);
    this.name = 'PRFetchError';
    this.url = url;
  }
}
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0.

If lint complains about `Error.cause` already existing on the base `Error` class (Node 16+): the local property shadows it intentionally with `unknown` instead of the standard `Error['cause']` (which is `unknown` too in TS lib types). If lint flags `@typescript-eslint/no-useless-constructor`, that's only for constructors that do nothing — ours all do work. Should pass clean.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/errors.ts
git commit -m "feat(engine): add typed error class hierarchy

PocketMentorError base + RubricFetchError, EnrichmentNotFoundError,
EnrichmentInvalidError, LLMError, LLMOutputInvalidError, GitHubAuthError,
PRFetchError. Each carries the contextual data the CLI needs to format
friendly messages (URLs, request IDs, validation issues)."
```

---

## Task 3: Shared types

**Files:**
- Create: `packages/engine/src/types.ts`

- [ ] **Step 1: Write types.ts**

```ts
export type CriterionMethod = 'mech' | 'llm' | 'hybrid';

export type PenaltyKind = 'fixed' | 'zero-category';

export type Penalty = {
  readonly kind: PenaltyKind;
  readonly points?: number;
  readonly reason: string;
};

export type Criterion = {
  readonly id: string;
  readonly title: string;
  readonly pointsMax: number;
  readonly text: string;
  readonly category?: string;
  readonly penalty?: Penalty;
};

export type EnrichmentEntry = {
  readonly method: CriterionMethod;
  readonly checkerId?: string;
  readonly llmFocus?: string;
};

export type Enrichment = {
  readonly rubricId: string;
  readonly sourceCommit: string;
  readonly sourcePath: string;
  readonly criteria: ReadonlyMap<string, EnrichmentEntry>;
};

export type ViolationSeverity = 'error' | 'warning' | 'info';

export type CommentSide = 'LEFT' | 'RIGHT';

export type Violation = {
  readonly criterionId: string;
  readonly ruleId: string;
  readonly file: string;
  readonly line: number;
  readonly side: CommentSide;
  readonly severity: ViolationSeverity;
  readonly message: string;
  readonly pointsDelta: number;
  readonly rationale?: string;
};

export type PRFileStatus =
  | 'added'
  | 'modified'
  | 'removed'
  | 'renamed'
  | 'copied'
  | 'changed'
  | 'unchanged';

export type PRFile = {
  readonly filename: string;
  readonly status: PRFileStatus;
  readonly additions: number;
  readonly deletions: number;
  readonly patch?: string;
  readonly previousFilename?: string;
};

export type PRContext = {
  readonly url: string;
  readonly owner: string;
  readonly repo: string;
  readonly number: number;
  readonly baseSha: string;
  readonly headSha: string;
  readonly title: string;
  readonly body: string | null;
  readonly diff: string;
  readonly files: readonly PRFile[];
};
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/types.ts
git commit -m "feat(engine): add shared types (Criterion, Violation, PRContext, Enrichment, ...)

Single source of truth for the type shapes that flow between engine modules
and out to the CLI. Mirrors SPEC §4 and CONTEXT.md Engine output schema.
Violation is added now so M3 mech-checkers can return it once they're built."
```

---

## Task 4: Zod schemas

**Files:**
- Create: `packages/engine/src/schemas.ts`

- [ ] **Step 1: Write schemas.ts**

```ts
import { z } from 'zod';

const criterionMethodSchema = z.enum(['mech', 'llm', 'hybrid']);

export const enrichmentEntrySchema = z
  .object({
    method: criterionMethodSchema,
    checker_id: z.string().min(1).optional(),
    llm_focus: z.string().min(1).optional(),
  })
  .refine(
    (entry) => {
      if (entry.method === 'mech') {
        return entry.checker_id !== undefined;
      }
      if (entry.method === 'llm') {
        return entry.llm_focus !== undefined;
      }
      return entry.checker_id !== undefined || entry.llm_focus !== undefined;
    },
    {
      message:
        "method='mech' requires checker_id; method='llm' requires llm_focus; method='hybrid' requires at least one",
    },
  );

const gitShaPattern = /^[a-f0-9]{40}$/;

export const enrichmentFileSchema = z.object({
  rubric_id: z.string().min(1),
  source_commit: z
    .string()
    .regex(gitShaPattern, 'source_commit must be a 40-char lowercase Git SHA'),
  source_path: z.string().min(1),
  criteria: z.record(z.string().min(1), enrichmentEntrySchema),
});

const penaltySchema = z.object({
  kind: z.enum(['fixed', 'zero-category']),
  points: z.number().optional(),
  reason: z.string().min(1),
});

export const criterionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  pointsMax: z.number().int().nonnegative(),
  text: z.string().min(1),
  category: z.string().min(1).optional(),
  penalty: penaltySchema.optional(),
});

export const criterionListSchema = z.array(criterionSchema);

export type EnrichmentFileRaw = z.infer<typeof enrichmentFileSchema>;
export type CriterionRaw = z.infer<typeof criterionSchema>;
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/schemas.ts
git commit -m "feat(engine): add Zod schemas for enrichment YAML and parsed criteria

Two boundary schemas: enrichmentFileSchema (validates rubrics/*.yaml input)
and criterionListSchema (validates LLM JSON output from RubricParser). The
refine() on enrichment entries enforces the per-method invariants
(mech => checker_id; llm => llm_focus; hybrid => one of either) at parse time."
```

---

## Task 5: HttpClient

**Files:**
- Create: `packages/engine/src/http.ts`

- [ ] **Step 1: Write http.ts**

```ts
export type HttpResponse = {
  readonly status: number;
  readonly text: string;
};

export type HttpClient = {
  get(url: string, headers?: Readonly<Record<string, string>>): Promise<HttpResponse>;
};

export const fetchHttpClient: HttpClient = {
  async get(url, headers) {
    const response = await fetch(url, { headers });
    const text = await response.text();
    return { status: response.status, text };
  },
};
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0.

`fetch` is available globally on Node 20+ — no import needed. If lint flags missing `lib: ['DOM']`, our tsconfig already has Node's globals. If `fetch` is reported unknown, run `node --version` and confirm ≥20.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/http.ts
git commit -m "feat(engine): add HttpClient interface with native-fetch implementation

HttpClient is intentionally tiny (one method, returns status + text) so it
can be stubbed in tests later and so RubricFetcher doesn't import fetch
directly. fetchHttpClient is the default production implementation."
```

---

## Task 6: LLMClient (interface + AnthropicLLMClient + OpenRouterLLMClient)

**Files:**
- Create: `packages/engine/src/llm/client.ts`

- [ ] **Step 1: Write llm/client.ts**

```ts
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import { LLMError } from '../errors.js';

// ─── Shared interface ────────────────────────────────────────────────────────

export type LLMRequest = {
  readonly system: string;
  readonly user: string;
  readonly maxTokens?: number;
};

export type LLMResponse = {
  readonly text: string;
  readonly model: string;
  readonly stopReason: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
};

export type LLMClient = {
  complete(request: LLMRequest): Promise<LLMResponse>;
};

// ─── Anthropic direct ────────────────────────────────────────────────────────

export type AnthropicLLMClientOptions = {
  readonly apiKey: string;
  readonly model?: string;
  readonly defaultMaxTokens?: number;
};

const ANTHROPIC_DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 4096;

export class AnthropicLLMClient implements LLMClient {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly defaultMaxTokens: number;

  constructor(options: AnthropicLLMClientOptions) {
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.model = options.model ?? ANTHROPIC_DEFAULT_MODEL;
    this.defaultMaxTokens = options.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const message = await this.callAnthropic(request);
    const textBlock = message.content.find((block) => block.type === 'text');
    if (textBlock === undefined) {
      throw new LLMError('LLM response contained no text block', message.id);
    }
    return {
      text: textBlock.text,
      model: message.model,
      stopReason: message.stop_reason,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    };
  }

  private async callAnthropic(request: LLMRequest): Promise<Anthropic.Message> {
    try {
      return await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens ?? this.defaultMaxTokens,
        system: request.system,
        messages: [{ role: 'user', content: request.user }],
      });
    } catch (cause) {
      const requestId =
        cause instanceof Anthropic.APIError ? (cause.request_id ?? undefined) : undefined;
      const message = cause instanceof Error ? cause.message : String(cause);
      throw new LLMError(`Anthropic API call failed: ${message}`, requestId, cause);
    }
  }
}

// ─── OpenRouter (OpenAI-compatible) ─────────────────────────────────────────

export type OpenRouterLLMClientOptions = {
  readonly apiKey: string;
  readonly model?: string;
  readonly defaultMaxTokens?: number;
  readonly siteUrl?: string;
  readonly siteName?: string;
};

// Default model via OpenRouter — uses Claude Sonnet through OR's routing.
// Mentors can override via OPENROUTER_MODEL env var or CLI flag.
const OPENROUTER_DEFAULT_MODEL = 'anthropic/claude-sonnet-4-5';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterLLMClient implements LLMClient {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly defaultMaxTokens: number;

  constructor(options: OpenRouterLLMClientOptions) {
    this.client = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: options.apiKey,
      defaultHeaders: {
        ...(options.siteUrl !== undefined ? { 'HTTP-Referer': options.siteUrl } : {}),
        ...(options.siteName !== undefined ? { 'X-Title': options.siteName } : {}),
      },
    });
    this.model = options.model ?? OPENROUTER_DEFAULT_MODEL;
    this.defaultMaxTokens = options.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: request.maxTokens ?? this.defaultMaxTokens,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
      });
      const choice = completion.choices[0];
      if (choice === undefined || choice.message.content === null) {
        throw new LLMError('OpenRouter response contained no content', undefined);
      }
      return {
        text: choice.message.content,
        model: completion.model,
        stopReason: choice.finish_reason,
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
      };
    } catch (cause) {
      if (cause instanceof LLMError) {
        throw cause;
      }
      const message = cause instanceof Error ? cause.message : String(cause);
      throw new LLMError(`OpenRouter API call failed: ${message}`, undefined, cause);
    }
  }
}
```

**OpenRouter model strings** (pass as `model` option or `OPENROUTER_MODEL` env):
- `anthropic/claude-sonnet-4-5` — default, same family as AnthropicLLMClient
- `anthropic/claude-opus-4` — higher quality, more expensive
- `openai/gpt-4o` — OpenAI alternative
- `meta-llama/llama-3.1-70b-instruct` — open-source option
- Full list: https://openrouter.ai/models

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0.

Possible eslint friction:
- `@typescript-eslint/no-unsafe-*` against Anthropic or OpenAI SDK types. Both SDKs are fully typed — should pass.
- `restrict-template-expressions` against `String(cause)` — change to typeguard if it fires.
- `noUncheckedIndexedAccess` will flag `completion.choices[0]` — that's exactly why we check for `undefined` explicitly.
- Spread in `defaultHeaders` — lint may flag the ternary spread pattern. If so, compute the headers object before passing it.

If lint complains, fix in place and re-run.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/llm/client.ts
git commit -m "feat(engine): add LLMClient interface, AnthropicLLMClient, OpenRouterLLMClient

Both clients implement the same LLMClient interface (one method: complete).
AnthropicLLMClient uses @anthropic-ai/sdk directly. OpenRouterLLMClient uses
the openai package pointed at openrouter.ai — gives access to 100+ models
(Claude, GPT-4o, Llama, Gemini) through a single API key. CLI will select
the provider based on which env var is present (ANTHROPIC_API_KEY vs
OPENROUTER_API_KEY) — wired in M5."
```

---

## Task 7: EnrichmentLoader

**Files:**
- Create: `packages/engine/src/enrichment/loader.ts`

- [ ] **Step 1: Write enrichment/loader.ts**

```ts
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import yaml from 'js-yaml';
import { ZodError } from 'zod';

import { EnrichmentInvalidError, EnrichmentNotFoundError } from '../errors.js';
import { enrichmentFileSchema } from '../schemas.js';
import { type Enrichment, type EnrichmentEntry } from '../types.js';

export type EnrichmentLoaderOptions = {
  readonly rubricsDir: string;
};

const ENRICHMENT_SUFFIX = '.enrichment.yaml';

export class EnrichmentLoader {
  private readonly rubricsDir: string;

  constructor(options: EnrichmentLoaderOptions) {
    this.rubricsDir = options.rubricsDir;
  }

  async load(rubricId: string): Promise<Enrichment> {
    const filePath = path.join(this.rubricsDir, `${rubricId}${ENRICHMENT_SUFFIX}`);
    const raw = await this.readFile(filePath, rubricId);
    const parsed = this.parseYaml(raw, rubricId);
    const validated = this.validate(parsed, rubricId);
    return this.toEnrichment(validated);
  }

  private async readFile(filePath: string, rubricId: string): Promise<string> {
    try {
      return await readFile(filePath, 'utf8');
    } catch (cause) {
      if (isFsErrorCode(cause, 'ENOENT')) {
        const available = await this.listAvailableRubrics();
        throw new EnrichmentNotFoundError(rubricId, available);
      }
      throw new EnrichmentInvalidError(
        rubricId,
        [`could not read ${filePath}: ${describeError(cause)}`],
        cause,
      );
    }
  }

  private async listAvailableRubrics(): Promise<string[]> {
    try {
      const entries = await readdir(this.rubricsDir);
      return entries
        .filter((name) => name.endsWith(ENRICHMENT_SUFFIX))
        .map((name) => name.slice(0, -ENRICHMENT_SUFFIX.length))
        .sort();
    } catch {
      return [];
    }
  }

  private parseYaml(raw: string, rubricId: string): unknown {
    try {
      return yaml.load(raw);
    } catch (cause) {
      throw new EnrichmentInvalidError(rubricId, [`YAML parse failed: ${describeError(cause)}`], cause);
    }
  }

  private validate(value: unknown, rubricId: string): ReturnType<typeof enrichmentFileSchema.parse> {
    try {
      return enrichmentFileSchema.parse(value);
    } catch (cause) {
      if (cause instanceof ZodError) {
        const issues = cause.errors.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
        throw new EnrichmentInvalidError(rubricId, issues, cause);
      }
      throw new EnrichmentInvalidError(rubricId, [describeError(cause)], cause);
    }
  }

  private toEnrichment(raw: ReturnType<typeof enrichmentFileSchema.parse>): Enrichment {
    const criteria = new Map<string, EnrichmentEntry>();
    for (const [criterionId, entry] of Object.entries(raw.criteria)) {
      criteria.set(criterionId, {
        method: entry.method,
        checkerId: entry.checker_id,
        llmFocus: entry.llm_focus,
      });
    }
    return {
      rubricId: raw.rubric_id,
      sourceCommit: raw.source_commit,
      sourcePath: raw.source_path,
      criteria,
    };
  }
}

const isFsErrorCode = (value: unknown, code: string): boolean =>
  typeof value === 'object' && value !== null && 'code' in value && value.code === code;

const describeError = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/enrichment/loader.ts
git commit -m "feat(engine): add EnrichmentLoader

Reads rubrics/<id>.enrichment.yaml from a configurable rubricsDir, parses
js-yaml, validates with Zod, converts snake_case YAML fields to camelCase
typed Enrichment. ENOENT yields EnrichmentNotFoundError listing available
rubric IDs from the directory; Zod failures yield EnrichmentInvalidError
with the full issue path list."
```

---

## Task 8: RubricFetcher

**Files:**
- Create: `packages/engine/src/rubric/fetcher.ts`

- [ ] **Step 1: Write rubric/fetcher.ts**

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import { RubricFetchError } from '../errors.js';
import { type HttpClient } from '../http.js';

export type RubricFetcherOptions = {
  readonly httpClient: HttpClient;
  readonly cacheDir?: string;
};

const RAW_HOST = 'https://raw.githubusercontent.com';
const SCHOOL_REPO = 'rolling-scopes-school/tasks';
const HTTP_OK = 200;

export class RubricFetcher {
  private readonly httpClient: HttpClient;
  private readonly cacheDir: string;

  constructor(options: RubricFetcherOptions) {
    this.httpClient = options.httpClient;
    this.cacheDir = options.cacheDir ?? path.join(homedir(), '.pocket-mentor', 'cache');
  }

  async fetch(commitSha: string, repoPath: string): Promise<string> {
    const cachePath = this.cachePathFor(commitSha, repoPath);
    const cached = await readCached(cachePath);
    if (cached !== undefined) {
      return cached;
    }
    const url = buildRawUrl(commitSha, repoPath);
    const response = await this.requestRubric(url);
    await writeCached(cachePath, response);
    return response;
  }

  private async requestRubric(url: string): Promise<string> {
    let response;
    try {
      response = await this.httpClient.get(url);
    } catch (cause) {
      throw new RubricFetchError(`HTTP request failed for ${url}`, url, cause);
    }
    if (response.status !== HTTP_OK) {
      throw new RubricFetchError(
        `Unexpected status ${response.status.toString()} fetching ${url}`,
        url,
      );
    }
    return response.text;
  }

  private cachePathFor(commitSha: string, repoPath: string): string {
    return path.join(this.cacheDir, commitSha, repoPath);
  }
}

const buildRawUrl = (commitSha: string, repoPath: string): string => {
  const normalisedPath = repoPath.startsWith('/') ? repoPath.slice(1) : repoPath;
  return `${RAW_HOST}/${SCHOOL_REPO}/${commitSha}/${normalisedPath}`;
};

const readCached = async (cachePath: string): Promise<string | undefined> => {
  try {
    return await readFile(cachePath, 'utf8');
  } catch {
    return undefined;
  }
};

const writeCached = async (cachePath: string, content: string): Promise<void> => {
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, content, 'utf8');
};
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/rubric/fetcher.ts
git commit -m "feat(engine): add RubricFetcher

Fetches markdown rubric files from rolling-scopes-school/tasks at a pinned
commit SHA via the injected HttpClient, caches successful responses on disk
under ~/.pocket-mentor/cache/<sha>/<path>. Cache reads are read-through and
silent on miss (any FS error is treated as a miss). HTTP non-200 yields
RubricFetchError carrying the attempted URL."
```

---

## Task 9: RubricParser

**Files:**
- Create: `packages/engine/src/rubric/parser.ts`

- [ ] **Step 1: Write rubric/parser.ts**

```ts
import { ZodError } from 'zod';

import { LLMOutputInvalidError } from '../errors.js';
import { type LLMClient } from '../llm/client.js';
import { criterionListSchema } from '../schemas.js';
import { type Criterion } from '../types.js';

export type RubricParserOptions = {
  readonly llmClient: LLMClient;
};

const SYSTEM_PROMPT = `You are an extractor that converts an RS School non-functional-requirements
markdown document into a structured JSON array of criteria.

Output schema (TypeScript-style):

  Array<{
    id: string,                  // stable kebab-case identifier you create
    title: string,               // short title from the bullet/header
    pointsMax: number,           // integer >= 0
    text: string,                // verbatim markdown text of the criterion
    category?: string,           // section heading the criterion lives under
    penalty?: {                  // present only for penalty items (e.g. "-100% for React")
      kind: "fixed" | "zero-category",
      points?: number,           // for kind="fixed" only
      reason: string,
    }
  }>

Rules:
- Emit one element per graded item in the source markdown.
- For additive items "(+N)": pointsMax = N, no penalty.
- For penalty items "-N% for X" or "-100% for using React": pointsMax = 0
  and provide the "penalty" object. Use kind="zero-category" only when the
  penalty zeroes an entire category (e.g. "-100% for React" voids the whole
  non-functional grade); otherwise use kind="fixed".
- "id" must be stable kebab-case so future re-parses don't churn IDs.
- "category" should be the nearest enclosing section heading (e.g. "TypeScript",
  "Linter", "Git") when present.
- Return ONLY a JSON array. No prose, no Markdown code fences.`;

const MAX_PARSE_TOKENS = 8192;

export class RubricParser {
  private readonly llmClient: LLMClient;

  constructor(options: RubricParserOptions) {
    this.llmClient = options.llmClient;
  }

  async parse(rubricMarkdown: string): Promise<readonly Criterion[]> {
    const userPrompt = buildUserPrompt(rubricMarkdown);
    const response = await this.llmClient.complete({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: MAX_PARSE_TOKENS,
    });
    const json = parseJson(response.text);
    return validateCriteria(json, response.text);
  }
}

const buildUserPrompt = (rubricMarkdown: string): string =>
  `Extract criteria from the following markdown document:\n\n${rubricMarkdown}`;

const parseJson = (raw: string): unknown => {
  const stripped = stripCodeFences(raw).trim();
  try {
    return JSON.parse(stripped);
  } catch (cause) {
    const issue = cause instanceof Error ? cause.message : String(cause);
    throw new LLMOutputInvalidError(
      `RubricParser: LLM output was not valid JSON: ${issue}`,
      raw,
      [issue],
    );
  }
};

const stripCodeFences = (raw: string): string => {
  const fenced = /^```(?:json)?\n([\S\s]*?)\n```$/.exec(raw.trim());
  return fenced?.[1] ?? raw;
};

const validateCriteria = (value: unknown, raw: string): readonly Criterion[] => {
  try {
    return criterionListSchema.parse(value);
  } catch (cause) {
    if (cause instanceof ZodError) {
      const issues = cause.errors.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
      throw new LLMOutputInvalidError(
        'RubricParser: LLM JSON output failed schema validation',
        raw,
        issues,
      );
    }
    throw cause;
  }
};
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/rubric/parser.ts
git commit -m "feat(engine): add RubricParser (LLM-driven)

Composes a deterministic system prompt + user prompt, calls the injected
LLMClient, strips optional markdown code fences, parses JSON, validates via
criterionListSchema. Failures throw LLMOutputInvalidError carrying the raw
text and the Zod issue list — M4's orchestrator will add retry-with-stricter
prompt; M1 fails fast."
```

---

## Task 10: PR URL parsing + PRFetcher

**Files:**
- Create: `packages/engine/src/pr/url.ts`
- Create: `packages/engine/src/pr/fetcher.ts`

- [ ] **Step 1: Write pr/url.ts**

```ts
import { PRFetchError } from '../errors.js';

export type PRLocation = {
  readonly owner: string;
  readonly repo: string;
  readonly number: number;
};

const PULL_SEGMENT_INDEX = 2;
const MIN_SEGMENT_COUNT = 4;
const DECIMAL_RADIX = 10;

export const parsePRUrl = (rawUrl: string): PRLocation => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (cause) {
    throw new PRFetchError(`Not a valid URL: ${rawUrl}`, rawUrl, cause);
  }
  if (parsed.hostname !== 'github.com') {
    throw new PRFetchError(`Not a github.com URL: ${rawUrl}`, rawUrl);
  }
  const segments = parsed.pathname.split('/').filter((segment) => segment.length > 0);
  if (segments.length < MIN_SEGMENT_COUNT || segments[PULL_SEGMENT_INDEX] !== 'pull') {
    throw new PRFetchError(`Not a pull-request URL: ${rawUrl}`, rawUrl);
  }
  const [owner, repo, , numberRaw] = segments;
  if (owner === undefined || repo === undefined || numberRaw === undefined) {
    throw new PRFetchError(`Malformed pull-request URL: ${rawUrl}`, rawUrl);
  }
  const number = Number.parseInt(numberRaw, DECIMAL_RADIX);
  if (!Number.isInteger(number) || number <= 0) {
    throw new PRFetchError(`PR number is not a positive integer: ${numberRaw}`, rawUrl);
  }
  return { owner, repo, number };
};
```

- [ ] **Step 2: Write pr/fetcher.ts**

```ts
import { type Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';

import { GitHubAuthError, PRFetchError } from '../errors.js';
import { type PRContext, type PRFile, type PRFileStatus } from '../types.js';

import { parsePRUrl } from './url.js';

export type PRFetcherOptions = {
  readonly octokit: Octokit;
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

export class PRFetcher {
  private readonly octokit: Octokit;

  constructor(options: PRFetcherOptions) {
    this.octokit = options.octokit;
  }

  async fetch(prUrl: string): Promise<PRContext> {
    const location = parsePRUrl(prUrl);
    const [metadata, files, diff] = await Promise.all([
      this.fetchMetadata(location, prUrl),
      this.fetchFiles(location, prUrl),
      this.fetchDiff(location, prUrl),
    ]);
    return {
      url: prUrl,
      owner: location.owner,
      repo: location.repo,
      number: location.number,
      baseSha: metadata.base.sha,
      headSha: metadata.head.sha,
      title: metadata.title,
      body: metadata.body,
      diff,
      files,
    };
  }

  private async fetchMetadata(
    location: { owner: string; repo: string; number: number },
    prUrl: string,
  ): Promise<{
    title: string;
    body: string | null;
    base: { sha: string };
    head: { sha: string };
  }> {
    try {
      const response = await this.octokit.pulls.get({
        owner: location.owner,
        repo: location.repo,
        pull_number: location.number,
      });
      return {
        title: response.data.title,
        body: response.data.body,
        base: { sha: response.data.base.sha },
        head: { sha: response.data.head.sha },
      };
    } catch (cause) {
      throw wrapGitHubError(cause, prUrl, `Failed to fetch PR metadata for ${prUrl}`);
    }
  }

  private async fetchFiles(
    location: { owner: string; repo: string; number: number },
    prUrl: string,
  ): Promise<readonly PRFile[]> {
    try {
      const files = await this.octokit.paginate(this.octokit.pulls.listFiles, {
        owner: location.owner,
        repo: location.repo,
        pull_number: location.number,
        per_page: 100,
      });
      return files.map(
        (file): PRFile => ({
          filename: file.filename,
          status: file.status as PRFileStatus,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch,
          previousFilename: file.previous_filename,
        }),
      );
    } catch (cause) {
      throw wrapGitHubError(cause, prUrl, `Failed to list PR files for ${prUrl}`);
    }
  }

  private async fetchDiff(
    location: { owner: string; repo: string; number: number },
    prUrl: string,
  ): Promise<string> {
    try {
      const response = await this.octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}',
        {
          owner: location.owner,
          repo: location.repo,
          pull_number: location.number,
          headers: { accept: 'application/vnd.github.v3.diff' },
        },
      );
      if (typeof response.data !== 'string') {
        throw new PRFetchError(
          `Unexpected non-string diff response for ${prUrl}`,
          prUrl,
        );
      }
      return response.data;
    } catch (cause) {
      throw wrapGitHubError(cause, prUrl, `Failed to fetch PR diff for ${prUrl}`);
    }
  }
}

const wrapGitHubError = (cause: unknown, prUrl: string, message: string): Error => {
  if (cause instanceof RequestError) {
    if (cause.status === HTTP_UNAUTHORIZED || cause.status === HTTP_FORBIDDEN) {
      return new GitHubAuthError(
        `GitHub authentication failed (status ${cause.status.toString()}). Check 'gh auth status' or GITHUB_TOKEN.`,
        cause,
      );
    }
    return new PRFetchError(`${message}: HTTP ${cause.status.toString()} ${cause.message}`, prUrl, cause);
  }
  return new PRFetchError(`${message}: ${describeError(cause)}`, prUrl, cause);
};

const describeError = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0.

Watch for:
- `complexity` warning on `PRFetcher.fetch` (4 awaited operations + Promise.all is borderline). If it triggers, leave it — warnings don't fail builds, and refactor would obscure intent.
- `@octokit/request-error` ships its own types. If the import path is wrong, the actual package name might be just `@octokit/types` re-export. Adjust to `import { RequestError } from '@octokit/request-error';` (canonical) and ensure pnpm installed it as a transitive of `@octokit/rest`. If unresolved, run `pnpm --filter @pocket-mentor/engine add @octokit/request-error`.

- [ ] **Step 4: Commit**

```bash
git add packages/engine/src/pr/url.ts packages/engine/src/pr/fetcher.ts packages/engine/package.json pnpm-lock.yaml
git commit -m "feat(engine): add PRFetcher and parsePRUrl helper

parsePRUrl handles only github.com /owner/repo/pull/N URLs and throws
PRFetchError on malformed input. PRFetcher does three parallel Octokit calls
(metadata, paginated files, raw diff via media-type Accept) and assembles
the PRContext SPEC §4 specifies. 401/403 errors map to GitHubAuthError so
the CLI can suggest 'gh auth status'."
```

---

## Task 11: Public surface (index.ts)

**Files:**
- Modify: `packages/engine/src/index.ts`

- [ ] **Step 1: Replace src/index.ts contents**

```ts
export {
  EnrichmentInvalidError,
  EnrichmentNotFoundError,
  GitHubAuthError,
  LLMError,
  LLMOutputInvalidError,
  PocketMentorError,
  PRFetchError,
  RubricFetchError,
} from './errors.js';

export {
  fetchHttpClient,
  type HttpClient,
  type HttpResponse,
} from './http.js';

export {
  AnthropicLLMClient,
  type AnthropicLLMClientOptions,
  type LLMClient,
  type LLMRequest,
  type LLMResponse,
  OpenRouterLLMClient,
  type OpenRouterLLMClientOptions,
} from './llm/client.js';

export {
  EnrichmentLoader,
  type EnrichmentLoaderOptions,
} from './enrichment/loader.js';

export {
  RubricFetcher,
  type RubricFetcherOptions,
} from './rubric/fetcher.js';

export {
  RubricParser,
  type RubricParserOptions,
} from './rubric/parser.js';

export {
  PRFetcher,
  type PRFetcherOptions,
} from './pr/fetcher.js';

export {
  parsePRUrl,
  type PRLocation,
} from './pr/url.js';

export type {
  CommentSide,
  Criterion,
  CriterionMethod,
  Enrichment,
  EnrichmentEntry,
  Penalty,
  PenaltyKind,
  PRContext,
  PRFile,
  PRFileStatus,
  Violation,
  ViolationSeverity,
} from './types.js';
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Expected: both exit 0. `import { ... } from '@pocket-mentor/engine'` will now expose everything M2–M5 needs.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/index.ts
git commit -m "feat(engine): publish public surface from src/index.ts

Re-exports the four fetchers/loaders/parsers, the LLM and HTTP client
factories, the typed error hierarchy, and the shared domain types.
Internal Zod schemas are deliberately not re-exported — boundary
validation is engine's job, callers should pass already-typed values."
```

---

## Task 12: Milestone wrap — code review, state, handoff to M2

**Files:**
- Modify: `feature_list.json`
- Modify: `progress.md`

- [ ] **Step 1: Run full init.sh end-to-end**

```bash
./init.sh
```

Expected: install OK, lint OK, typecheck OK for both packages, "clean state" printed.

- [ ] **Step 2: Confirm working tree clean**

```bash
git status
```

Expected: clean except optional untracked `docs/superpowers/`.

- [ ] **Step 3: Dispatch feature-dev:code-reviewer subagent on the full M1 diff**

Use `git log --oneline` to determine the base SHA (the last commit before Task 1 of this plan — should be the M0 wrap commit). Then dispatch a `feature-dev:code-reviewer` subagent with the M1 diff scope. Triage each flagged issue: fix in place (creating a NEW commit, not amending) or record a push-back reason.

- [ ] **Step 4: Update feature_list.json**

Mark M1 done and M2 in-progress:

```jsonc
// M1 entry:
"status": "done",
"evidence": "commits <first-m1-sha>..<head-sha>; ./init.sh green; feature-dev:code-reviewer reviewed full M1 diff; all flagged issues triaged"

// M2 entry:
"status": "in-progress"
```

- [ ] **Step 5: Append Session 3 entry to progress.md**

Add a `## Session 3 — 2026-05-13 — M1: Engine core (rubric/PR fetch + parse)` block with: done, decisions, next session, blockers, files. Mirror Session 2's structure.

Suggested decisions to record:
- LLMClient defaults to `claude-sonnet-4-6` (parser doesn't need opus quality; M4 orchestrator will override)
- `noEmit: true` still in tsconfig.base.json — engine consumed as TS source via workspace symlink (no build pipeline yet)
- PRFetcher uses three parallel Octokit calls (metadata + files + diff). The diff call uses media-type Accept header on the raw request endpoint.
- Cache path is `~/.pocket-mentor/cache/<sha>/<repoPath>` — overridable via `RubricFetcherOptions.cacheDir`

Suggested next-session items:
- M2 = async-race enrichment YAML. Helga-expertise bottleneck — engine code is ~zero.
- Pin the school commit SHA: open https://github.com/rolling-scopes-school/tasks/commits/master and copy the latest SHA touching `stage2/tasks/async-race/non-functional-requirements.md`.
- Then write `rubrics/async-race.enrichment.yaml` per the schema in `schemas.ts`.

- [ ] **Step 6: Final state commit**

```bash
git add feature_list.json progress.md
git commit -m "chore(m1): mark M1 done, hand off to M2"
```

- [ ] **Step 7: Final init.sh re-run for clean state**

```bash
./init.sh
```

Expected: exits 0. The branch is now ready for M2.

---

## Self-Review Checklist

After writing the complete plan, reviewing against SPEC §10 M1 scope:

**Spec coverage:**
- [x] `RubricFetcher` with on-disk cache → Task 8
- [x] `EnrichmentLoader` with Zod validation → Task 7
- [x] `RubricParser` (LLM-driven) → Task 9 (plus Task 6 for the LLM client it needs)
- [x] `PRFetcher` (Octokit) → Task 10
- [x] Shared types in `engine/src/types.ts` → Task 3
- [x] Zod schemas in `engine/src/schemas.ts` → Task 4
- [x] Error class hierarchy → Task 2 (was not explicit in SPEC §10 but called for in SPEC §6)
- [x] HttpClient abstraction → Task 5 (required for DI per SPEC §3 "no fetch() deep inside parsers")
- [x] LLMClient abstraction → Task 6 (required for RubricParser; reused by M4)
- [x] Public surface (index.ts) → Task 11
- [x] Milestone DoD: init.sh green, code-reviewer subagent, feature_list/progress updated → Task 12

**Placeholders:** none. Every step shows the full code or the exact command.

**Type consistency:**
- `Criterion` shape defined in Task 3 (types.ts) and matches `criterionSchema` in Task 4 (schemas.ts). Properties: id, title, pointsMax, text, category?, penalty?.
- `EnrichmentEntry` defined in Task 3 (camelCase: checkerId, llmFocus) and YAML schema in Task 4 (snake_case: checker_id, llm_focus). Task 7 (loader.ts) does the conversion.
- `Enrichment.criteria` is `ReadonlyMap<string, EnrichmentEntry>` in types.ts and built via `new Map(...)` in Task 7 — consistent.
- `PRContext` shape in Task 3 matches what Task 10's PRFetcher.fetch returns — same field names, same types.
- `LLMClient.complete` signature in Task 6 matches what RubricParser calls in Task 9 (`{ system, user, maxTokens }` → `{ text, model, stopReason, ... }`).
- All error classes from Task 2 are re-exported in Task 11.

**Discipline:**
- No unit tests added (per SPEC §7 + global CLAUDE.md).
- No retry logic in M1 RubricParser — deferred to M4 per SPEC §6.
- No business-logic mech checkers — those are M3.
- No optional smoke test against real markdown — SPEC §7 explicitly defers end-to-end to M5+.

**Risks called out for the engineer:**
- `@octokit/request-error` import path may need adjustment / explicit install (noted in Task 10 step 3).
- `complexity` warning may fire on `PRFetcher.fetch` (noted in Task 10).
- `restrict-template-expressions` may flag `String(cause)` patterns — adjust with typeguard if it does.
- All relative imports use `.js` extensions for future build compatibility.
