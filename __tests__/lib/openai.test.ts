/**
 * Tests for lib/openai.ts
 */
import { computeCostUsd, PRICE_PER_1K_PROMPT_TOKENS, PRICE_PER_1K_COMPLETION_TOKENS } from '@/lib/openai';

describe('computeCostUsd', () => {
  test('computes gpt-4o-mini cost from usage', () => {
    const cost = computeCostUsd({ prompt_tokens: 1000, completion_tokens: 1000 });
    expect(cost).toBeCloseTo(PRICE_PER_1K_PROMPT_TOKENS + PRICE_PER_1K_COMPLETION_TOKENS, 10);
  });

  test('computes gpt-4o cost when model specified', () => {
    const cost = computeCostUsd({ prompt_tokens: 1000, completion_tokens: 1000 }, { model: 'gpt-4o' });
    expect(cost).toBeCloseTo(0.0025 + 0.01, 10);
  });

  test('returns 0 for undefined usage', () => {
    expect(computeCostUsd(undefined)).toBe(0);
  });

  test('treats missing token counts as 0', () => {
    expect(computeCostUsd({})).toBe(0);
    expect(computeCostUsd({ prompt_tokens: 500 })).toBeCloseTo(500 / 1000 * PRICE_PER_1K_PROMPT_TOKENS, 10);
    expect(computeCostUsd({ completion_tokens: 500 })).toBeCloseTo(500 / 1000 * PRICE_PER_1K_COMPLETION_TOKENS, 10);
  });

  test('scales linearly with token counts', () => {
    const small = computeCostUsd({ prompt_tokens: 100, completion_tokens: 100 });
    const large = computeCostUsd({ prompt_tokens: 10000, completion_tokens: 10000 });
    expect(large).toBeCloseTo(small * 100, 8);
  });
});
