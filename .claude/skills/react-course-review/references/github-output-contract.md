# React Course Review GitHub Output Contract

Read this file only for `--output inline`, `issues`, or `inline,issues`. Always write the full local report first.

## Inline Draft

Write `$PROJECT_DIR/inline-draft.json`:

```json
{
  "comments": [
    {
      "path": "src/components/SearchForm.tsx",
      "line": 42,
      "body": "<translated, evidence-grounded finding body>"
    }
  ],
  "general_body": "<architectural findings without a stable diff line, or empty string>"
}
```

Rules:

- `path` is repository-relative.
- `line` is an integer on the current PR diff when possible.
- Re-check the file and line immediately before writing the draft.
- Put findings without a stable changed line in `general_body`; never invent a line.
- Use the same translated finding labels and evidence class as the report.
- Use a GitHub `suggestion` block only for a simple line-level replacement that fits the current project configuration.
- Never use a suggestion for architecture, hook/data-flow rewrites, multi-file changes, or an unverified fix.

Student-facing limit:

- include every confirmed 🔴 Course blocker;
- include at most five 🟡 and 🔵 comments combined;
- include at most one 🔵;
- select non-blockers by teaching value and likely score impact;
- collapse three or more instances of one pattern into one detailed comment with other locations listed briefly.

Findings omitted from inline comments remain in the full local report.

## Issues Draft

Write `$PROJECT_DIR/issues-draft.json`:

```json
{
  "issues": [
    {
      "title": "🔴 <short problem> (<file:line or structural scope>)",
      "body": "<translated finding body using the report contract>"
    }
  ]
}
```

Rules:

- create issues only for confirmed 🔴 Course blockers;
- do not create issues for 🟡 or 🔵 items;
- preserve evidence class and source locations;
- for structural findings, name the relevant scope instead of fabricating one line;
- keep title/body within the validation limits enforced by the publishing script.

## Approval Contract

Before any external action:

1. Validate JSON shape and limits.
2. Check `gh auth status` and `jq` availability.
3. Show the mentor every proposed comment/issue in readable form.
4. Ask once: **Post now** or **Cancel**.
5. Run publishing scripts only after explicit confirmation.

The Generated Files section in the local report must state whether each draft was requested, written, cancelled, or posted.
