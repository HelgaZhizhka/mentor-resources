import { ZodError } from 'zod';

import { LLMOutputInvalidError } from '../errors.js';
import { type LLMClient } from '../llm/client.js';
import { criterionListSchema } from '../schemas.js';
import { type Criterion } from '../types.js';

export type RubricParserOptions = {
  readonly llmClient: LLMClient;
};

const SYSTEM_PROMPT = `You are an extractor that converts an RS School non-functional-requirements
markdown document into a structured JSON array of criteria.

Output schema (TypeScript-style):

  Array<{
    id: string,                  // stable kebab-case identifier you create
    title: string,               // short title from the bullet/header
    pointsMax: number,           // integer >= 0
    text: string,                // verbatim markdown text of the criterion
    category?: string,           // section heading the criterion lives under
    penalty?: {                  // present only for penalty items (e.g. "-100% for React")
      kind: "fixed" | "zero-category",
      points?: number,           // for kind="fixed" only
      reason: string,
    }
  }>

Rules:
- Emit one element per graded item in the source markdown.
- For additive items "(+N)": pointsMax = N, no penalty.
- For penalty items "-N% for X" or "-100% for using React": pointsMax = 0
  and provide the "penalty" object. Use kind="zero-category" only when the
  penalty zeroes an entire category (e.g. "-100% for React" voids the whole
  non-functional grade); otherwise use kind="fixed".
- "id" must be stable kebab-case so future re-parses don't churn IDs.
- "category" should be the nearest enclosing section heading (e.g. "TypeScript",
  "Linter", "Git") when present.
- Return ONLY a JSON array. No prose, no Markdown code fences.`;

const MAX_PARSE_TOKENS = 8192;

export class RubricParser {
  private readonly llmClient: LLMClient;

  constructor(options: RubricParserOptions) {
    this.llmClient = options.llmClient;
  }

  async parse(rubricMarkdown: string): Promise<readonly Criterion[]> {
    const userPrompt = buildUserPrompt(rubricMarkdown);
    const response = await this.llmClient.complete({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: MAX_PARSE_TOKENS,
    });
    const json = parseJson(response.text);
    return validateCriteria(json, response.text);
  }
}

const buildUserPrompt = (rubricMarkdown: string): string =>
  `Extract criteria from the following markdown document:\n\n${rubricMarkdown}`;

const parseJson = (raw: string): unknown => {
  const stripped = stripCodeFences(raw).trim();
  try {
    return JSON.parse(stripped) as unknown;
  } catch (error) {
    const issue = error instanceof Error ? error.message : String(error);
    throw new LLMOutputInvalidError(`RubricParser: LLM output was not valid JSON: ${issue}`, raw, [
      issue,
    ]);
  }
};

const stripCodeFences = (raw: string): string => {
  const fenced = /^```(?:json)?\n([\S\s]*?)\n```$/.exec(raw.trim());
  return fenced?.[1] ?? raw;
};

const validateCriteria = (value: unknown, raw: string): readonly Criterion[] => {
  try {
    return criterionListSchema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.errors.map(
        (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`
      );
      throw new LLMOutputInvalidError(
        'RubricParser: LLM JSON output failed schema validation',
        raw,
        issues
      );
    }
    throw error;
  }
};
