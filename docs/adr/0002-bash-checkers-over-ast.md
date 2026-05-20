# ADR-0002: Bash + grep checkers over AST-level analysis

**Date:** 2026-05-18  
**Status:** Accepted  
**Decider:** Helga Zhizhka

---

## Context

The original TypeScript engine included 8 mechanical checkers built on the Babel parser (`@babel/parser`, `@babel/types`) for AST-level analysis: `typescript-any-usage.ts`, `magic-numbers-scan.ts`, `forbidden-imports.ts`, `html-body-allowed-tags.ts`, and others. These required Node.js, npm dependencies, and a compilation step inside the skill bundle.

When the architecture pivoted to a skill bundle (ADR-0001), a decision was needed: keep the AST checkers as a Node.js layer inside the bundle, or replace them with bash.

## Decision

All mechanical checks use **bash + grep/awk/sed only**. No Node.js runtime, no Babel, no TypeScript compiler invocation inside the checkers. Each checker is a self-contained bash script that accepts `--project-dir`, runs in bash 3.2+, and emits JSON via `printf`.

The LLM analysis layer (step 3 of the skill execution) provides the judgment and nuance that grep-level checks cannot offer — architectural patterns, naming quality, function responsibility. The checkers handle only what is unambiguously detectable via text matching.

## Consequences

**Positive:**
- Zero dependencies beyond bash and standard POSIX tools — skill bundle installs via file copy, no `npm install`.
- Portable: works on macOS (bash 3.2), Linux, any environment where Claude Code runs.
- Fast: each checker runs in under a second on typical student repositories.
- Easy to audit: a mentor or student can read a 100-line bash script and understand exactly what it checks.
- `shellcheck` provides static analysis — the same kind of safety net that TypeScript provides for TS code.

**Negative:**
- Grep-based checks have higher false-positive and false-negative rates than AST. Example: `check-ts-usage.sh` may flag a `!` in a string literal; AST would not.
- Magic number detection is not implemented (AST-level check was dropped; ESLint's `no-magic-numbers` rule is trusted instead).
- No cross-file analysis (e.g., detecting that a type is `any` through two layers of inference).

**Neutral:**
- The false-positive rate is acceptable because the LLM analysis layer reviews every checker finding and can dismiss false positives in the report. The checkers are a signal source, not the final verdict.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| **Babel AST (Node.js inside bundle)** | Adds a Node.js runtime dependency and `node_modules` to the skill bundle. Complicates install (symlink alone is no longer sufficient), increases bundle size, and requires maintenance of npm deps. Accuracy gain is marginal for the use case. |
| **`tsc --noEmit` output parsing** | Fragile — output format changes across TypeScript versions. The student repo's TypeScript version controls this, not the skill bundle. `init.sh` already captures `tsc` exit code and tail; re-parsing it in a checker is redundant. |
| **ESLint programmatic API** | ESLint already runs in `init.sh` step 1. Running it again in a checker would duplicate work and require ESLint as a bundle dependency. The skill trusts the student repo's own ESLint config. |
| **jq-based JSON parsing inside checkers** | `jq` is not available on all macOS installs by default. Bash string operations and `grep` are universally available. |
