export {
  describeError,
  EnrichmentInvalidError,
  EnrichmentNotFoundError,
  GitHubAuthError,
  LLMError,
  LLMOutputInvalidError,
  PocketMentorError,
  PRFetchError,
  RubricFetchError,
} from './errors.js';

export { fetchHttpClient, type HttpClient, type HttpResponse } from './http.js';

export {
  AnthropicLLMClient,
  type AnthropicLLMClientOptions,
  type LLMClient,
  type LLMRequest,
  type LLMResponse,
  OpenRouterLLMClient,
  type OpenRouterLLMClientOptions,
} from './llm/client.js';

export { EnrichmentLoader, type EnrichmentLoaderOptions } from './enrichment/loader.js';

export { RubricFetcher, type RubricFetcherOptions } from './rubric/fetcher.js';

export { RubricParser, type RubricParserOptions } from './rubric/parser.js';

export { PRFetcher, type PRFetcherOptions } from './pr/fetcher.js';

export { parsePRUrl, type PRLocation } from './pr/url.js';

export type {
  CommentSide,
  Criterion,
  CriterionMethod,
  Enrichment,
  EnrichmentEntry,
  Penalty,
  PenaltyKind,
  PRContext,
  PRFile,
  PRFileStatus,
  Violation,
  ViolationSeverity,
} from './types.js';
