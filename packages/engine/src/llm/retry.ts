import { LLMError } from '../errors.js';

export type RetryConfig = {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
};

const RETRYABLE_HTTP_STATUSES = new Set([429, 500, 502, 503]);
const MAX_JITTER_MS = 500;

export const withRetry = async <T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === config.maxAttempts - 1) {
        throw error;
      }
      await delay(backoffMs(attempt, config.baseDelayMs));
    }
  }
  throw lastError;
};

const isRetryable = (error: unknown): boolean => {
  if (!(error instanceof LLMError)) return false;
  if (error.cause instanceof Error && 'status' in error.cause) {
    const status = (error.cause as { status: unknown }).status;
    return typeof status === 'number' && RETRYABLE_HTTP_STATUSES.has(status);
  }
  return true;
};

const backoffMs = (attempt: number, baseDelayMs: number): number => {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * MAX_JITTER_MS;
  return exponential + jitter;
};

const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
