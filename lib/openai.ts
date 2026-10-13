import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionCreateParamsNonStreaming,
} from 'openai/resources/chat/completions';

let openaiClient: OpenAI | null = null;
let openaiClientWithOptions: OpenAI | null = null;

// Lazy-initialized shared OpenAI client
export function getOpenAI(options?: { timeout?: number }): OpenAI {
  if (options && options.timeout) {
    if (!openaiClientWithOptions) {
      openaiClientWithOptions = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: options.timeout,
      });
    }
    return openaiClientWithOptions;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Model roles. Each role is env-overridable so models can be swapped per
 * endpoint without code changes.
 *
 *  - grading:    high-volume, short outputs (answer grading). Cheap + fast.
 *  - parsing:    long structured-JSON extraction from PDF text/images.
 *  - generation: question generation where quality matters most.
 *
 * Defaults replace the legacy gpt-4o / gpt-4o-mini (July 2024) models:
 * newer small/mid models now beat them at similar or lower cost.
 */
export const GRADING_MODEL = process.env.OPENAI_MODEL_GRADING || 'gpt-5-mini';
export const PARSING_MODEL = process.env.OPENAI_MODEL_PARSING || 'gpt-5.4-mini';
export const GENERATION_MODEL = process.env.OPENAI_MODEL_GENERATION || 'gpt-5.1';

// Prices in USD per 1M tokens. Legacy models are kept so historical api_usage
// rows still compute the correct cost. Update when adding/swapping models.
// Source: https://developers.openai.com/api/docs/pricing
export const MODEL_PRICES_PER_1M: Record<string, { prompt: number; completion: number }> = {
  'gpt-5-mini': { prompt: 0.25, completion: 2.0 },
  'gpt-5-nano': { prompt: 0.05, completion: 0.4 },
  'gpt-5.1': { prompt: 1.25, completion: 10.0 },
  'gpt-5.4-mini': { prompt: 0.75, completion: 4.5 },
  'gpt-5.4-nano': { prompt: 0.2, completion: 1.25 },
  // Legacy (kept for historical cost tracking)
  'gpt-4o': { prompt: 2.5, completion: 10.0 },
  'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
};

export function computeCostUsd(
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  opts: { model?: string } = {}
): number {
  if (!usage) return 0;
  const model = opts.model || GRADING_MODEL;
  const prices = MODEL_PRICES_PER_1M[model];
  if (!prices) {
    // Refuse to guess: silently mis-pricing would corrupt usage analytics.
    console.error(`computeCostUsd: unknown model "${model}" - add it to MODEL_PRICES_PER_1M`);
    return 0;
  }
  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  return (promptTokens / 1_000_000) * prices.prompt + (completionTokens / 1_000_000) * prices.completion;
}

/**
 * Whether a model uses the newer reasoning-model API surface
 * (reasoning_effort instead of temperature). gpt-5 family and o-series.
 */
export function isReasoningModel(model: string): boolean {
  return /^(gpt-[5-9]|o\d)/.test(model);
}

export interface CreateChatCompletionOptions {
  model: string;
  messages: ChatCompletionMessageParam[];
  maxCompletionTokens?: number;
  /** Only applied on non-reasoning models (reasoning models ignore temperature). */
  temperature?: number;
  /** Only applied on reasoning models (gpt-5 family / o-series). */
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  responseFormatJson?: boolean;
  timeout?: number;
}

/**
 * Wrapper around openai.chat.completions.create that smooths over the
 * parameter differences between classic (gpt-4o family) and reasoning
 * (gpt-5 family / o-series) models:
 *  - uses max_completion_tokens (supported everywhere; max_tokens is not)
 *  - maps temperature <-> reasoning_effort depending on the model
 */
export async function createChatCompletion(
  options: CreateChatCompletionOptions
): Promise<ChatCompletion> {
  const openai = getOpenAI(options.timeout ? { timeout: options.timeout } : undefined);

  const params: ChatCompletionCreateParamsNonStreaming = {
    model: options.model,
    messages: options.messages,
  };

  if (options.maxCompletionTokens !== undefined) {
    params.max_completion_tokens = options.maxCompletionTokens;
  }
  if (options.responseFormatJson) {
    params.response_format = { type: 'json_object' };
  }
  if (isReasoningModel(options.model)) {
    if (options.reasoningEffort) {
      params.reasoning_effort = options.reasoningEffort;
    }
  } else if (options.temperature !== undefined) {
    params.temperature = options.temperature;
  }

  return openai.chat.completions.create(params);
}
