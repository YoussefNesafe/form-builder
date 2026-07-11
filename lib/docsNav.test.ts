import { describe, expect, it } from "vitest";
import { DOCS_PAGES, getDocsPagination } from "./docsNav";

describe("getDocsPagination", () => {
  it("first page has no prev and points at the second page", () => {
    const first = DOCS_PAGES[0];
    const result = getDocsPagination(first.href);
    expect(result.prev).toBeNull();
    expect(result.next).toEqual(DOCS_PAGES[1]);
  });

  it("last page has no next and points back at the previous page", () => {
    const last = DOCS_PAGES[DOCS_PAGES.length - 1];
    const result = getDocsPagination(last.href);
    expect(result.next).toBeNull();
    expect(result.prev).toEqual(DOCS_PAGES[DOCS_PAGES.length - 2]);
  });

  it("middle pages link both directions in DOCS_PAGES order", () => {
    for (let i = 1; i < DOCS_PAGES.length - 1; i++) {
      const result = getDocsPagination(DOCS_PAGES[i].href);
      expect(result.prev).toEqual(DOCS_PAGES[i - 1]);
      expect(result.next).toEqual(DOCS_PAGES[i + 1]);
    }
  });

  it("unknown pathname yields no pagination", () => {
    expect(getDocsPagination("/not-a-docs-page")).toEqual({ prev: null, next: null });
  });
});
