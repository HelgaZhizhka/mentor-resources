# Add colored stderr output to pocket-mentor init.sh

Status: done
PRD: ../.scratch/colored-init-output/PRD.md

## Parent

`.scratch/colored-init-output/PRD.md` — Colored Output for pocket-mentor init.sh

## What to build

Add colored, symbol-prefixed stderr output to `.claude/skills/pocket-mentor/scripts/init.sh` so that pass/fail/skip states are immediately distinguishable without reading prose.

Four states are introduced:
- **info** — plain default foreground, prefix `[init]`, for progress messages with no judgement
- **ok** — green, prefix `[init] ✓`, for successful completions
- **fail** — red, prefix `[init] ✗`, for errors and hard failures
- **skip** — yellow, prefix `[init] ⊘`, for intentionally-skipped steps (e.g. `--no-install`)

Color is automatically disabled when stderr is not a TTY (`[[ ! -t 2 ]]`) or when `NO_COLOR` is set in the environment. Stdout (the JSON object) is never touched.

The existing `log()` function and the four bare `echo "ERROR: ..." >&2` lines are replaced by calls to the appropriate new function at each site. The help heredoc (`-h` flag) is left unchanged.

After the code change, bump the skill version from v0.9.5 to v0.9.6 in:
- `.claude/skills/pocket-mentor/SKILL.md` (frontmatter `version:` field and any inline version reference)
- `.claude/skills/pocket-mentor/README.md` (`Version:` line)
- `feature_list.json` (`current_version` field for the `pocket-mentor` entry)

## Acceptance criteria

- [ ] `shellcheck .claude/skills/pocket-mentor/scripts/init.sh` exits 0 with no warnings
- [ ] Running `bash .claude/skills/pocket-mentor/scripts/init.sh` in a real student repo (or a fixture with `node_modules/` present) shows colored and glyph-prefixed lines; `ok` lines are green, `fail` lines are red, `skip` lines are yellow, `info` lines are plain
- [ ] `bash .claude/skills/pocket-mentor/scripts/init.sh 2>/tmp/init.log && grep -P '\x1b' /tmp/init.log` finds no ANSI escape sequences in the redirected file
- [ ] `NO_COLOR=1 bash .claude/skills/pocket-mentor/scripts/init.sh` produces no color even when stderr is a TTY
- [ ] `./init.sh` from `mentor-resources/` root (the repo-level smoke wrapper) still exits 0 — it parses the stdout JSON, not stderr, so this is a non-regression check
- [ ] `/pocket-mentor` invoked end-to-end in Claude Code continues to work — the LLM-side JSON parsing (`"ok": true`, `"checker": "init"`, etc.) finds the expected fields
- [ ] Stdout JSON output is byte-identical in structure to v0.9.5 (no new fields, no ANSI in any JSON value)
- [ ] SKILL.md, README.md, and feature_list.json all reflect v0.9.6

## Blocked by

None — can start immediately.
