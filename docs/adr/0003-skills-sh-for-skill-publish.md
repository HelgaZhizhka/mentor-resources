# ADR-0003: Use `vercel-labs/skills` (skills.sh) for skill publication

**Date:** 2026-05-26
**Status:** Accepted
**Decider:** Helga Zhizhka

---

## Context

After ADR-0001 (skill-first redesign), pocket-mentor ships as a self-contained bundle under `.claude/skills/pocket-mentor/` inside this repository. The two install methods documented in the skill README require a full `git clone` of `mentor-resources`:

- **Option A — symlink:** `git clone … && ln -s … ~/.claude/skills/pocket-mentor`. Convenient for the skill author (changes propagate instantly), but pulls the entire repo onto a mentor's machine — curriculum sources, plans, ADRs, harness — none of which the mentor needs at install time.
- **Option B — copy:** `git clone /tmp/… && cp -R … ~/.claude/skills/`. Same drawback (full clone required) plus a manual re-copy on every update.

The `.scratch/skill-publish/issues/01-publish-pocket-mentor-skill.md` triage ticket was opened on 2026-05-20 to choose a publish mechanism that lets a mentor install only the skill bundle, with an update mechanism, and without exposing the rest of the repo.

Four approaches were originally considered: GitHub release tarball, a separate `pocket-mentor` GitHub repo, the (then non-existent) Claude Code marketplace, and a `curl | bash` installer. A fifth approach — an existing community CLI — was discovered on 2026-05-26 while comparing pocket-mentor with Matt Pocock's skills setup.

## Decision

Adopt **`vercel-labs/skills`** (`npx skills add …`, also known as the **skills.sh** ecosystem) as the recommended publish/install path for pocket-mentor and any future skills in this repository.

The recommended install command for end-user mentors becomes:

```bash
npx skills@latest add HelgaZhizhka/mentor-resources -g -a claude-code
```

This installs `pocket-mentor` to `~/.claude/skills/pocket-mentor/` as a symlink to a canonical cache, scoped to the `claude-code` agent only.

No layout change is required on our side. The `vercel-labs/skills` CLI uses the GitHub Trees API to discover any `SKILL.md` file in the repository (regardless of folder structure) and reads its YAML frontmatter to identify the skill. Our `.claude/skills/pocket-mentor/SKILL.md` is auto-discovered exactly as if it lived under `skills/<category>/<name>/` (Matt Pocock's convention) or anywhere else.

Manual symlink (the current Option A) remains documented for the **skill author** workflow — it lets edits in the repo propagate instantly without an `npx skills update` round-trip. Option B (manual copy) is removed from the install instructions: `npx skills add … --copy` covers the same use case in one command.

## Consequences

**Positive:**
- One-line install, one-line update (`npx skills update pocket-mentor`), one-line removal (`npx skills remove pocket-mentor`). Matches what mentors already expect from `npm`/`brew`-style tooling.
- Mentors download only the skill bundle (under ~80 KB after blob compression via the skills.sh CDN), not the full mentor-resources repository.
- Symlink-by-default means our `scripts/sync-references.sh` changes propagate to installed instances after `npx skills update` — same update semantics as Option A.
- Skill listed in the public `skills.sh` directory at `https://skills.sh/HelgaZhizhka/mentor-resources`. Discoverability for RS School mentors outside our immediate circle.
- Works across agents we don't currently target — Cursor, Codex, OpenCode, 50+ others — at zero extra cost if those mentors ever switch.
- Zero changes to repo layout, to `SKILL.md`, or to bash scripts. Pure documentation update.

**Negative:**
- External runtime dependency on `npx skills` for the recommended path. If `vercel-labs/skills` is deprecated, abandoned, or significantly changes its CLI, our README install command breaks.
- Mitigation: the `.claude/skills/pocket-mentor/` layout in our repo is independent of skills.sh — anyone can still `git clone && symlink` (Option A). The publish channel is replaceable; the bundle is not coupled to it.
- License: `vercel-labs/skills` is MIT — compatible with our use, no further constraint.

**Neutral:**
- The skills.sh registry is a public catalogue. Our skill becoming visible there is a benefit for adoption but is not a requirement; the install command works directly against `github.com/HelgaZhizhka/mentor-resources` without registry interaction.
- Update channel: `npx skills update` reads the GitHub default branch (`master`). Whatever ships to `master` is what mentors get. Branch-protection and PR review become the only release process — no separate version tags, no draft releases. Consistent with our current "commit-driven granular history" workflow.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| **GitHub release tarball + manual extract** | Requires us to cut tagged releases for every skill change. Adds release management overhead the project doesn't need. `npx skills update` already handles the update flow without our involvement. |
| **Separate `pocket-mentor` GitHub repo** | Splits the skill from the curriculum source (`clean-code/`) that `sync-references.sh` reads. Either we duplicate curriculum across two repos or maintain a sync pipeline between them. Both options are work we avoid by keeping everything in one repo and letting skills.sh fetch only the skill subtree. |
| **Claude Code native marketplace** | Anthropic has not shipped a public skill marketplace API as of 2026-05-26. Cannot be the recommended path today. If/when Anthropic ships one, we can list pocket-mentor there in addition to skills.sh — they are not mutually exclusive. |
| **`curl \| bash` installer hosted by us** | We would maintain the install script, its hosting, and version-aware update logic. Reinvents what `npx skills` already does. Adds a security trust line (curl-pipe-to-bash) we do not need. |
| **npm package** | Skill bundles are not npm packages — they have no `index.js`, no exported runtime API, and no Node.js dependency. Forcing them into the npm shape is an impedance mismatch. `npx skills` is shaped around skills specifically. |

## Follow-up actions (not part of this ADR)

1. Update `.claude/skills/pocket-mentor/README.md` "Install" section: add **Option 0 — `npx skills add` (recommended for mentors)** above the current Option A. Remove Option B (covered by `--copy` flag on Option 0).
2. Verify the install command end-to-end on a clean directory after PR #2 merges to `master`.
3. Mark `.scratch/skill-publish/issues/01-publish-pocket-mentor-skill.md` as resolved-via-ADR-0003.
