import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
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

const REASONING_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high'] as const;
type ReasoningEffortValue = (typeof REASONING_EFFORTS)[number];

function parseReasoningEffort(envValue: string | undefined, fallback: ReasoningEffortValue): ReasoningEffortValue {
  if (envValue && (REASONING_EFFORTS as readonly string[]).includes(envValue)) {
    return envValue as ReasoningEffortValue;
  }
  if (envValue) {
    console.error(
      `Invalid OPENAI_GENERATION_REASONING_EFFORT "${envValue}" - must be one of ${REASONING_EFFORTS.join('|')}. Falling back to "${fallback}".`
    );
  }
  return fallback;
}

/**
 * Reasoning effort for generation calls. Defaults to "low": "none" was
 * measurably faster but produced wrong answers on calculation questions
 * (no scratch space to work the math the prompt demands), and a wrong
 * answer key on a practice test is worse than a slower generation.
 * Override with OPENAI_GENERATION_REASONING_EFFORT (e.g. "none" or
 * "minimal" on models that support it) when speed matters more than
 * calculation accuracy. Supported values vary per model - gpt-5.1 accepts
 * none/low/medium/high; some other gpt-5 models use "minimal".
 */
export const GENERATION_REASONING_EFFORT: ReasoningEffortValue = parseReasoningEffort(
  process.env.OPENAI_GENERATION_REASONING_EFFORT,
  'low'
);

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
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high';
  responseFormatJson?: boolean;
  timeout?: number;
}

/**
 * Build the shared request params, smoothing over the parameter differences
 * between classic (gpt-4o family) and reasoning (gpt-5 family / o-series)
 * models:
 *  - uses max_completion_tokens (supported everywhere; max_tokens is not)
 *  - maps temperature <-> reasoning_effort depending on the model
 */
function buildBaseParams(
  options: CreateChatCompletionOptions
): Omit<ChatCompletionCreateParamsNonStreaming, 'stream'> {
  const params: Omit<ChatCompletionCreateParamsNonStreaming, 'stream'> = {
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

  return params;
}

export async function createChatCompletion(
  options: CreateChatCompletionOptions
): Promise<ChatCompletion> {
  const openai = getOpenAI(options.timeout ? { timeout: options.timeout } : undefined);

  const params: ChatCompletionCreateParamsNonStreaming = buildBaseParams(options);

  return openai.chat.completions.create(params);
}

export interface CreateStreamingChatCompletionOptions extends CreateChatCompletionOptions {
  /** Called for each content delta as it arrives (for progress reporting). */
  onDelta?: (delta: string, fullTextSoFar: string) => void;
}

export interface StreamingChatCompletionResult {
  /** Concatenated content deltas (the full assistant message). */
  text: string;
  finishReason: string | null;
  usage: ChatCompletion['usage'];
}

/**
 * Streaming variant of createChatCompletion. Instead of waiting for the
 * entire completion (which for reasoning models includes all hidden thinking
 * tokens before the first output byte), it yields content deltas as they
 * arrive via onDelta, then resolves with the assembled text plus the
 * finish_reason/usage needed for logging and truncation detection.
 */
export async function createStreamingChatCompletion(
  options: CreateStreamingChatCompletionOptions
): Promise<StreamingChatCompletionResult> {
  const openai = getOpenAI(options.timeout ? { timeout: options.timeout } : undefined);

  const params: ChatCompletionCreateParamsStreaming = {
    ...buildBaseParams(options),
    stream: true,
    // Makes the final chunk carry the token usage so costs can be logged.
    stream_options: { include_usage: true },
  };

  const stream = await openai.chat.completions.create(params);

  let text = '';
  let finishReason: string | null = null;
  let usage: ChatCompletion['usage'];

  for await (const chunk of stream) {
    // With include_usage the last chunk has usage and an empty choices array.
    if (chunk.usage) {
      usage = chunk.usage;
    }
    const choice = chunk.choices?.[0];
    if (!choice) continue;
    if (choice.finish_reason) {
      finishReason = choice.finish_reason;
    }
    const delta = choice.delta?.content;
    if (delta) {
      text += delta;
      options.onDelta?.(delta, text);
    }
  }

  return { text, finishReason, usage };
}
