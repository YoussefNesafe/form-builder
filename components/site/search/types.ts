/**
 * Contract the search palette consumes. The concrete index is derived on the
 * server (buildDocsIndex.ts) from already-authored structured data — page
 * titles, per-page section {id,title} arrays, and the field-type dictionary —
 * and handed to the client palette as plain data. Keeping the UI behind this
 * abstract shape is the seam that makes a future swap to a full-text engine
 * (e.g. Pagefind) a data-source change, not a UI rewrite. See ADR / discovery
 * notes: MVP is navigation search (titles + headings + field reference), NOT
 * full prose body-text.
 */
export type SearchGroup = "page" | "fieldType" | "heading";

export type SearchEntry = {
  /** Stable, unique key across the whole index (used as the cmdk item value). */
  id: string;
  /** Primary matched + displayed text. */
  title: string;
  /** Destination — a docs path, optionally with a `#heading` anchor. */
  href: string;
  group: SearchGroup;
  /** Shown as a subtitle AND searched (e.g. a field's description, a page blurb). */
  excerpt?: string;
  /** Searched but not shown (e.g. a field type's longer note). */
  keywords?: string;
};
