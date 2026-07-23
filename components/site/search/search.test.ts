import { describe, expect, it } from "vitest";
import { searchDocs } from "./search";
import { docsSearchIndex } from "./buildDocsIndex";
import type { SearchEntry } from "./types";

const FIXTURE: SearchEntry[] = [
  { id: "/docs/conditions", title: "Conditions", href: "/docs/conditions", group: "page", excerpt: "visibleWhen and friends" },
  { id: "/docs", title: "Overview", href: "/docs", group: "page" },
  { id: "field-type-phone", title: "Phone", href: "/docs/field-types#field-type-phone", group: "fieldType", excerpt: "International phone input", keywords: "countryFrom syncs the country" },
  { id: "/docs/wizards#step-gating", title: "Step gating", href: "/docs/wizards#step-gating", group: "heading" },
];

describe("searchDocs", () => {
  it("returns only pages (default browse) for an empty query", () => {
    const results = searchDocs(FIXTURE, "   ");
    expect(results.map((r) => r.id)).toEqual(["/docs/conditions", "/docs"]);
  });

  it("matches titles case-insensitively", () => {
    const results = searchDocs(FIXTURE, "PHONE");
    expect(results.map((r) => r.id)).toContain("field-type-phone");
  });

  it("ranks an exact title above a substring hit", () => {
    const index: SearchEntry[] = [
      { id: "b", title: "Phone number rules", href: "/b", group: "heading" },
      { id: "a", title: "Phone", href: "/a", group: "fieldType" },
    ];
    expect(searchDocs(index, "phone")[0].id).toBe("a");
  });

  it("matches an entry's excerpt when the title does not", () => {
    const results = searchDocs(FIXTURE, "international");
    expect(results.map((r) => r.id)).toEqual(["field-type-phone"]);
  });

  it("matches keywords (searched but not shown) when title and excerpt miss", () => {
    const results = searchDocs(FIXTURE, "countryfrom");
    expect(results.map((r) => r.id)).toEqual(["field-type-phone"]);
  });

  it("returns nothing for a query that hits no field", () => {
    expect(searchDocs(FIXTURE, "zzzznope")).toEqual([]);
  });
});

describe("docsSearchIndex (derived, real data)", () => {
  it("includes every docs page, all 24 field types, and section headings", () => {
    const groups = docsSearchIndex.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.group] = (acc[entry.group] ?? 0) + 1;
      return acc;
    }, {});
    expect(groups.page).toBe(9);
    expect(groups.fieldType).toBe(24);
    expect(groups.heading).toBeGreaterThan(0);
  });

  it("deep-links field types to their anchor on the field-types page", () => {
    const phone = docsSearchIndex.find((e) => e.id === "field-type-phone");
    expect(phone?.href).toBe("/docs/field-types#field-type-phone");
  });

  it("gives every entry a unique id (cmdk item value)", () => {
    const ids = docsSearchIndex.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
