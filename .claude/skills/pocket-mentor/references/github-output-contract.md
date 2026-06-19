# Pocket Mentor GitHub Output Contract

Read this file only for `--output inline`, `issues`, or `inline,issues`. Always write the full local report first.

## Inline Draft

Write `$PROJECT_DIR/inline-draft.json`:

```json
{
  "comments": [
    {
      "path": "src/example.ts",
      "line": 12,
      "body": "<translated evidence-grounded finding>"
    }
  ],
  "general_body": "<architectural findings without a stable diff line, or empty string>"
}
```

Rules:

- `path` is repository-relative and `line` is an integer on the current PR diff when possible.
- Re-check file/line immediately before writing the draft.
- Put findings without a stable changed line in `general_body`; never invent a line.
- Preserve the report's evidence class, What, Why, How to fix, and Reference.
- Use a GitHub `suggestion` only for a verified single-line replacement compatible with the current project.
- Do not use suggestions for architecture, multi-file changes, unsafe type assertions, or unverified fixes.

Student-facing limit:

- include every confirmed 🔴 Critical finding;
- include at most five 🟡 and 🔵 comments combined;
- include at most one 🔵;
- prioritize teaching value and score impact;
- collapse repeated patterns.

Omitted inline findings remain in the full local report.

## Issues Draft

Write `$PROJECT_DIR/issues-draft.json`:

```json
{
  "issues": [
    {
      "title": "🔴 <short problem> (<file:line or structural scope>)",
      "body": "<translated evidence-grounded finding>"
    }
  ]
}
```

Create one issue only for each confirmed 🔴 Critical finding. Do not create issues for Recommendations or Notes. Use structural scope when no honest single line exists.

## Approval Contract

1. Validate JSON shape, paths, lines, titles, body lengths, and post caps.
2. Check `gh auth status` and `jq`.
3. Show the mentor every proposed comment/issue.
4. Ask once: **Post now** or **Cancel**.
5. Run publishing scripts only after explicit confirmation.
