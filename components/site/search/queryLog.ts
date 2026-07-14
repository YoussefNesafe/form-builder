/**
 * Client-only ring buffer of queries that returned NO results, in
 * localStorage. This is the deferred-full-text signal (discovery Q3): if these
 * logs fill with body-text phrases the metadata index can't answer, that's the
 * evidence to add a full-text engine later. No backend, no analytics vendor —
 * a purely local, capped list a maintainer can inspect in devtools.
 */
const STORAGE_KEY = "fb:search:empty-queries";
const MAX_ENTRIES = 50;

export type EmptyQueryRecord = { q: string; at: number };

export function logEmptyQuery(rawQuery: string): void {
  if (typeof window === "undefined") return;
  const q = rawQuery.trim();
  if (!q) return;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    const list: EmptyQueryRecord[] = Array.isArray(parsed) ? parsed : [];

    // Skip if the most recent record is the same query (avoids logging every
    // keystroke of one word as the user types past a no-match point).
    if (list[list.length - 1]?.q === q) return;

    list.push({ q, at: Date.now() });
    const trimmed = list.slice(-MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable (private mode / quota) — logging is best-effort.
  }
}
