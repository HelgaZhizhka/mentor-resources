# M0 — Monorepo Setup + Tooling + Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap pnpm workspace with empty `packages/engine` and `packages/cli` skeletons, Node-only ESLint + TS config at the root, and `init.sh` exiting 0 — so M1 can start writing engine code on a clean foundation.

**Architecture:** Move existing student-facing `tsconfig.json` and `eslint.config.js` into `templates/configs/` (they were RS School style references, not project configs). Replace them at repo root with new minimal Node-only configs (TS strict, no React/JSX/DOM, no `max-lines-per-function: 30`). Add `tsconfig.base.json` for shared compiler options; each package extends it with its own `tsconfig.json`. `pnpm-workspace.yaml` registers `packages/*`. `init.sh` runs `pnpm install`, `pnpm lint` (workspace), `pnpm -r typecheck` (per-package).

**Tech Stack:** pnpm workspaces, TypeScript 5.8 strict, ESLint 9 flat config + typescript-eslint, Node ≥20 (engine target).

**Out of M0 (per SPEC §10):** any business logic, Zod schemas, Octokit wrappers, fetchers. Pure scaffolding. The engine and CLI export an empty placeholder so `tsc --noEmit` has at least one input.

---

## File Structure

**Move (existing → new path):**
- `tsconfig.json` → `templates/configs/tsconfig.json`
- `eslint.config.js` → `templates/configs/eslint.config.js`

**Create at repo root:**
- `tsconfig.base.json` — shared strict compiler options for engine/cli (Node, no DOM/JSX)
- `tsconfig.json` — solution-style config that just references packages (so root `tsc --noEmit` is replaced by `pnpm -r typecheck`; we keep this file minimal and pointing at packages so eslint's `projectService` resolves project files in packages)
- `eslint.config.js` — new minimal Node-only flat config, ignores `templates/`, `clean-code/`, `docs/`, `node_modules`, `dist`. Strict TS rules, no React/JSX/jsx-a11y, no `max-lines-per-function`, no `no-magic-numbers` (too noisy for engine wiring). Keeps unicorn, import order, prefer-template, eqeqeq.

**Create per package:**
- `packages/engine/package.json` — name `@pocket-mentor/engine`, private, type module, scripts: `typecheck`
- `packages/engine/tsconfig.json` — extends `../../tsconfig.base.json`, includes `src/**/*.ts`, `outDir` not set (no emit yet)
- `packages/engine/src/index.ts` — single line: `export {};` (placeholder so tsc has an input)
- `packages/cli/package.json` — name `@pocket-mentor/cli`, private, type module, `bin: { "pocket-mentor": "./dist/index.js" }` (dist not built yet — bin path is forward-looking, harmless), scripts: `typecheck`
- `packages/cli/tsconfig.json` — extends `../../tsconfig.base.json`, includes `src/**/*.ts`
- `packages/cli/src/index.ts` — single line: `export {};`

**Modify:**
- `pnpm-workspace.yaml` — add `packages: ['packages/*']`
- `package.json` (root) — replace `tsc --noEmit` invocation with `pnpm -r typecheck`; keep existing `lint`, `format` scripts; downgrade root `lint` glob to `eslint .` (flat config picks up the right files via its own ignores). Remove devDependencies that are React-only (`eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-jsx-a11y`) — they were used only by the relocated student-facing config.
- `init.sh` — change typecheck step from `pnpm exec tsc --noEmit` to `pnpm -r typecheck`. Lint step stays.
- `LINTER-README.md` — update copy-paste paths (root → `templates/configs/`)

**Don't touch:**
- `clean-code/`, `docs/`, `progress.md`, `feature_list.json`, `AGENTS.md`, `templates/agents`, `templates/checklists`, `templates/scripts`, `README.md`, `CONTRIBUTING.md` — out of M0 scope.

---

## Task 1: Relocate student-facing configs into templates/configs/

**Files:**
- Move: `tsconfig.json` → `templates/configs/tsconfig.json`
- Move: `eslint.config.js` → `templates/configs/eslint.config.js`
- Create: `templates/configs/README.md`

- [ ] **Step 1: Create the templates/configs/ directory and move both files via git mv**

```bash
mkdir -p templates/configs
git mv tsconfig.json templates/configs/tsconfig.json
git mv eslint.config.js templates/configs/eslint.config.js
```

- [ ] **Step 2: Create templates/configs/README.md explaining what's there**

```markdown
# RS School student configs

Reference TypeScript + ESLint configs aligned with the RS School clean-code
checklist. Students copy these into their own project repos as a starting
point.

These are **not** the configs used by `mentor-resources` itself — see the repo
root `eslint.config.js` and `tsconfig.base.json` for those.

## Usage

From your student project root:

```bash
cp path/to/mentor-resources/templates/configs/tsconfig.json .
cp path/to/mentor-resources/templates/configs/eslint.config.js .
pnpm add -D typescript eslint typescript-eslint \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh \
  eslint-plugin-jsx-a11y eslint-plugin-import eslint-plugin-unicorn \
  eslint-plugin-prettier eslint-config-prettier prettier
```

See `LINTER-README.md` at repo root for the full rule rationale.
```

- [ ] **Step 3: Verify nothing remains at root**

Run: `ls tsconfig.json eslint.config.js 2>&1`
Expected: both report "No such file or directory" (they've moved).

- [ ] **Step 4: Commit**

```bash
git add templates/configs/
git commit -m "refactor: relocate student-facing tsconfig/eslint into templates/configs/

These were reference configs for RS School students, not project configs for
mentor-resources itself. Pocket Mentor monorepo will get its own minimal
Node-only configs at the repo root."
```

---

## Task 2: Add pnpm workspace registration

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Add packages glob to pnpm-workspace.yaml**

Replace the file contents with:

```yaml
packages:
  - 'packages/*'

ignoredBuiltDependencies:
  - unrs-resolver
```

- [ ] **Step 2: Verify pnpm sees zero workspace packages (none exist yet)**

Run: `pnpm -r ls --depth -1 2>&1 | head -5`
Expected: succeeds, prints only the root package since `packages/*` is empty.

- [ ] **Step 3: Commit**

```bash
git add pnpm-workspace.yaml
git commit -m "chore: register packages/* as pnpm workspace"
```

---

## Task 3: Add tsconfig.base.json (shared compiler options)

**Files:**
- Create: `tsconfig.base.json`

- [ ] **Step 1: Write tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    "resolveJsonModule": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,

    "skipLibCheck": true
  }
}
```

Notes (don't write into the file):
- No `lib: DOM` — engine and CLI are Node-only.
- No `jsx` — no React.
- No `paths` — packages reference each other through workspace `package.json`, not path aliases.
- `noEmit: true` is fine for M0 (we typecheck only). M5 may flip this for the CLI build; that's deferred.

- [ ] **Step 2: Commit**

```bash
git add tsconfig.base.json
git commit -m "chore: add tsconfig.base.json shared by engine and cli packages"
```

---

## Task 4: Scaffold packages/engine

**Files:**
- Create: `packages/engine/package.json`
- Create: `packages/engine/tsconfig.json`
- Create: `packages/engine/src/index.ts`

- [ ] **Step 1: Write packages/engine/package.json**

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
  }
}
```

- [ ] **Step 2: Write packages/engine/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Write packages/engine/src/index.ts**

```ts
export {};
```

- [ ] **Step 4: Verify typecheck passes for the engine package**

Run: `pnpm install && pnpm --filter @pocket-mentor/engine typecheck`
Expected: pnpm installs, then tsc exits 0 with no output.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/
git commit -m "feat: scaffold packages/engine with placeholder src/index.ts"
```

---

## Task 5: Scaffold packages/cli

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/index.ts`

- [ ] **Step 1: Write packages/cli/package.json**

```json
{
  "name": "@pocket-mentor/cli",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@pocket-mentor/engine": "workspace:*"
  }
}
```

Notes (don't write into the file):
- No `bin` field yet — pointing it at `./dist/index.js` before any build exists makes `pnpm install` warn. M5 will add bin + build pipeline.
- The workspace dep on `@pocket-mentor/engine` is fine even though engine has no real exports yet — pnpm will resolve it as a symlink.

- [ ] **Step 2: Write packages/cli/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Write packages/cli/src/index.ts**

```ts
export {};
```

- [ ] **Step 4: Verify typecheck passes for the cli package**

Run: `pnpm install && pnpm --filter @pocket-mentor/cli typecheck`
Expected: pnpm links engine into cli's node_modules, then tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/
git commit -m "feat: scaffold packages/cli with workspace dep on engine"
```

---

## Task 6: New root tsconfig.json (solution stub for editor + workspace tsc)

**Files:**
- Create: `tsconfig.json`

- [ ] **Step 1: Write a minimal root tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./packages/engine" },
    { "path": "./packages/cli" }
  ]
}
```

Notes (don't write into the file):
- `files: []` + `references` is the standard solution-style root config. It compiles nothing itself; it's a discovery hint for editors and `tsc --build`.
- We deliberately do not set `composite: true` in the package tsconfigs in M0 (would force `declaration: true` and break `noEmit`). If we later want `tsc --build`, we can flip it then. For M0 we typecheck per-package via `pnpm -r typecheck`, which doesn't need composite.

- [ ] **Step 2: Verify root tsc --noEmit no longer errors with "No inputs"**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: exits 0 (root config compiles nothing — just a stub).

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add solution-style root tsconfig.json referencing packages"
```

---

## Task 7: Replace root ESLint config with Node-only flat config

**Files:**
- Create: `eslint.config.js`

- [ ] **Step 1: Write the new root eslint.config.js**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      'templates/**',
      'clean-code/**',
      'docs/**',
      '**/*.d.ts',
    ],
  },
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      unicorn.configs.recommended,
      eslintPluginPrettier,
    ],
    files: ['packages/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-cycle': ['error', { maxDepth: Infinity }],

      'unicorn/prefer-module': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/filename-case': ['error', { cases: { kebabCase: true } }],
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',

      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-template': 'error',
      'object-shorthand': ['error', 'always'],
    },
    settings: {
      'import/resolver': {
        typescript: { project: ['packages/*/tsconfig.json'] },
        node: true,
      },
    },
  }
);
```

Rationale (don't write into the file):
- Scoped to `packages/**/*.ts` — root-level files (e.g. `eslint.config.js` itself) are not type-checked. The typescript-eslint type-checked rules need `parserOptions.projectService`, which only makes sense for files in a TS project.
- Dropped React/jsx-a11y plugins — engine and CLI are Node-only.
- Dropped `max-lines-per-function: 30`, `max-params: 3`, `complexity: 10`, `no-magic-numbers`, `id-length` — these are RS School student rules; too aggressive for an engine that has Octokit response wrangling and prompt-string assembly. We can re-add selectively later if review shows code drift.
- Dropped `naming-convention` boolean prefix rule — Octokit/Zod return types use names like `published`, `merged_at`; forcing `is`/`has` prefixes would force renames at every boundary.
- Kept `no-explicit-any`, `consistent-type-imports`, `consistent-type-definitions: type`, async-safety rules — these are core to SPEC §"TypeScript strict, no any".

- [ ] **Step 2: Verify lint passes (no files match yet apart from the placeholder index.ts files, which are valid)**

Run: `pnpm lint`
Expected: exits 0 with no warnings. (`packages/engine/src/index.ts` and `packages/cli/src/index.ts` contain only `export {};`, which passes all rules.)

- [ ] **Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "feat: add Node-only ESLint flat config for engine and cli packages"
```

---

## Task 8: Update root package.json scripts and devDeps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace package.json with the updated version**

The new file:

```json
{
  "name": "mentor-resources",
  "version": "1.0.0",
  "description": "RS School frontend mentoring toolkit + Pocket Mentor v0.9-alpha engine and CLI",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.21.0",
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "pnpm -r typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\""
  },
  "devDependencies": {
    "@eslint/js": "^9.27.0",
    "@types/node": "^22.14.1",
    "@typescript-eslint/eslint-plugin": "8.33.0",
    "@typescript-eslint/parser": "8.33.0",
    "eslint": "^9.27.0",
    "eslint-config-prettier": "^10.1.2",
    "eslint-import-resolver-typescript": "^3.6.3",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-prettier": "^5.2.6",
    "eslint-plugin-unicorn": "^58.0.0",
    "prettier": "^3.5.3",
    "typescript": "~5.8.3",
    "typescript-eslint": "8.33.0"
  }
}
```

Notes (don't write into the file):
- Removed: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-jsx-a11y`, `globals`, `ts-prune`. They were used only by the relocated student-facing eslint.config.js.
- Removed: `main`, `keywords`, `author`, `license` fields that were boilerplate or wrong (license was ISC, repo LICENSE is something else). Set `private: true` since this is a workspace root.
- Added: `@eslint/js` (used by the new flat config).
- Lint script no longer needs `--ext .ts,.tsx` (flat config + ignores handles it).

- [ ] **Step 2: Reinstall to drop removed packages from node_modules**

Run: `pnpm install`
Expected: pnpm prunes the React/jsx-a11y/globals/ts-prune packages, lockfile updates.

- [ ] **Step 3: Verify lint, typecheck still pass**

Run: `pnpm lint && pnpm typecheck`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: prune React-only devDeps and switch root scripts to pnpm -r typecheck"
```

---

## Task 9: Update init.sh

**Files:**
- Modify: `init.sh`

- [ ] **Step 1: Replace init.sh contents**

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies (pnpm)"
pnpm install

echo "==> Linting"
pnpm lint

echo "==> Type-checking (per-package)"
pnpm -r typecheck

echo "==> init.sh complete: repo is in clean state"
```

- [ ] **Step 2: Verify init.sh exits 0**

Run: `./init.sh`
Expected: pnpm install OK, lint OK, both engine and cli typecheck OK, final "clean state" line printed.

- [ ] **Step 3: Commit**

```bash
git add init.sh
git commit -m "chore: route init.sh typecheck through pnpm -r typecheck"
```

---

## Task 10: Update LINTER-README.md to point at templates/configs/

**Files:**
- Modify: `LINTER-README.md`

- [ ] **Step 1: Update the "For new projects" section**

Find this block in `LINTER-README.md`:

```bash
# Из этого репозитория в ваш проект
cp eslint.config.js your-project/
cp tsconfig.json your-project/
cp .prettierrc.json your-project/
cp package.json your-project/  # Только devDependencies
```

Replace with:

```bash
# Из этого репозитория в ваш проект
cp templates/configs/eslint.config.js your-project/
cp templates/configs/tsconfig.json your-project/
```

Also add, right after that block:

```markdown
> Note: starting from Pocket Mentor v0.9, the repo root holds its own
> Node-only configs for `packages/engine` and `packages/cli`. Student-facing
> reference configs now live in `templates/configs/`.
```

- [ ] **Step 2: Commit**

```bash
git add LINTER-README.md
git commit -m "docs: point LINTER-README.md at templates/configs/ for student copies"
```

---

## Task 11: Run full init.sh end-to-end + code-reviewer subagent on the M0 diff

**Files:**
- (no file edits — verification + review)

- [ ] **Step 1: Final init.sh run**

Run: `./init.sh`
Expected: install OK, lint OK, typecheck OK across both packages, "clean state" printed.

- [ ] **Step 2: Confirm git tree is clean**

Run: `git status`
Expected: "nothing to commit, working tree clean".

- [ ] **Step 3: Invoke feature-dev:code-reviewer subagent on the M0 diff**

Per AGENTS.md "Code review before commit" rule and SPEC §7. Run the
`feature-dev:code-reviewer` subagent against the diff between
`feature/pocket-mentor-v0.9-spec`'s state at session start and HEAD. Triage
each flagged issue: fix it inline (re-running `./init.sh` after) or push back
with a recorded reason.

- [ ] **Step 4: Update feature_list.json — mark M0 done, M1 in-progress**

Edit `feature_list.json`:
- M0 entry: `status: "done"`, `evidence: "<commit SHA range>; init.sh green; reviewer triaged"`
- M1 entry: `status: "in-progress"`

- [ ] **Step 5: Append a session entry to progress.md**

Add a `## Session 2 — 2026-05-13 — M0 monorepo bootstrap` block with: what was
done, what's next (M1 — RubricFetcher + EnrichmentLoader + RubricParser +
PRFetcher), blockers (none), decisions (relocated student configs to
`templates/configs/`; root configs are now Node-only; Pocket Mentor monorepo
is at root, no per-package eslint).

- [ ] **Step 6: Final commit**

```bash
git add feature_list.json progress.md
git commit -m "chore(m0): mark M0 done, hand off to M1"
```

---

## Self-Review Checklist (run after writing all tasks above)

- [x] **Spec coverage** — every M0 bullet from SPEC §10 maps to a task:
  - "Update `pnpm-workspace.yaml` with `packages: ['packages/*']`" → Task 2
  - "Create `packages/engine/`, `packages/cli/` with `package.json`, `tsconfig.json` (extend root config)" → Tasks 3, 4, 5, 6
  - "Add eslint override for `packages/engine/**` and `packages/cli/**` removing react-specific rules" → Task 7 (achieved by replacing the whole root config rather than adding overrides — cleaner since the React-only config has been relocated)
  - "Verify `./init.sh` exits 0" → Tasks 9, 11
  - AGENTS.md DoD: tsc + lint pass, code-reviewer subagent triaged, `feature_list.json` + `progress.md` updated → Task 11
- [x] **No placeholders** — every code/config block is concrete; no "TBD".
- [x] **Type/name consistency** — package names `@pocket-mentor/engine` and `@pocket-mentor/cli` used identically across Tasks 4, 5, 7, 8.
- [x] **Risks called out** —
  - Removing devDeps in Task 8 only safe because the student-facing config that consumed them was moved to `templates/configs/` in Task 1. If a student copies that config and runs `pnpm install` from the template, they re-add the deps via that copy — but the templates/ folder isn't a workspace (it's outside `packages/*`), so this only matters for end users, not us.
  - `tsconfig.json` at root is a solution stub. If a future tool expects `tsc --noEmit` (no `-p` flag) at root to compile package code, it won't — they need `pnpm -r typecheck`. Documented in Task 6.
