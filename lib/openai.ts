import OpenAI from 'openai';

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

// GPT-4o-mini pricing (USD per 1K tokens)
export const PRICE_PER_1K_PROMPT_TOKENS = 0.00015;
export const PRICE_PER_1K_COMPLETION_TOKENS = 0.0006;

// GPT-4o pricing (USD per 1K tokens)
export const GPT4O_PRICE_PER_1K_PROMPT_TOKENS = 0.0025;
export const GPT4O_PRICE_PER_1K_COMPLETION_TOKENS = 0.01;

export function computeCostUsd(
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  opts: { model?: 'gpt-4o-mini' | 'gpt-4o' } = {}
): number {
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;
  const promptPrice = opts.model === 'gpt-4o'
    ? GPT4O_PRICE_PER_1K_PROMPT_TOKENS
    : PRICE_PER_1K_PROMPT_TOKENS;
  const completionPrice = opts.model === 'gpt-4o'
    ? GPT4O_PRICE_PER_1K_COMPLETION_TOKENS
    : PRICE_PER_1K_COMPLETION_TOKENS;
  return (promptTokens / 1000) * promptPrice + (completionTokens / 1000) * completionPrice;
}
