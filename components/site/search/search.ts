import type { SearchEntry, SearchGroup } from "./types";

const GROUP_RANK: Record<SearchGroup, number> = {
  page: 0,
  fieldType: 1,
  heading: 2,
};

export function searchDocs(index: SearchEntry[], rawQuery: string): SearchEntry[] {
  const q = rawQuery.trim().toLowerCase();

  if (!q) return index.filter((entry) => entry.group === "page");

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of index) {
    const title = entry.title.toLowerCase();
    const excerpt = entry.excerpt?.toLowerCase() ?? "";
    const keywords = entry.keywords?.toLowerCase() ?? "";

    let score = -1;
    if (title === q) score = 100;
    else if (title.startsWith(q)) score = 80;
    else if (title.includes(q)) score = 60;
    else if (excerpt.includes(q)) score = 30;
    else if (keywords.includes(q)) score = 20;

    if (score < 0) continue;
    scored.push({ entry, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      GROUP_RANK[a.entry.group] - GROUP_RANK[b.entry.group] ||
      a.entry.title.localeCompare(b.entry.title),
  );

  return scored.map((s) => s.entry);
}
