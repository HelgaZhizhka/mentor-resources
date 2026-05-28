# RS School Student Reviewer

Automatic code review for RS School students. Posts inline PR comments using the same clean-code standards as pocket-mentor.

> ⚠️ **Angular projects are not supported.** The action detects `@angular/core` in dependencies and exits without posting comments. Use [pocket-mentor](../../.claude/skills/pocket-mentor/README.md) for Angular projects.

## Quick start (zero config)

1. Copy `templates/workflows/student-review.yml` from this repo to your project:

```bash
mkdir -p .github/workflows
curl -o .github/workflows/student-review.yml \
  https://raw.githubusercontent.com/HelgaZhizhka/mentor-resources/master/templates/workflows/student-review.yml
```

2. Commit and push. Open a PR — the review runs automatically.

No API key needed. Uses GitHub Models (free) by default.

## Optional: use your own AI provider

For higher quality reviews, add these secrets in your repo **Settings → Secrets and variables → Actions**:

| Secret | Example value |
|---|---|
| `AI_API_KEY` | your Anthropic / OpenAI / Gemini key |
| `AI_BASE_URL` | `https://api.anthropic.com/v1` |
| `AI_MODEL` | `claude-sonnet-4-6` |

Any OpenAI-compatible provider works (Anthropic, Gemini, Ollama, Azure OpenAI, etc.).

## What gets reviewed

| Stack (auto-detected) | Rules applied |
|---|---|
| HTML / CSS (no package.json) | HTML.md + CSS.md |
| Vanilla JS | Clean-Code Fundamentals |
| TypeScript | TypeScript.md + Fundamentals |
| React + TypeScript | React.md + TypeScript.md + Fundamentals |
| Angular | ⚠️ Not supported — review skipped |

## Output

- 🔴 **Critical** — must fix before merge
- 🟡 **Recommendation** — should improve
- 🔵 **Note** — minor / informational

Each comment follows the format: **What** / **Why bad** / **How to fix**, with suggestion blocks for simple fixes (accept with one click).
