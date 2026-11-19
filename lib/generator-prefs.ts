/**
 * Client-side persistence for generator form preferences (localStorage).
 *
 * Keeps "Remember my selections" state for the AI Test Generator and the
 * Exam-Inspired Generator so returning users don't re-pick topic, level,
 * and question count on every visit. Storage failures (private mode,
 * quota, disabled) are silently ignored — persistence is a convenience,
 * never a blocker.
 */

export interface StoredAiGeneratorPrefs {
  remember: boolean;
  topic?: string;
  questionCount?: number;
  difficulty?: 'Invitational' | 'Regional' | 'State' | 'National';
}

export interface StoredPdfGeneratorPrefs {
  remember: boolean;
  sourceId?: string;
  questionCount?: number;
}

export const AI_GENERATOR_PREFS_KEY = 'sot:generator-prefs:ai';
export const PDF_GENERATOR_PREFS_KEY = 'sot:generator-prefs:pdf';

/** Read and parse stored prefs; null when absent, corrupt, or not an object. */
export function loadGeneratorPrefs<T>(
  storage: Storage | null | undefined,
  key: string
): T | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
}

/** Serialize prefs to storage; ignores quota/private-mode failures. */
export function saveGeneratorPrefs(
  storage: Storage | null | undefined,
  key: string,
  prefs: unknown
): void {
  try {
    storage?.setItem(key, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

/** Remove stored prefs (when the user unchecks "remember"). */
export function clearGeneratorPrefs(
  storage: Storage | null | undefined,
  key: string
): void {
  try {
    storage?.removeItem(key);
  } catch {
    // ignore
  }
}
