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

    if (list[list.length - 1]?.q === q) return;

    list.push({ q, at: Date.now() });
    const trimmed = list.slice(-MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
  }
}
