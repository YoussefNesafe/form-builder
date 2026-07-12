import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// TOC_ITEMS ids and <DocsSection id> values are two hand-maintained lists per
// page — this source-level scan keeps them from drifting (a typo'd TOC id is
// a silent dead link at runtime: getElementById returns null, no error).
// DocsSection composes DocsH2(id) internally (see components/docs/DocsProse
// .tsx), so the id now surfaces as a <DocsSection id="..."> attribute in
// page source rather than a raw <H2 id="...">.
const DOCS_DIR = path.resolve(process.cwd(), "app", "(site)", "docs");
const PAGES = ["installation", "your-first-form", "conditions", "wizards", "field-types"];

function extractTocIds(src: string): string[] {
  const block = src.match(/const TOC_ITEMS[^=]*=\s*\[([\s\S]*?)\];/);
  if (!block) return [];
  return [...block[1].matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
}

function extractHeadingIds(src: string): string[] {
  // Ordering-agnostic: id need not be the first attribute on <DocsSection>.
  return [...src.matchAll(/<DocsSection\b[^>]*?\bid="([^"]+)"/g)].map((m) => m[1]);
}

describe("docs TOC ids match heading ids", () => {
  for (const page of PAGES) {
    it(`${page}: every TOC id resolves to a <DocsSection id>`, () => {
      const src = readFileSync(path.join(DOCS_DIR, page, "page.tsx"), "utf8");
      const headingIds = new Set(extractHeadingIds(src));
      const tocIds = extractTocIds(src);
      for (const id of tocIds) {
        expect(headingIds.has(id), `TOC id "${id}" has no matching <DocsSection id> in ${page}/page.tsx`).toBe(
          true,
        );
      }
      // And the inverse: a heading missing from the TOC is a silent gap.
      for (const id of headingIds) {
        expect(
          tocIds.includes(id),
          `<DocsSection id="${id}"> in ${page}/page.tsx is missing from TOC_ITEMS`,
        ).toBe(true);
      }
    });
  }
});
