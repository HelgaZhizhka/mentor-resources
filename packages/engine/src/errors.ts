export class PocketMentorError extends Error {
  readonly code: string = 'POCKET_MENTOR_ERROR';
  readonly exitCode: number = 1;
  public override readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PocketMentorError';
    this.cause = cause;
  }
}

export class RubricFetchError extends PocketMentorError {
  override readonly code = 'RUBRIC_FETCH_ERROR' as const;
  override readonly exitCode = 3 as const;
  public readonly url: string;

  constructor(message: string, url: string, cause?: unknown) {
    super(message, cause);
    this.name = 'RubricFetchError';
    this.url = url;
  }
}

export class EnrichmentNotFoundError extends PocketMentorError {
  override readonly code = 'ENRICHMENT_NOT_FOUND' as const;
  override readonly exitCode = 2 as const;
  public readonly rubricId: string;
  public readonly availableRubrics: readonly string[];

  constructor(rubricId: string, availableRubrics: readonly string[]) {
    const available = availableRubrics.length > 0 ? availableRubrics.join(', ') : '(none)';
    super(`Enrichment not found for rubric '${rubricId}'. Available rubrics: ${available}`);
    this.name = 'EnrichmentNotFoundError';
    this.rubricId = rubricId;
    this.availableRubrics = availableRubrics;
  }
}

export class EnrichmentInvalidError extends PocketMentorError {
  override readonly code = 'ENRICHMENT_INVALID' as const;
  override readonly exitCode = 2 as const;
  public readonly rubricId: string;
  public readonly issues: readonly string[];

  constructor(rubricId: string, issues: readonly string[], cause?: unknown) {
    super(`Enrichment for '${rubricId}' failed validation:\n  - ${issues.join('\n  - ')}`, cause);
    this.name = 'EnrichmentInvalidError';
    this.rubricId = rubricId;
    this.issues = issues;
  }
}

export class LLMError extends PocketMentorError {
  override readonly code = 'LLM_ERROR' as const;
  override readonly exitCode = 3 as const;
  public readonly requestId: string | undefined;

  constructor(message: string, requestId?: string, cause?: unknown) {
    super(message, cause);
    this.name = 'LLMError';
    this.requestId = requestId;
  }
}

// Intentionally extends PocketMentorError directly (not LLMError) because
// output validation failures are distinct from API/transport failures.
// M5 CLI should catch both: instanceof LLMError || instanceof LLMOutputInvalidError.
export class LLMOutputInvalidError extends PocketMentorError {
  override readonly code = 'LLM_OUTPUT_INVALID' as const;
  override readonly exitCode = 3 as const;
  public readonly raw: string;
  public readonly issues: readonly string[];

  constructor(message: string, raw: string, issues: readonly string[], cause?: unknown) {
    super(message, cause);
    this.name = 'LLMOutputInvalidError';
    this.raw = raw;
    this.issues = issues;
  }
}

export class GitHubAuthError extends PocketMentorError {
  override readonly code = 'GITHUB_AUTH_ERROR' as const;
  override readonly exitCode = 1 as const;

  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'GitHubAuthError';
  }
}

export class PRFetchError extends PocketMentorError {
  override readonly code = 'PR_FETCH_ERROR' as const;
  override readonly exitCode = 3 as const;
  public readonly url: string;

  constructor(message: string, url: string, cause?: unknown) {
    super(message, cause);
    this.name = 'PRFetchError';
    this.url = url;
  }
}

export const describeError = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);
