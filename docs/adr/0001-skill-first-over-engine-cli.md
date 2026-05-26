# ADR-0001: Skill-first architecture over standalone engine+CLI

**Date:** 2026-05-18  
**Status:** Accepted  
**Decider:** Helga Zhizhka

---

## Context

The original v0.9 design (May 2026) was a TypeScript monorepo: a `packages/engine` with Octokit, Zod, YAML rubrics, and a `packages/cli` that mentors would install globally. The engine composed a multi-layer rubric (common + stack + task + overrides) at review time and posted a GitHub draft PR review via the GitHub API.

Two signals triggered a redesign:

1. **External feedback from RS School product team:** the workflow was too complex for a mentor-newcomer; the school was also moving from async PR review toward synchronous review sessions, making the GitHub draft delivery less relevant.
2. **Internal assessment:** the TypeScript engine was approximating in code what an LLM already does well — reading, grading, and explaining code. The engine added complexity without adding accuracy.

## Decision

Replace the TypeScript engine+CLI with a **Claude Code skill bundle**: bash mechanics for deterministic checks + a Claude Code LLM session for analytical judgment. The mentor runs `/pocket-mentor` from inside a cloned student repository. No standalone binary, no separate install beyond Claude Code itself.

The LLM provides the rubric-application and narrative-generation layer that the engine was trying to replicate in deterministic code. The bash checkers handle only what is unambiguously mechanical (lint exit code, forbidden file patterns, TypeScript escape hatches).

## Consequences

**Positive:**
- Zero infrastructure to maintain (no CLI binary, no rubrics repo, no GitHub API token setup).
- Analytical quality matches or exceeds what a hand-coded engine could achieve.
- Development cycle is fast: edit SKILL.md or a bash script, symlink, test immediately.
- Works with any RS School task — no per-task YAML authoring required.

**Negative:**
- Quality depends on the LLM model available in the mentor's Claude Code session. Weaker models (tested: Ollama kimi-k2.5) produce contradictory fix snippets and silent fallbacks.
- No standalone CLI path — mentors must use Claude Code (requires Anthropic account).
- No programmatic publish / marketplace entry yet; install is manual symlink or copy.

**Neutral:**
- Per-mentor repeatability is preserved (each mentor controls their own session). Cross-mentor standardisation was explicitly out of scope.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| **Standalone CLI (npm package)** | Requires separate Anthropic API key setup; adds install friction on top of Claude Code, which mentors already need. No quality improvement over skill-bundle approach. |
| **MCP server** | No stable standard client at the time; requires additional plumbing in each editor. Skill bundle achieves the same via Claude Code's native skill mechanism. |
| **VS Code extension** | Binds to one editor; development overhead (packaging, marketplace review) disproportionate to the audience size. |
| **Keep engine+CLI, simplify UX** | Root cause was not UX but architecture: the engine re-implemented judgment that belongs to an LLM. Simplifying the UX would not fix the fundamental mismatch. |
