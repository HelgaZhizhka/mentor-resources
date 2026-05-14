export class PocketMentorError extends Error {
  public override readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PocketMentorError';
    this.cause = cause;
  }
}

export class RubricFetchError extends PocketMentorError {
  public readonly url: string;

  constructor(message: string, url: string, cause?: unknown) {
    super(message, cause);
    this.name = 'RubricFetchError';
    this.url = url;
  }
}

export class EnrichmentNotFoundError extends PocketMentorError {
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
  public readonly requestId: string | undefined;

  constructor(message: string, requestId?: string, cause?: unknown) {
    super(message, cause);
    this.name = 'LLMError';
    this.requestId = requestId;
  }
}

export class LLMOutputInvalidError extends PocketMentorError {
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
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'GitHubAuthError';
  }
}

export class PRFetchError extends PocketMentorError {
  public readonly url: string;

  constructor(message: string, url: string, cause?: unknown) {
    super(message, cause);
    this.name = 'PRFetchError';
    this.url = url;
  }
}

export const describeError = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);
