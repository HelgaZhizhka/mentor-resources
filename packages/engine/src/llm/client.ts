import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

import { LLMError } from '../errors.js';

// ─── Shared interface ────────────────────────────────────────────────────────

export type LLMRequest = {
  readonly system: string;
  readonly user: string;
  readonly maxTokens?: number;
};

export type LLMResponse = {
  readonly text: string;
  readonly model: string;
  readonly stopReason: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
};

export type LLMClient = {
  complete(request: LLMRequest): Promise<LLMResponse>;
};

// ─── Anthropic direct ────────────────────────────────────────────────────────

export type AnthropicLLMClientOptions = {
  readonly apiKey: string;
  readonly model?: string;
  readonly maxTokens?: number;
  readonly maxRetries?: number;
};

const ANTHROPIC_DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_MAX_RETRIES = 3;

export class AnthropicLLMClient implements LLMClient {
  private readonly provider: ReturnType<typeof createAnthropic>;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly maxRetries: number;

  constructor(options: AnthropicLLMClientOptions) {
    this.provider = createAnthropic({ apiKey: options.apiKey });
    this.model = options.model ?? process.env['ANTHROPIC_MODEL'] ?? ANTHROPIC_DEFAULT_MODEL;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const result = await generateText({
        model: this.provider(this.model),
        system: request.system,
        prompt: request.user,
        maxOutputTokens: request.maxTokens ?? this.maxTokens,
        maxRetries: this.maxRetries,
      });
      return {
        text: result.text,
        model: result.response.modelId,
        stopReason: result.finishReason,
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMError(`Anthropic API call failed: ${message}`, undefined, error);
    }
  }
}

// ─── OpenRouter ──────────────────────────────────────────────────────────────

export type OpenRouterLLMClientOptions = {
  readonly apiKey: string;
  readonly model?: string;
  readonly maxTokens?: number;
  readonly maxRetries?: number;
  readonly siteUrl?: string;
  readonly siteName?: string;
};

const OPENROUTER_DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterLLMClient implements LLMClient {
  private readonly openrouter: ReturnType<typeof createOpenAI>;
  private readonly modelId: string;
  private readonly maxTokens: number;
  private readonly maxRetries: number;

  constructor(options: OpenRouterLLMClientOptions) {
    const headers: Record<string, string> = {};
    if (options.siteUrl !== undefined) headers['HTTP-Referer'] = options.siteUrl;
    if (options.siteName !== undefined) headers['X-Title'] = options.siteName;

    this.openrouter = createOpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: options.apiKey,
      headers,
    });
    this.modelId = options.model ?? process.env['OPENROUTER_MODEL'] ?? OPENROUTER_DEFAULT_MODEL;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const result = await generateText({
        model: this.openrouter(this.modelId),
        system: request.system,
        prompt: request.user,
        maxOutputTokens: request.maxTokens ?? this.maxTokens,
        maxRetries: this.maxRetries,
      });
      return {
        text: result.text,
        model: result.response.modelId,
        stopReason: result.finishReason,
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMError(`OpenRouter API call failed: ${message}`, undefined, error);
    }
  }
}
