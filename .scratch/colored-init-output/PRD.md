# PRD — Colored Output for pocket-mentor init.sh

Status: ready-for-agent
Skill bump: v0.9.5 → v0.9.6
Feature slug: `colored-init-output`

## Problem Statement

When a mentor runs `/pocket-mentor` inside a cloned student repository, the bootstrap script `.claude/skills/pocket-mentor/scripts/init.sh` prints ~10 status lines to stderr — install progress, lint/build outcomes, subdirectory descent, hard errors. All of them currently look identical (plain `[init] ...` prose), so the mentor has to read each line in full to figure out which is a success, which is a failure, and which is a "didn't happen because of a flag". On a screen full of output (e.g. when lint or build also emits its own logs), the meaningful state changes get lost in the noise.

## Solution

Make the four classes of stderr output visually distinct by color and a one-character status glyph:

- **info** (default colour, prefix `[init]`) — progress, no judgement
- **ok** (green, prefix `[init] ✓`) — something completed successfully
- **fail** (red, prefix `[init] ✗`) — hard failure, the script aborts or records an error
- **skip** (yellow, prefix `[init] ⊘`) — deliberately not done (e.g. `--no-install`)

The colour is automatically disabled when stderr is not a TTY (pipe / redirect / CI logs) and when the `NO_COLOR` environment variable is set, so the change is safe in every non-interactive context. Stdout — the JSON object that Claude Code parses — is **never touched**.

## User Stories

1. As a mentor reviewing a smoke run, I want successful steps (`deps installed`) shown in green, so that my eye lands on them as positive milestones without reading each line.
2. As a mentor, I want hard failures (`deps install FAILED`, `not a directory`) shown in red with a `✗`, so that I notice them immediately in a wall of output.
3. As a mentor invoking the skill with `--no-install`, I want the skipped-install line shown in yellow with `⊘`, so that I do not confuse "deliberately skipped" with "this step succeeded".
4. As a mentor piping output to a file (`bash init.sh 2>/tmp/log`), I want the file to contain plain text, so that I can grep / diff / share it without ANSI escape sequences in the way.
5. As a mentor with `NO_COLOR=1` in my shell, I want the skill to honour my global preference, so that I never see colour from any CLI tool including this one.
6. As Claude Code parsing the skill's stdout, I want the JSON object to remain byte-identical to today's output, so that `grep '"ok": true'` and similar parsers keep working.
7. As a future contributor reading `init.sh`, I want each call site to declare its intent (`ok "deps installed"` vs `fail "install failed"`), so that I can grep for all failure points or all success points without parsing prose.
8. As a future contributor adding a new log line, I want a small, obvious API (four one-line functions) rather than a level-parameterised `log()`, so that I do not need to look up the level vocabulary every time.
9. As a future contributor running `shellcheck` over `init.sh`, I want the script to remain warning-free, so that the team's lint contract holds.
10. As a mentor running the smoke test from `mentor-resources/init.sh`, I want that wrapper's behaviour unchanged (it greps the JSON for `"checker": "init"` etc.), so that the existing harness keeps passing.

## Implementation Decisions

### Module 1 — Colour palette setup

A six-line block placed immediately after `set -uo pipefail`. Conditional on `[[ ! -t 2 || -n "${NO_COLOR:-}" ]]` — if stderr is not a TTY **or** `NO_COLOR` is set, every colour variable is the empty string and ANSI escapes are absent from output. Otherwise the four variables hold standard `\e[31m` / `\e[32m` / `\e[33m` / `\e[0m`. This is the deepest module in the change: it encapsulates "decide whether to colour" behind a four-string interface that the rest of the script never has to second-guess.

### Module 2 — Logging API

Four one-line bash functions: `info`, `ok`, `fail`, `skip`. Each emits a line to stderr with the relevant colour prefix and a status glyph (✓/✗/⊘ for ok/fail/skip; no glyph for info). They replace the existing `log()` function. Each takes one argument (the message).

### Module 3 — Call-site migration

Roughly ten replacements across `init.sh`:

- `log "no package.json at root; descending into ${SUBDIR}"` → `info`
- `log "node_modules missing, --no-install set; skipping install"` → `skip`
- `log "installing deps via ${PM}..."` → `info`
- `log "deps installed"` → `ok`
- `log "deps install FAILED (see /tmp/pocket-mentor-install.log)"` → `fail`
- `echo "ERROR: not a directory: $PROJECT_DIR" >&2` → `fail "not a directory: $PROJECT_DIR"`
- `echo "ERROR: cannot cd $PROJECT_DIR" >&2` → `fail "cannot cd $PROJECT_DIR"`
- `echo "ERROR: cannot cd $SUBDIR" >&2` → `fail "cannot cd $SUBDIR"`
- `echo "Unknown arg: $1" >&2` → `fail "unknown arg: $1"`

The `cat >&2 <<EOF` heredoc that prints `--help` output stays as-is; help text is structured plain text, not a state-bearing log line.

### What does NOT change

- Stdout JSON output (heredoc at the end of the script). Byte-identical to today.
- `LINT_TAIL` and `BUILD_TAIL` substrings inside the JSON. They are pre-escaped data, not log lines.
- Exit codes. `fail "..."` does not call `exit` — the script still exits where it did before with the same code.
- The bumped `--help` text.

### Interface contract

The four functions `info` / `ok` / `fail` / `skip` are internal to `init.sh`. They are not exported, not sourced by other scripts. If a sibling checker later wants the same convention, it can copy the seven-line block — duplication is cheaper than a shared dependency for something this small.

### Skill version bump

After the change lands, `SKILL.md` frontmatter and `README.md` version line bump from v0.9.5 to v0.9.6. This counts as a minor version (UX improvement, no contract change). `feature_list.json` `current_version` updated accordingly.

## Testing Decisions

Per the global CLAUDE.md "no unit tests unless explicitly asked" rule and per the `mentor-resources` convention (verification = `shellcheck` + manual smoke), this feature is **not** covered by automated tests. Adding a bash testing framework (bats-core or similar) is heavier than the feature itself and would set a precedent the rest of the skill bundle does not follow.

Verification path is:

1. `shellcheck .claude/skills/pocket-mentor/scripts/init.sh` — must be warning-free.
2. `bash .claude/skills/pocket-mentor/scripts/init.sh` inside a real student repo or a fixture with `node_modules` present — expect coloured output, `ok`/`fail`/`skip` lines visually distinct.
3. `bash .claude/skills/pocket-mentor/scripts/init.sh 2>/tmp/init.log; cat /tmp/init.log` — file must contain plain text only (no `\x1b[` sequences).
4. `NO_COLOR=1 bash .claude/skills/pocket-mentor/scripts/init.sh` — no colour even with a TTY attached.
5. `./init.sh` from `mentor-resources/` root — the repo-level smoke wrapper must still pass (grep over JSON unchanged).
6. `/pocket-mentor` invoked end-to-end in Claude Code — the LLM-side JSON parsing must continue to find `"ok": true` (or `false`) and the rest of the contract fields.

If any of these fail, treat as a regression and do not merge.

Prior art: there are no existing colour-aware bash scripts in this repo. The convention is therefore being established by this feature; future bash scripts in `.claude/skills/*/scripts/` that need similar output can copy the seven-line setup block.

## Out of Scope

- Colouring the four sibling checker scripts (`check-ts-usage.sh`, `check-no-console.sh`, `check-git-quality.sh`, `check-commented-code.sh`). They emit JSON only, no human-readable stderr log lines, so there is nothing to colour.
- Colouring `mentor-resources/init.sh` (the repo-level wrapper). Separate change if desired; not bundled here to keep this feature XS-sized.
- A `--no-color` / `--color` CLI flag. The two existing disable mechanisms (TTY auto-detect + `NO_COLOR`) cover every realistic scenario; adding a flag is API surface we do not need.
- A `FORCE_COLOR=1` override. Niche; revisit if a real consumer asks.
- Bold / dim / underline ANSI styles. Foreground colour + status glyph is already enough visual distinction; adding text-style ANSI codes makes output more fragile across terminals.
- Refactoring the JSON output construction. It is intentionally untouched.

## Further Notes

- The `RESET` variable is appended at the start of `info()` to defensively close any unterminated escape from a prior line, in addition to the closing `${RESET}` at the end. A no-op on a fresh terminal; a safety net inside a longer pipeline.
- The glyphs `✓` `✗` `⊘` are UTF-8 multibyte characters. `init.sh` already contains a U+2026 ellipsis (the v0.9.1 bash 3.2 incident), so the bundle already assumes a UTF-8 locale on the mentor's machine. No new portability requirement is introduced.
- The grilling that produced these decisions is in the conversation history; an implementing agent does not need to re-grill, but should not invent additional decisions that contradict any of the four resolved branches above.
