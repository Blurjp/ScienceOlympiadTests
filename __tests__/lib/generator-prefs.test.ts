/**
 * Tests for lib/generator-prefs.ts — localStorage-backed generator
 * preference persistence for the "Remember my selections" checkboxes.
 */
import {
  loadGeneratorPrefs,
  saveGeneratorPrefs,
  clearGeneratorPrefs,
  AI_GENERATOR_PREFS_KEY,
  PDF_GENERATOR_PREFS_KEY,
  type StoredAiGeneratorPrefs,
} from '@/lib/generator-prefs';

class MockStorage implements Storage {
  private map = new Map<string, string>();
  readonly length: number = 0;
  clear() { this.map.clear(); }
  getItem(key: string): string | null { return this.map.get(key) ?? null; }
  key(): string | null { return null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, value); }
}

describe('generator prefs storage', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  test('round-trips saved preferences', () => {
    const prefs: StoredAiGeneratorPrefs = {
      remember: true,
      topic: 'Astronomy',
      questionCount: 40,
      difficulty: 'State',
    };
    saveGeneratorPrefs(storage, AI_GENERATOR_PREFS_KEY, prefs);

    expect(loadGeneratorPrefs<StoredAiGeneratorPrefs>(storage, AI_GENERATOR_PREFS_KEY))
      .toEqual(prefs);
  });

  test('returns null for missing keys', () => {
    expect(loadGeneratorPrefs(storage, PDF_GENERATOR_PREFS_KEY)).toBeNull();
  });

  test('returns null for corrupt JSON instead of throwing', () => {
    storage.setItem(AI_GENERATOR_PREFS_KEY, '{not json');
    expect(loadGeneratorPrefs(storage, AI_GENERATOR_PREFS_KEY)).toBeNull();
  });

  test('returns null for non-object JSON (e.g. a bare number)', () => {
    storage.setItem(AI_GENERATOR_PREFS_KEY, '42');
    expect(loadGeneratorPrefs(storage, AI_GENERATOR_PREFS_KEY)).toBeNull();
  });

  test('clearGeneratorPrefs removes the stored entry', () => {
    saveGeneratorPrefs(storage, PDF_GENERATOR_PREFS_KEY, { remember: true, questionCount: 20 });
    clearGeneratorPrefs(storage, PDF_GENERATOR_PREFS_KEY);

    expect(loadGeneratorPrefs(storage, PDF_GENERATOR_PREFS_KEY)).toBeNull();
  });

  test('missing/undefined storage degrades to a no-op instead of throwing', () => {
    expect(() => saveGeneratorPrefs(undefined, AI_GENERATOR_PREFS_KEY, { remember: true })).not.toThrow();
    expect(() => clearGeneratorPrefs(undefined, AI_GENERATOR_PREFS_KEY)).not.toThrow();
    expect(loadGeneratorPrefs(undefined, AI_GENERATOR_PREFS_KEY)).toBeNull();
  });

  test('a storage that throws (quota/private mode) never surfaces the error', () => {
    const hostile = {
      getItem: () => { throw new Error('unavailable'); },
      setItem: () => { throw new Error('quota exceeded'); },
      removeItem: () => { throw new Error('unavailable'); },
    } as unknown as Storage;

    expect(() => saveGeneratorPrefs(hostile, AI_GENERATOR_PREFS_KEY, { remember: true })).not.toThrow();
    expect(() => clearGeneratorPrefs(hostile, AI_GENERATOR_PREFS_KEY)).not.toThrow();
    expect(loadGeneratorPrefs(hostile, AI_GENERATOR_PREFS_KEY)).toBeNull();
  });
});
