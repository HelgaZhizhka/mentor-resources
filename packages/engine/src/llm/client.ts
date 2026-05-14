import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import { LLMError } from '../errors.js';

import { withRetry, type RetryConfig } from './retry.js';

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
  readonly defaultMaxTokens?: number;
  readonly retryConfig?: RetryConfig;
};

const ANTHROPIC_DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 4096;

export class AnthropicLLMClient implements LLMClient {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly defaultMaxTokens: number;
  private readonly retryConfig: RetryConfig;

  constructor(options: AnthropicLLMClientOptions) {
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.model = options.model ?? process.env['ANTHROPIC_MODEL'] ?? ANTHROPIC_DEFAULT_MODEL;
    this.defaultMaxTokens = options.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;
    this.retryConfig = options.retryConfig ?? { maxAttempts: 3, baseDelayMs: 1000 };
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    return withRetry(async () => this.doComplete(request), this.retryConfig);
  }

  private async doComplete(request: LLMRequest): Promise<LLMResponse> {
    const message = await this.callAnthropic(request);
    const textBlock = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    if (textBlock === undefined) {
      throw new LLMError('LLM response contained no text block', message.id);
    }
    return {
      text: textBlock.text,
      model: message.model,
      stopReason: message.stop_reason,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    };
  }

  private async callAnthropic(request: LLMRequest): Promise<Anthropic.Message> {
    try {
      return await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens ?? this.defaultMaxTokens,
        system: request.system,
        messages: [{ role: 'user', content: request.user }],
      });
    } catch (error) {
      const requestId =
        error instanceof Anthropic.APIError ? (error.request_id ?? undefined) : undefined;
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMError(`Anthropic API call failed: ${message}`, requestId, error);
    }
  }
}

// ─── OpenRouter (OpenAI-compatible) ─────────────────────────────────────────

export type OpenRouterLLMClientOptions = {
  readonly apiKey: string;
  readonly model?: string;
  readonly defaultMaxTokens?: number;
  readonly siteUrl?: string;
  readonly siteName?: string;
  readonly retryConfig?: RetryConfig;
};

const OPENROUTER_DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterLLMClient implements LLMClient {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly defaultMaxTokens: number;
  private readonly retryConfig: RetryConfig;

  constructor(options: OpenRouterLLMClientOptions) {
    const extraHeaders: Record<string, string> = {};
    if (options.siteUrl !== undefined) extraHeaders['HTTP-Referer'] = options.siteUrl;
    if (options.siteName !== undefined) extraHeaders['X-Title'] = options.siteName;

    this.client = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: options.apiKey,
      defaultHeaders: extraHeaders,
    });
    this.model = options.model ?? process.env['OPENROUTER_MODEL'] ?? OPENROUTER_DEFAULT_MODEL;
    this.defaultMaxTokens = options.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;
    this.retryConfig = options.retryConfig ?? { maxAttempts: 3, baseDelayMs: 1000 };
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    return withRetry(async () => this.doComplete(request), this.retryConfig);
  }

  private async doComplete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: request.maxTokens ?? this.defaultMaxTokens,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
      });
      return this.parseCompletion(completion);
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMError(`OpenRouter API call failed: ${message}`, undefined, error);
    }
  }

  private parseCompletion(completion: OpenAI.Chat.ChatCompletion): LLMResponse {
    const choice = completion.choices[0];
    const content = choice?.message.content;
    if (content === undefined || content === null) {
      throw new LLMError('OpenRouter response contained no content', undefined);
    }
    return {
      text: content,
      model: completion.model,
      stopReason: choice?.finish_reason ?? null,
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    };
  }
}
