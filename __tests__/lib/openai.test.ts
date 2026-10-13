/**
 * Tests for lib/openai.ts
 */
import {
  computeCostUsd,
  MODEL_PRICES_PER_1M,
  GRADING_MODEL,
  PARSING_MODEL,
  GENERATION_MODEL,
  isReasoningModel,
} from '@/lib/openai';

describe('computeCostUsd', () => {
  test('computes cost for every configured model role', () => {
    for (const model of [GRADING_MODEL, PARSING_MODEL, GENERATION_MODEL]) {
      expect(MODEL_PRICES_PER_1M[model]).toBeDefined();

      const cost = computeCostUsd({ prompt_tokens: 1_000_000, completion_tokens: 1_000_000 }, { model });
      expect(cost).toBeCloseTo(
        MODEL_PRICES_PER_1M[model].prompt + MODEL_PRICES_PER_1M[model].completion,
        10
      );
    }
  });

  test('computes gpt-4o-mini cost (legacy model kept for historical rows)', () => {
    const cost = computeCostUsd(
      { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
      { model: 'gpt-4o-mini' }
    );
    expect(cost).toBeCloseTo(0.15 + 0.6, 10);
  });

  test('defaults to the grading model when no model specified', () => {
    const usage = { prompt_tokens: 1000, completion_tokens: 1000 };
    const withDefault = computeCostUsd(usage);
    const explicit = computeCostUsd(usage, { model: GRADING_MODEL });
    expect(withDefault).toBe(explicit);
  });

  test('returns 0 for unknown models instead of guessing', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(computeCostUsd({ prompt_tokens: 100, completion_tokens: 100 }, { model: 'gpt-nonexistent' })).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('returns 0 for undefined usage', () => {
    expect(computeCostUsd(undefined)).toBe(0);
  });

  test('treats missing token counts as 0', () => {
    expect(computeCostUsd({})).toBe(0);
    expect(computeCostUsd({ prompt_tokens: 500 })).toBeCloseTo((500 / 1_000_000) * MODEL_PRICES_PER_1M[GRADING_MODEL].prompt, 10);
    expect(computeCostUsd({ completion_tokens: 500 })).toBeCloseTo((500 / 1_000_000) * MODEL_PRICES_PER_1M[GRADING_MODEL].completion, 10);
  });

  test('scales linearly with token counts', () => {
    const small = computeCostUsd({ prompt_tokens: 100, completion_tokens: 100 });
    const large = computeCostUsd({ prompt_tokens: 10_000, completion_tokens: 10_000 });
    expect(large).toBeCloseTo(small * 100, 8);
  });
});

describe('isReasoningModel', () => {
  test('identifies gpt-5 family and o-series models', () => {
    expect(isReasoningModel('gpt-5-mini')).toBe(true);
    expect(isReasoningModel('gpt-5.4-mini')).toBe(true);
    expect(isReasoningModel('gpt-6-luna')).toBe(true);
    expect(isReasoningModel('o3')).toBe(true);
    expect(isReasoningModel('o4-mini')).toBe(true);
  });

  test('rejects classic models', () => {
    expect(isReasoningModel('gpt-4o')).toBe(false);
    expect(isReasoningModel('gpt-4o-mini')).toBe(false);
    expect(isReasoningModel('gpt-4.1-mini')).toBe(false);
  });
});
