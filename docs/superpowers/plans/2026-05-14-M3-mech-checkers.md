# M3 — Mech-Checkers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 8 **parametrised** mechanical checkers referenced from `rubrics/async-race.enrichment.yaml`, plus a `RepoReader` abstraction and a checker registry. Each checker is a generic function with no hardcoded rubric values — all rubric-specific configuration lives in the YAML.

**Architecture:** Per the M3 architectural decision (`SPEC §11`, 2026-05-14): **Variant C** philosophy. We trust ESLint config for non-penalty rules (function length, code-style enforcement) and only verify the rule is configured. For penalty checks (`forbidden-imports`, `typescript-any-usage`) we scan source AST ourselves since students can disable rules with `eslint-disable`. The hybrid `magic-numbers-scan` always scans source to feed LLM candidates.

`EnrichmentEntry` gains a `checkerConfig?: Record<string, unknown>` field. Each generic checker validates its config with its own Zod schema at call time. Checker IDs become rubric-agnostic — the same checker (`eslint-plugin-presence`) works for unicorn (async-race), airbnb (other tasks), etc., parameterised by YAML.

**Tech Stack:** TypeScript strict, ESM, Node ≥20, `@babel/parser` (TS AST), `node-html-parser` (HTML), `zod` (config validation per checker).

**Out of M3 (per SPEC §10):** LLM orchestration (M4), aggregator (M4), GitHub delivery (M5), CLI (M5). M3 is plumbing + 8 generic checkers + registry.

**Per-task rhythm (no tests per SPEC §7):**
- Write file(s)
- `pnpm --filter @pocket-mentor/engine typecheck` → exit 0
- `pnpm lint` → exit 0
- Commit
- Code-reviewer subagent at milestone wrap (Task 13)

---

## File Structure

**Modify (M1/M2 layers):**

```
packages/engine/src/
├── types.ts                          # extend EnrichmentEntry with checkerConfig
├── schemas.ts                        # extend enrichmentEntrySchema
└── enrichment/loader.ts              # map checker_config through toEnrichment
rubrics/
└── async-race.enrichment.yaml        # rewrite with parametrised checker_id + checker_config
```

**Create (M3):**

```
packages/engine/src/checkers/
├── types.ts                          # CheckerContext, MechChecker, RepoReader types
├── repo-reader.ts                    # OctokitRepoReader implementation
├── registry.ts                       # checker_id → MechChecker
├── violation-helpers.ts              # buildViolation, buildPenaltyViolation
├── ts-ast-utils.ts                   # @babel/parser helpers
├── package-scripts-match.ts          # generic: package.json scripts match patterns
├── dep-presence.ts                   # generic: package.json has any of named deps
├── eslint-plugin-presence.ts         # generic: eslint config references plugin
├── eslint-rule-configured.ts         # generic: eslint config has named rule
├── html-body-allowed-tags.ts         # generic: <body> only contains allowed tags
├── forbidden-imports.ts              # generic (penalty): scan source for forbidden packages
├── typescript-any-usage.ts           # specific (penalty): TSAnyKeyword in .ts files
└── magic-numbers-scan.ts             # generic (hybrid): scan TS for non-allowed literals
```

**Decomposition principles:**
- Each generic checker is one file, ≤ 200 lines
- Each checker exports one default function + one Zod config schema
- AST-using checkers share `ts-ast-utils.ts`
- Registry is a static map — no plugin loading complexity

---

## Task 1: Extend EnrichmentEntry + Zod schema + loader for parametrisation

**Files:**
- Modify: `packages/engine/src/types.ts`
- Modify: `packages/engine/src/schemas.ts`
- Modify: `packages/engine/src/enrichment/loader.ts`

This is an M1-layer change but required before any M3 work — checkers can't read parameters that don't exist in the type system.

- [ ] **Step 1: Extend `EnrichmentEntry` type**

Read `packages/engine/src/types.ts`. Find the existing `EnrichmentEntry` definition:

```ts
export type EnrichmentEntry = {
  readonly method: CriterionMethod;
  readonly checkerId?: string;
  readonly llmFocus?: string;
};
```

Replace with:

```ts
export type EnrichmentEntry = {
  readonly method: CriterionMethod;
  readonly checkerId?: string;
  readonly llmFocus?: string;
  readonly checkerConfig?: Readonly<Record<string, unknown>>;
};
```

- [ ] **Step 2: Extend `enrichmentEntrySchema` Zod schema**

Read `packages/engine/src/schemas.ts`. Find the existing schema:

```ts
export const enrichmentEntrySchema = z
  .object({
    method: criterionMethodSchema,
    checker_id: z.string().min(1).optional(),
    llm_focus: z.string().min(1).optional(),
  })
  .refine(...);
```

Replace with:

```ts
export const enrichmentEntrySchema = z
  .object({
    method: criterionMethodSchema,
    checker_id: z.string().min(1).optional(),
    llm_focus: z.string().min(1).optional(),
    checker_config: z.record(z.string(), z.unknown()).optional(),
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
```

(The refine logic is unchanged — only `checker_config` is added.)

- [ ] **Step 3: Propagate `checker_config` through `EnrichmentLoader.toEnrichment`**

Read `packages/engine/src/enrichment/loader.ts`. Find the `toEnrichment` private method that builds the criteria map. Update the loop body that converts each entry:

```ts
private toEnrichment(raw: EnrichmentFileRaw): Enrichment {
  const criteria = new Map<string, EnrichmentEntry>();
  for (const [criterionId, entry] of Object.entries(raw.criteria)) {
    criteria.set(criterionId, {
      method: entry.method,
      checkerId: entry.checker_id,
      llmFocus: entry.llm_focus,
      checkerConfig: entry.checker_config,
    });
  }
  return {
    rubricId: raw.rubric_id,
    sourceCommit: raw.source_commit,
    sourcePath: raw.source_path,
    criteria,
  };
}
```

- [ ] **Step 4: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

Both exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/types.ts \
        packages/engine/src/schemas.ts \
        packages/engine/src/enrichment/loader.ts
git commit -m "feat(engine): support checker_config in enrichment YAML

EnrichmentEntry now carries an optional Record<string, unknown> for
per-criterion checker parameters. Lets mech checkers stay generic
(eslint-plugin-presence works for unicorn/airbnb/etc.) while the
async-race-specific values live in the YAML."
```

---

## Task 2: Rewrite async-race.enrichment.yaml with parametrised checkers

**Files:**
- Modify: `rubrics/async-race.enrichment.yaml`

- [ ] **Step 1: Replace contents of `rubrics/async-race.enrichment.yaml`**

```yaml
rubric_id: async-race
source_commit: bde2aad2cdcc64fc3e1e706dbf318d577772a550
source_path: stage2/tasks/async-race/non-functional-requirements.md

# M2: async-race enrichment (parametrised, per M3 architecture).
# All rubric-specific values (plugin names, max lines, allowed tags) live here.
# Checker functions in packages/engine/src/checkers/ are generic.

criteria:

  # ── Architecture ────────────────────────────────────────────────────────────

  modular-design:
    method: llm
    llm_focus: >
      Assess whether the codebase is clearly divided into logical layers:
      API interaction (fetch calls to the race engine server), UI rendering
      (DOM manipulation, component creation), and state management (current
      race state, garage data, pagination). Flag tight coupling — e.g. fetch
      calls mixed directly into event handlers, or DOM updates scattered
      across multiple unrelated modules. Award full points only when each
      concern is isolated enough that changing one layer does not require
      editing others.

  # ── Dynamic Content Generation ──────────────────────────────────────────────

  js-generated-html:
    method: mech
    checker_id: html-body-allowed-tags
    checker_config:
      allowed_tags: [script, noscript, link]
      html_paths: [index.html, public/index.html, src/index.html]

  # ── SPA ─────────────────────────────────────────────────────────────────────

  spa-implementation:
    method: llm
    llm_focus: >
      Verify the application implements client-side routing without full-page
      reloads. Check for History API usage (pushState/popstate) or hash-based
      routing. Flag use of <a href> links that trigger full navigation, or
      any window.location.href assignments that reload the page.

  # ── Bundling ─────────────────────────────────────────────────────────────────

  use-bundler:
    method: mech
    checker_id: dep-presence
    checker_config:
      packages: [vite, webpack, webpack-cli, parcel, esbuild, rollup]
      location: any  # 'dependencies' | 'devDependencies' | 'any'

  # ── ESLint config + lint script ──────────────────────────────────────────────

  eslint-unicorn:
    method: mech
    checker_id: eslint-plugin-presence
    checker_config:
      plugin: unicorn
      markers: [eslint-plugin-unicorn, 'unicorn/', '"unicorn"', "'unicorn'"]

  # ── Code Organisation ────────────────────────────────────────────────────────

  function-modularization:
    method: mech
    checker_id: eslint-rule-configured
    checker_config:
      rule: max-lines-per-function
      hint: "Should be configured to ≤ 40 lines per function body."

  no-magic-numbers:
    method: hybrid
    checker_id: magic-numbers-scan
    checker_config:
      allowed: [0, 1, -1]
      file_suffixes: ['.ts', '.tsx']
    llm_focus: >
      The mech checker has flagged numeric literals outside of 0, 1, -1.
      For each candidate, decide if it represents a domain value where a
      named constant would clarify intent. Ignore obvious cases like array
      indices, default values, well-known constants (HTTP 200, 404),
      timing values that are self-explanatory. Cite file:line for each
      meaningful violation.

  # ── Prettier setup ───────────────────────────────────────────────────────────

  prettier-setup:
    method: mech
    checker_id: package-scripts-match
    checker_config:
      scripts:
        - name: format
          contains: [prettier, '--write']
        - name: 'ci:format'
          contains: [prettier, '--check']

  # ── ESLint lint script ───────────────────────────────────────────────────────

  eslint-lint-script:
    method: mech
    checker_id: package-scripts-match
    checker_config:
      scripts:
        - name: lint
          contains: [eslint]

  # ── Overall Code Quality ─────────────────────────────────────────────────────

  overall-code-quality:
    method: llm
    llm_focus: >
      Holistic assessment of code readability and professionalism (up to 35
      points, mentor discretion). Consider: consistent naming conventions
      (camelCase variables, PascalCase classes/types), self-documenting names,
      absence of dead code and commented-out blocks, appropriate use of
      TypeScript types, logical file structure. Cite file:line examples for
      both strengths and weaknesses.

  # ── Penalties ────────────────────────────────────────────────────────────────

  no-libraries-penalty:
    method: mech
    checker_id: forbidden-imports
    checker_config:
      packages:
        - react
        - react-dom
        - '@angular/core'
        - angular
        - vue
        - '@vue/runtime-dom'
        - jquery
        - lodash
        - lodash-es
        - 'material-ui'
        - '@mui/material'
        - '@mui/core'
        - antd
      file_suffixes: ['.ts', '.tsx', '.js', '.jsx', '.mjs']

  typescript-usage-penalty:
    method: mech
    checker_id: typescript-any-usage
    checker_config:
      check_tsconfig_strict: true
      file_suffixes: ['.ts', '.tsx']
```

- [ ] **Step 2: Verify YAML parses and validates**

```bash
node --input-type=module << 'EOF'
import { readFileSync } from 'node:fs';
const { default: yaml } = await import('./packages/engine/node_modules/js-yaml/index.js');
const raw = readFileSync('./rubrics/async-race.enrichment.yaml', 'utf8');
const parsed = yaml.load(raw);
console.log('criteria:', Object.keys(parsed.criteria).length);
for (const [id, entry] of Object.entries(parsed.criteria)) {
  const hasConfig = entry.checker_config !== undefined;
  console.log(`  ${id}: method=${entry.method}${hasConfig ? ' [+config]' : ''}`);
}
EOF
```

Expected: 12 criteria, mech/hybrid ones show `[+config]`.

- [ ] **Step 3: Commit**

```bash
git add rubrics/async-race.enrichment.yaml
git commit -m "refactor(m2): parametrise async-race rubric for generic checkers

Each checker_id now points to a rubric-agnostic function; rubric-specific
values (plugin name, forbidden packages, allowed bundlers) move into
checker_config. Adds prettier-setup as a single criterion with two
scripts (matches the rubric's 5-point line)."
```

---

## Task 3: Install M3 deps + write checker types

**Files:**
- Modify: `packages/engine/package.json`
- Create: `packages/engine/src/checkers/types.ts`

- [ ] **Step 1: Install dependencies**

```bash
pnpm --filter @pocket-mentor/engine add @babel/parser@^7.25.0 node-html-parser@^6.1.13
```

- [ ] **Step 2: Write packages/engine/src/checkers/types.ts**

```ts
import { type Criterion, type Violation } from '../types.js';

export type RepoReader = {
  readFile(path: string): Promise<string | undefined>;
  listFiles(predicate: (path: string) => boolean): Promise<readonly string[]>;
};

export type CheckerContext = {
  readonly criterion: Criterion;
  readonly checkerConfig: Readonly<Record<string, unknown>>;
  readonly repoReader: RepoReader;
};

export type MechChecker = (ctx: CheckerContext) => Promise<readonly Violation[]>;
```

`checkerConfig` is `Record<string, unknown>` — each checker validates with its own Zod schema. If `EnrichmentEntry.checkerConfig` was `undefined`, the dispatcher should pass `{}` so checkers always see an object.

- [ ] **Step 3: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add packages/engine/package.json pnpm-lock.yaml packages/engine/src/checkers/types.ts
git commit -m "feat(engine): add checker types + @babel/parser + node-html-parser deps

CheckerContext carries checkerConfig (Record<string, unknown>) which each
checker validates with its own Zod schema. RepoReader.listFiles takes a
predicate to keep the interface minimal."
```

---

## Task 4: OctokitRepoReader implementation

**Files:**
- Create: `packages/engine/src/checkers/repo-reader.ts`

- [ ] **Step 1: Write repo-reader.ts**

```ts
import { type Octokit } from '@octokit/rest';

import { GitHubAuthError, PocketMentorError } from '../errors.js';

import { type RepoReader } from './types.js';

export type OctokitRepoReaderOptions = {
  readonly octokit: Octokit;
  readonly owner: string;
  readonly repo: string;
  readonly ref: string;
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const BASE64 = 'base64';

export class OctokitRepoReader implements RepoReader {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;
  private readonly ref: string;
  private cachedTree: readonly string[] | undefined;

  constructor(options: OctokitRepoReaderOptions) {
    this.octokit = options.octokit;
    this.owner = options.owner;
    this.repo = options.repo;
    this.ref = options.ref;
  }

  async readFile(path: string): Promise<string | undefined> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.ref,
      });
      const data = response.data;
      if (Array.isArray(data) || data.type !== 'file') return undefined;
      if (data.encoding !== BASE64) {
        throw new PocketMentorError(`Unexpected encoding ${data.encoding} for ${path}`);
      }
      return Buffer.from(data.content, 'base64').toString('utf8');
    } catch (error) {
      if (isNotFound(error)) return undefined;
      if (isAuthError(error)) {
        throw new GitHubAuthError(
          `GitHub auth failed reading ${path}: ${describeError(error)}`,
          error,
        );
      }
      throw new PocketMentorError(`Failed to read ${path}: ${describeError(error)}`, error);
    }
  }

  async listFiles(predicate: (path: string) => boolean): Promise<readonly string[]> {
    if (this.cachedTree === undefined) {
      this.cachedTree = await this.fetchTree();
    }
    return this.cachedTree.filter(predicate);
  }

  private async fetchTree(): Promise<readonly string[]> {
    try {
      const response = await this.octokit.git.getTree({
        owner: this.owner,
        repo: this.repo,
        tree_sha: this.ref,
        recursive: 'true',
      });
      return response.data.tree
        .filter((entry) => entry.type === 'blob' && typeof entry.path === 'string')
        .map((entry) => entry.path ?? '');
    } catch (error) {
      if (isAuthError(error)) {
        throw new GitHubAuthError(
          `GitHub auth failed listing tree at ${this.ref}: ${describeError(error)}`,
          error,
        );
      }
      throw new PocketMentorError(
        `Failed to list tree at ${this.ref}: ${describeError(error)}`,
        error,
      );
    }
  }
}

const isNotFound = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'status' in error && error.status === 404;

const isAuthError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null || !('status' in error)) return false;
  const status = (error as { status: unknown }).status;
  return status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN;
};

const describeError = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/checkers/repo-reader.ts
git commit -m "feat(engine): add OctokitRepoReader

Reads files at a Git ref via Octokit. Caches recursive tree on first
listFiles() call to avoid rate-limit hits. 401/403 → GitHubAuthError,
404 → undefined from readFile."
```

---

## Task 5: Violation helpers + TS AST utilities

**Files:**
- Create: `packages/engine/src/checkers/violation-helpers.ts`
- Create: `packages/engine/src/checkers/ts-ast-utils.ts`

- [ ] **Step 1: Write violation-helpers.ts**

```ts
import { type Criterion, type Violation } from '../types.js';

export type ViolationInput = {
  readonly file: string;
  readonly line: number;
  readonly message: string;
  readonly ruleId: string;
  readonly pointsDelta?: number;
  readonly rationale?: string;
};

export const buildViolation = (
  criterion: Criterion,
  input: ViolationInput,
): Violation => ({
  criterionId: criterion.id,
  ruleId: input.ruleId,
  file: input.file,
  line: input.line,
  side: 'RIGHT',
  severity: 'error',
  message: input.message,
  pointsDelta: input.pointsDelta ?? -criterion.pointsMax,
  rationale: input.rationale,
});

export const buildPenaltyViolation = (
  criterion: Criterion,
  input: ViolationInput,
): Violation => ({
  criterionId: criterion.id,
  ruleId: input.ruleId,
  file: input.file,
  line: input.line,
  side: 'RIGHT',
  severity: 'error',
  message: input.message,
  pointsDelta: -(criterion.penalty?.points ?? 0),
  rationale: input.rationale,
});
```

- [ ] **Step 2: Write ts-ast-utils.ts**

```ts
import { parse, type ParseResult } from '@babel/parser';
import { type File, type Node } from '@babel/types';

export const parseTypeScript = (source: string, filename: string): ParseResult<File> =>
  parse(source, {
    sourceType: 'module',
    sourceFilename: filename,
    plugins: ['typescript', 'jsx', 'decorators-legacy'],
    errorRecovery: true,
  });

export const walk = (node: Node, visit: (node: Node) => void): void => {
  visit(node);
  for (const key of Object.keys(node)) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNode(child)) walk(child, visit);
      }
    } else if (isNode(value)) {
      walk(value, visit);
    }
  }
};

const isNode = (value: unknown): value is Node =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  typeof (value as { type: unknown }).type === 'string';
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add packages/engine/src/checkers/violation-helpers.ts \
        packages/engine/src/checkers/ts-ast-utils.ts
git commit -m "feat(engine): add violation builders and TS AST helpers

buildViolation / buildPenaltyViolation factor out boilerplate. ts-ast-utils
wraps @babel/parser with TS plugin + a manual walk() — no @babel/traverse
dep needed."
```

---

## Task 6: `package-scripts-match` generic checker

**Files:**
- Create: `packages/engine/src/checkers/package-scripts-match.ts`

- [ ] **Step 1: Write package-scripts-match.ts**

```ts
import { z } from 'zod';

import { type Violation } from '../types.js';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const PACKAGE_JSON_PATH = 'package.json';

const scriptMatcherSchema = z.object({
  name: z.string().min(1),
  contains: z.array(z.string().min(1)).min(1),
});

const configSchema = z.object({
  scripts: z.array(scriptMatcherSchema).min(1),
});

type PackageJson = {
  readonly scripts?: Record<string, string>;
};

export const packageScriptsMatch: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const pkg = await readPackageJson(ctx);
  if (pkg === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: PACKAGE_JSON_PATH,
        line: 1,
        ruleId: 'package-scripts-match-no-pkg',
        message: 'package.json not found.',
      }),
    ];
  }
  const scripts = pkg.scripts ?? {};
  const failed = config.scripts.filter(
    (matcher) => !scriptMatches(scripts[matcher.name], matcher.contains),
  );
  if (failed.length === 0) return [];
  const details = failed
    .map((m) => `'${m.name}' (must contain ${m.contains.map((s) => `'${s}'`).join(' + ')})`)
    .join('; ');
  return [
    buildViolation(ctx.criterion, {
      file: PACKAGE_JSON_PATH,
      line: 1,
      ruleId: 'package-scripts-match-missing',
      message: `Missing or incorrect package.json scripts: ${details}.`,
    }),
  ];
};

const readPackageJson = async (ctx: CheckerContext): Promise<PackageJson | undefined> => {
  const raw = await ctx.repoReader.readFile(PACKAGE_JSON_PATH);
  if (raw === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    return parsed as PackageJson;
  } catch {
    return undefined;
  }
};

const scriptMatches = (script: string | undefined, needles: readonly string[]): boolean => {
  if (script === undefined) return false;
  return needles.every((needle) => script.includes(needle));
};
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/checkers/package-scripts-match.ts
git commit -m "feat(checkers): add package-scripts-match generic checker

Validates that each named package.json script exists and contains all
required substrings. Used by both prettier-setup (format + ci:format)
and eslint-lint-script criteria in async-race YAML."
```

---

## Task 7: `dep-presence` generic checker

**Files:**
- Create: `packages/engine/src/checkers/dep-presence.ts`

- [ ] **Step 1: Write dep-presence.ts**

```ts
import { z } from 'zod';

import { type Violation } from '../types.js';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const PACKAGE_JSON_PATH = 'package.json';

const configSchema = z.object({
  packages: z.array(z.string().min(1)).min(1),
  location: z.enum(['dependencies', 'devDependencies', 'any']).default('any'),
});

type PackageJson = {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
};

export const depPresence: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const pkg = await readPackageJson(ctx);
  if (pkg === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: PACKAGE_JSON_PATH,
        line: 1,
        ruleId: 'dep-presence-no-pkg',
        message: 'package.json not found.',
      }),
    ];
  }
  const candidates = collectDepNames(pkg, config.location);
  const found = config.packages.some((name) => candidates.has(name));
  if (found) return [];
  return [
    buildViolation(ctx.criterion, {
      file: PACKAGE_JSON_PATH,
      line: 1,
      ruleId: 'dep-presence-missing',
      message: `None of [${config.packages.join(', ')}] found in ${config.location}.`,
    }),
  ];
};

const readPackageJson = async (ctx: CheckerContext): Promise<PackageJson | undefined> => {
  const raw = await ctx.repoReader.readFile(PACKAGE_JSON_PATH);
  if (raw === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    return parsed as PackageJson;
  } catch {
    return undefined;
  }
};

const collectDepNames = (
  pkg: PackageJson,
  location: 'dependencies' | 'devDependencies' | 'any',
): ReadonlySet<string> => {
  const names = new Set<string>();
  if (location !== 'devDependencies') {
    for (const key of Object.keys(pkg.dependencies ?? {})) names.add(key);
  }
  if (location !== 'dependencies') {
    for (const key of Object.keys(pkg.devDependencies ?? {})) names.add(key);
  }
  return names;
};
```

- [ ] **Step 2: Verify + Commit**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
git add packages/engine/src/checkers/dep-presence.ts
git commit -m "feat(checkers): add dep-presence generic checker

Verifies at least one of the named packages appears in package.json
dependencies (or devDependencies, or either). Used for use-bundler in
async-race YAML."
```

---

## Task 8: ESLint config checkers (`eslint-plugin-presence` + `eslint-rule-configured`)

**Files:**
- Create: `packages/engine/src/checkers/eslint-plugin-presence.ts`
- Create: `packages/engine/src/checkers/eslint-rule-configured.ts`

Both checkers read ESLint config files. Share the same set of candidate paths but verify different things.

- [ ] **Step 1: Write eslint-plugin-presence.ts**

```ts
import { z } from 'zod';

import { type Violation } from '../types.js';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const ESLINT_CONFIG_PATHS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc',
];

const configSchema = z.object({
  plugin: z.string().min(1),
  markers: z.array(z.string().min(1)).min(1),
});

export const eslintPluginPresence: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const finding = await findEslintConfig(ctx);
  if (finding === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: 'eslint.config.js',
        line: 1,
        ruleId: 'eslint-plugin-presence-no-config',
        message: 'No ESLint config found.',
      }),
    ];
  }
  const hasPlugin = config.markers.some((marker) => finding.content.includes(marker));
  if (hasPlugin) return [];
  return [
    buildViolation(ctx.criterion, {
      file: finding.path,
      line: 1,
      ruleId: 'eslint-plugin-not-configured',
      message: `${finding.path} does not reference the '${config.plugin}' plugin.`,
    }),
  ];
};

const findEslintConfig = async (
  ctx: CheckerContext,
): Promise<{ path: string; content: string } | undefined> => {
  for (const path of ESLINT_CONFIG_PATHS) {
    const content = await ctx.repoReader.readFile(path);
    if (content !== undefined) return { path, content };
  }
  return undefined;
};
```

- [ ] **Step 2: Write eslint-rule-configured.ts**

```ts
import { z } from 'zod';

import { type Violation } from '../types.js';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const ESLINT_CONFIG_PATHS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc',
];

const configSchema = z.object({
  rule: z.string().min(1),
  hint: z.string().optional(),
});

export const eslintRuleConfigured: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const finding = await findEslintConfig(ctx);
  if (finding === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: 'eslint.config.js',
        line: 1,
        ruleId: 'eslint-rule-no-config',
        message: 'No ESLint config found.',
      }),
    ];
  }
  if (referencesRule(finding.content, config.rule)) return [];
  const hint = config.hint !== undefined ? ` ${config.hint}` : '';
  return [
    buildViolation(ctx.criterion, {
      file: finding.path,
      line: 1,
      ruleId: 'eslint-rule-not-configured',
      message: `${finding.path} does not configure rule '${config.rule}'.${hint}`,
    }),
  ];
};

const findEslintConfig = async (
  ctx: CheckerContext,
): Promise<{ path: string; content: string } | undefined> => {
  for (const path of ESLINT_CONFIG_PATHS) {
    const content = await ctx.repoReader.readFile(path);
    if (content !== undefined) return { path, content };
  }
  return undefined;
};

const referencesRule = (configContent: string, ruleName: string): boolean => {
  const variations = [`'${ruleName}'`, `"${ruleName}"`];
  return variations.some((variant) => configContent.includes(variant));
};
```

`referencesRule` requires the rule name to be quoted — avoids false positives from comments mentioning the rule. Real configs always quote rule names.

- [ ] **Step 3: Verify + Commit**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
git add packages/engine/src/checkers/eslint-plugin-presence.ts \
        packages/engine/src/checkers/eslint-rule-configured.ts
git commit -m "feat(checkers): add eslint config checkers

eslint-plugin-presence: ESLint config references a named plugin via any
of the configured markers (substring match). Used for eslint-unicorn.

eslint-rule-configured: ESLint config has a named rule (quoted). Used
for function-modularization (max-lines-per-function). Trust-the-linter
approach per M3 Variant C — we verify the rule is configured but don't
re-run it."
```

---

## Task 9: `html-body-allowed-tags` generic checker

**Files:**
- Create: `packages/engine/src/checkers/html-body-allowed-tags.ts`

- [ ] **Step 1: Write html-body-allowed-tags.ts**

```ts
import { parse, type HTMLElement } from 'node-html-parser';
import { z } from 'zod';

import { type Violation } from '../types.js';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const configSchema = z.object({
  allowed_tags: z.array(z.string().min(1)).min(1),
  html_paths: z.array(z.string().min(1)).min(1),
});

export const htmlBodyAllowedTags: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const allowed = new Set(config.allowed_tags.map((tag) => tag.toLowerCase()));
  const finding = await findHtml(ctx, config.html_paths);
  if (finding === undefined) {
    return [
      buildViolation(ctx.criterion, {
        file: config.html_paths[0] ?? 'index.html',
        line: 1,
        ruleId: 'html-body-no-html',
        message: `No HTML file found at expected paths: ${config.html_paths.join(', ')}.`,
      }),
    ];
  }
  return checkBody(ctx, finding.path, finding.content, allowed);
};

const findHtml = async (
  ctx: CheckerContext,
  candidates: readonly string[],
): Promise<{ path: string; content: string } | undefined> => {
  for (const path of candidates) {
    const content = await ctx.repoReader.readFile(path);
    if (content !== undefined) return { path, content };
  }
  return undefined;
};

const checkBody = (
  ctx: CheckerContext,
  path: string,
  raw: string,
  allowed: ReadonlySet<string>,
): readonly Violation[] => {
  const root = parse(raw);
  const body = root.querySelector('body');
  if (body === null) {
    return [
      buildViolation(ctx.criterion, {
        file: path,
        line: 1,
        ruleId: 'html-body-missing',
        message: `${path} has no <body> element.`,
      }),
    ];
  }
  const disallowed: string[] = [];
  for (const child of body.childNodes) {
    if (!isHtmlElement(child)) continue;
    const tag = child.tagName.toLowerCase();
    if (!allowed.has(tag)) {
      disallowed.push(`<${tag}>`);
    }
  }
  if (disallowed.length === 0) return [];
  return [
    buildViolation(ctx.criterion, {
      file: path,
      line: 1,
      ruleId: 'html-body-disallowed-tag',
      message: `<body> contains disallowed elements: ${disallowed.join(', ')}. Only ${[...allowed].map((t) => `<${t}>`).join(', ')} are permitted.`,
    }),
  ];
};

const isHtmlElement = (node: unknown): node is HTMLElement =>
  typeof node === 'object' &&
  node !== null &&
  'tagName' in node &&
  typeof (node as { tagName: unknown }).tagName === 'string';
```

- [ ] **Step 2: Verify + Commit**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
git add packages/engine/src/checkers/html-body-allowed-tags.ts
git commit -m "feat(checkers): add html-body-allowed-tags generic checker

Parses HTML at one of the configured paths and flags any <body> child
element whose tag name is not in allowed_tags. For async-race the YAML
allows script/noscript/link."
```

---

## Task 10: `forbidden-imports` generic checker (penalty)

**Files:**
- Create: `packages/engine/src/checkers/forbidden-imports.ts`

- [ ] **Step 1: Write forbidden-imports.ts**

```ts
import { z } from 'zod';

import { type Violation } from '../types.js';

import { type CheckerContext, type MechChecker } from './types.js';
import { buildPenaltyViolation } from './violation-helpers.js';

const IMPORT_PATTERN = /(?:from|import)\s+['"]([^'"]+)['"]/g;
const NEWLINE = '\n';

const configSchema = z.object({
  packages: z.array(z.string().min(1)).min(1),
  file_suffixes: z.array(z.string().min(1)).min(1),
});

export const forbiddenImports: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const forbidden = new Set(config.packages);
  const isCandidate = makeFilePredicate(config.file_suffixes);
  const files = await ctx.repoReader.listFiles(isCandidate);
  const violations: Violation[] = [];
  for (const path of files) {
    const content = await ctx.repoReader.readFile(path);
    if (content === undefined) continue;
    violations.push(...scanFile(ctx, path, content, forbidden));
  }
  return violations;
};

const makeFilePredicate = (suffixes: readonly string[]) => (path: string): boolean =>
  suffixes.some((suffix) => path.endsWith(suffix)) && !path.includes('node_modules/');

const scanFile = (
  ctx: CheckerContext,
  path: string,
  content: string,
  forbidden: ReadonlySet<string>,
): readonly Violation[] => {
  const violations: Violation[] = [];
  const lines = content.split(NEWLINE);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    for (const match of line.matchAll(IMPORT_PATTERN)) {
      const importPath = match[1];
      if (importPath === undefined) continue;
      const pkg = extractPackageName(importPath);
      if (pkg !== undefined && forbidden.has(pkg)) {
        violations.push(
          buildPenaltyViolation(ctx.criterion, {
            file: path,
            line: i + 1,
            ruleId: 'forbidden-import',
            message: `Forbidden import of '${pkg}'. ${ctx.criterion.penalty?.reason ?? 'Penalty applies.'}`,
          }),
        );
      }
    }
  }
  return violations;
};

const extractPackageName = (importPath: string): string | undefined => {
  if (importPath.startsWith('.') || importPath.startsWith('/')) return undefined;
  const parts = importPath.split('/');
  if (importPath.startsWith('@')) {
    return parts.length >= 2 ? `${parts[0] ?? ''}/${parts[1] ?? ''}` : undefined;
  }
  return parts[0];
};
```

- [ ] **Step 2: Verify + Commit**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
git add packages/engine/src/checkers/forbidden-imports.ts
git commit -m "feat(checkers): add forbidden-imports penalty checker

Regex-scans configured file suffixes for imports of forbidden packages
(scoped @foo/bar or top-level). Each match produces a penalty violation;
aggregator (M4) decides representation of -100% category penalties."
```

---

## Task 11: `typescript-any-usage` penalty checker

**Files:**
- Create: `packages/engine/src/checkers/typescript-any-usage.ts`

- [ ] **Step 1: Write typescript-any-usage.ts**

```ts
import { type Node } from '@babel/types';
import { z } from 'zod';

import { type Violation } from '../types.js';

import { parseTypeScript, walk } from './ts-ast-utils.js';
import { type CheckerContext, type MechChecker } from './types.js';
import { buildPenaltyViolation, buildViolation } from './violation-helpers.js';

const TSCONFIG_PATH = 'tsconfig.json';

const configSchema = z.object({
  file_suffixes: z.array(z.string().min(1)).min(1),
  check_tsconfig_strict: z.boolean().default(false),
});

type TsconfigJson = {
  readonly compilerOptions?: { readonly strict?: boolean };
};

export const typescriptAnyUsage: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const violations: Violation[] = [];
  if (config.check_tsconfig_strict) {
    const strictViolation = await checkTsconfigStrict(ctx);
    if (strictViolation !== undefined) violations.push(strictViolation);
  }
  const isCandidate = makeFilePredicate(config.file_suffixes);
  const files = await ctx.repoReader.listFiles(isCandidate);
  for (const path of files) {
    const content = await ctx.repoReader.readFile(path);
    if (content === undefined) continue;
    violations.push(...scanFile(ctx, path, content));
  }
  return violations;
};

const makeFilePredicate = (suffixes: readonly string[]) => (path: string): boolean =>
  suffixes.some((suffix) => path.endsWith(suffix)) && !path.includes('node_modules/');

const scanFile = (
  ctx: CheckerContext,
  path: string,
  content: string,
): readonly Violation[] => {
  const violations: Violation[] = [];
  try {
    const ast = parseTypeScript(content, path);
    walk(ast.program, (node) => {
      if (node.type === 'TSAnyKeyword') {
        violations.push(
          buildPenaltyViolation(ctx.criterion, {
            file: path,
            line: node.loc?.start.line ?? 1,
            ruleId: 'explicit-any',
            message: `Explicit 'any' type used. ${ctx.criterion.penalty?.reason ?? 'TypeScript penalty applies.'}`,
          }),
        );
      }
    });
  } catch {
    // Parse failure — skip silently.
  }
  return violations;
};

const checkTsconfigStrict = async (
  ctx: CheckerContext,
): Promise<Violation | undefined> => {
  const raw = await ctx.repoReader.readFile(TSCONFIG_PATH);
  if (raw === undefined) {
    return buildViolation(ctx.criterion, {
      file: TSCONFIG_PATH,
      line: 1,
      ruleId: 'tsconfig-missing',
      message: 'tsconfig.json not found.',
      pointsDelta: 0,
    });
  }
  let parsed: TsconfigJson | undefined;
  try {
    const candidate: unknown = JSON.parse(raw);
    if (typeof candidate === 'object' && candidate !== null) {
      parsed = candidate as TsconfigJson;
    }
  } catch {
    return buildViolation(ctx.criterion, {
      file: TSCONFIG_PATH,
      line: 1,
      ruleId: 'tsconfig-unparseable',
      message: 'tsconfig.json could not be parsed.',
      pointsDelta: 0,
    });
  }
  if (parsed?.compilerOptions?.strict !== true) {
    return buildViolation(ctx.criterion, {
      file: TSCONFIG_PATH,
      line: 1,
      ruleId: 'tsconfig-not-strict',
      message: "tsconfig.json does not set compilerOptions.strict: true.",
      pointsDelta: 0,
    });
  }
  return undefined;
};
```

`pointsDelta: 0` for tsconfig violations — they're advisory; only the `any` keyword penalises.

- [ ] **Step 2: Verify + Commit**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
git add packages/engine/src/checkers/typescript-any-usage.ts
git commit -m "feat(checkers): add typescript-any-usage penalty checker

AST-scans .ts/.tsx for TSAnyKeyword (explicit 'any') — each occurrence
triggers the -100% TypeScript penalty. Optionally also reports
tsconfig.json missing or strict: false as advisory (pointsDelta: 0)."
```

---

## Task 12: `magic-numbers-scan` hybrid checker

**Files:**
- Create: `packages/engine/src/checkers/magic-numbers-scan.ts`

- [ ] **Step 1: Write magic-numbers-scan.ts**

```ts
import { type Node } from '@babel/types';
import { z } from 'zod';

import { type Violation } from '../types.js';

import { parseTypeScript, walk } from './ts-ast-utils.js';
import { type CheckerContext, type MechChecker } from './types.js';
import { buildViolation } from './violation-helpers.js';

const configSchema = z.object({
  allowed: z.array(z.number()).default([0, 1, -1]),
  file_suffixes: z.array(z.string().min(1)).min(1),
});

export const magicNumbersScan: MechChecker = async (ctx) => {
  const config = configSchema.parse(ctx.checkerConfig);
  const allowed = new Set(config.allowed);
  const isCandidate = makeFilePredicate(config.file_suffixes);
  const files = await ctx.repoReader.listFiles(isCandidate);
  const violations: Violation[] = [];
  for (const path of files) {
    const content = await ctx.repoReader.readFile(path);
    if (content === undefined) continue;
    violations.push(...scanFile(ctx, path, content, allowed));
  }
  return violations;
};

const makeFilePredicate = (suffixes: readonly string[]) => (path: string): boolean =>
  suffixes.some((suffix) => path.endsWith(suffix)) && !path.includes('node_modules/');

const scanFile = (
  ctx: CheckerContext,
  path: string,
  content: string,
  allowed: ReadonlySet<number>,
): readonly Violation[] => {
  const violations: Violation[] = [];
  try {
    const ast = parseTypeScript(content, path);
    walk(ast.program, (node) => {
      if (isMagicNumber(node, allowed)) {
        const literal = (node as { value: number }).value;
        violations.push(
          buildViolation(ctx.criterion, {
            file: path,
            line: node.loc?.start.line ?? 1,
            ruleId: 'magic-number-candidate',
            message: `Numeric literal '${literal.toString()}' used directly.`,
            pointsDelta: 0,
          }),
        );
      }
    });
  } catch {
    // Parse failure — skip silently.
  }
  return violations;
};

const isMagicNumber = (node: Node, allowed: ReadonlySet<number>): boolean => {
  if (node.type !== 'NumericLiteral') return false;
  const value = (node as { value: number }).value;
  return !allowed.has(value);
};
```

`pointsDelta: 0` because hybrid — LLM (M4) reviews each candidate and decides which to penalise.

- [ ] **Step 2: Verify + Commit**

```bash
pnpm --filter @pocket-mentor/engine typecheck && pnpm lint
git add packages/engine/src/checkers/magic-numbers-scan.ts
git commit -m "feat(checkers): add magic-numbers-scan hybrid checker

AST-scans configured file suffixes for NumericLiteral nodes outside the
allowed set. Reports each as pointsDelta: 0 — LLM (M4) makes the
final decision per the criterion's llm_focus."
```

---

## Task 13: Registry + public surface + milestone wrap

**Files:**
- Create: `packages/engine/src/checkers/registry.ts`
- Modify: `packages/engine/src/index.ts`
- Modify: `feature_list.json`
- Modify: `progress.md`

- [ ] **Step 1: Write registry.ts**

```ts
import { depPresence } from './dep-presence.js';
import { eslintPluginPresence } from './eslint-plugin-presence.js';
import { eslintRuleConfigured } from './eslint-rule-configured.js';
import { forbiddenImports } from './forbidden-imports.js';
import { htmlBodyAllowedTags } from './html-body-allowed-tags.js';
import { magicNumbersScan } from './magic-numbers-scan.js';
import { packageScriptsMatch } from './package-scripts-match.js';
import { typescriptAnyUsage } from './typescript-any-usage.js';
import { type MechChecker } from './types.js';

const REGISTRY: Readonly<Record<string, MechChecker>> = {
  'dep-presence': depPresence,
  'eslint-plugin-presence': eslintPluginPresence,
  'eslint-rule-configured': eslintRuleConfigured,
  'forbidden-imports': forbiddenImports,
  'html-body-allowed-tags': htmlBodyAllowedTags,
  'magic-numbers-scan': magicNumbersScan,
  'package-scripts-match': packageScriptsMatch,
  'typescript-any-usage': typescriptAnyUsage,
};

export const getChecker = (checkerId: string): MechChecker | undefined =>
  REGISTRY[checkerId];

export const listCheckerIds = (): readonly string[] => Object.keys(REGISTRY);
```

- [ ] **Step 2: Update index.ts**

Read `packages/engine/src/index.ts`. Add at the end (before any trailing exports):

```ts
export {
  OctokitRepoReader,
  type OctokitRepoReaderOptions,
} from './checkers/repo-reader.js';

export {
  getChecker,
  listCheckerIds,
} from './checkers/registry.js';

export type {
  CheckerContext,
  MechChecker,
  RepoReader,
} from './checkers/types.js';

export {
  buildViolation,
  buildPenaltyViolation,
  type ViolationInput,
} from './checkers/violation-helpers.js';
```

The individual checker functions are NOT exported — callers access them via `getChecker(id)`.

- [ ] **Step 3: Final init.sh and verification**

```bash
./init.sh
```

Expected: install OK, lint OK, typecheck OK.

- [ ] **Step 4: Dispatch feature-dev:code-reviewer on full M3 diff**

Get the M3 base SHA (the commit just before Task 1, i.e. M2 wrap commit). Run `feature-dev:code-reviewer` on the diff. Triage flagged issues: fix in a new commit or push back with reason.

- [ ] **Step 5: Update feature_list.json**

M3 → `"status": "done"`, evidence: `"commits <first-m3-sha>..<head-sha>; 8 generic parametrised checkers in registry; ./init.sh green; feature-dev:code-reviewer reviewed and issues triaged"`.
M4 → `"status": "in-progress"`.

- [ ] **Step 6: Append Session 4 to progress.md**

`## Session 4 — 2026-05-14 — M3: parametrised mech-checkers`. Record decisions:
- Variant C philosophy (trust ESLint config for non-penalty; AST scan for penalty + hybrid)
- `EnrichmentEntry.checkerConfig` for rubric-agnostic checkers
- 8 generic checkers replace earlier 9 specific ones — adding new rubric is YAML-only
- `function-length` becomes `eslint-rule-configured` (no AST scan; we trust the lint config)

Next session: M4 = LLM orchestrator + aggregator.

- [ ] **Step 7: Final commit + push**

```bash
git add packages/engine/src/checkers/registry.ts \
        packages/engine/src/index.ts \
        feature_list.json \
        progress.md
git commit -m "chore(m3): mark M3 done, hand off to M4"
git push origin feature/pocket-mentor-v0.9-spec
```

---

## Self-Review Checklist

**Spec coverage** (all 8 checker IDs in async-race YAML map to a task):

| Checker ID | Task |
|---|---|
| `html-body-allowed-tags` | Task 9 ✓ |
| `dep-presence` | Task 7 ✓ |
| `eslint-plugin-presence` | Task 8 ✓ |
| `eslint-rule-configured` | Task 8 ✓ |
| `package-scripts-match` | Task 6 ✓ |
| `magic-numbers-scan` | Task 12 ✓ |
| `forbidden-imports` | Task 10 ✓ |
| `typescript-any-usage` | Task 11 ✓ |

**Schema changes:** `EnrichmentEntry.checkerConfig` and `enrichment_entry_schema.checker_config` → Task 1.

**YAML update:** all criteria use parametrised checker IDs → Task 2.

**Plumbing:** `RepoReader` interface + Octokit impl (Tasks 3, 4), violation helpers + AST utils (Task 5), registry (Task 13), public surface (Task 13).

**Milestone DoD:** init.sh green, code-reviewer subagent, feature_list, progress — Task 13.

**No placeholders:** every code block is complete; every command has expected output.

**Type consistency:**
- `MechChecker = (ctx: CheckerContext) => Promise<readonly Violation[]>` — Tasks 3, 6–12.
- `CheckerContext.checkerConfig: Readonly<Record<string, unknown>>` — Task 3, consumed in Tasks 6–12.
- Each checker validates `ctx.checkerConfig` with its own Zod schema (consistent pattern).
- `buildViolation` / `buildPenaltyViolation` signatures defined in Task 5, used unchanged in Tasks 6–12.
- Checker IDs in registry (Task 13) match the IDs in the updated YAML (Task 2) exactly.

**Discipline:**
- No unit tests (SPEC §7).
- `function-length` is a config check, not an AST check — explicit Variant C decision.
- `typescript-any-usage` keeps its AST scan even though ESLint has `no-explicit-any` — penalty critical.
- Hybrid `magic-numbers-scan` produces pointsDelta: 0; M4 LLM judges.

**Risks called out:**
- `@babel/parser` type imports may need adjustment (Task 5 note).
- `node-html-parser` Node type union (Task 9 note).
- `consistent-type-assertions: never` may block `as PackageJson` — fall back to `unknown` cast (Tasks 6, 7).
- Tree caching in OctokitRepoReader is per-instance; reused across checkers in a single PR review.
