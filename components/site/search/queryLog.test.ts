import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { logEmptyQuery } from "./queryLog";

const STORAGE_KEY = "fb:search:empty-queries";

beforeAll(() => {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    },
  });
});

function stored(): { q: string; at: number }[] {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
}

describe("logEmptyQuery", () => {
  beforeEach(() => window.localStorage.clear());

  it("appends a trimmed query", () => {
    logEmptyQuery("  colorpicker  ");
    expect(stored().map((r) => r.q)).toEqual(["colorpicker"]);
  });

  it("ignores empty / whitespace-only queries", () => {
    logEmptyQuery("   ");
    logEmptyQuery("");
    expect(stored()).toEqual([]);
  });

  it("skips a consecutive duplicate of the most recent query", () => {
    logEmptyQuery("wysiwyg");
    logEmptyQuery("wysiwyg");
    logEmptyQuery("markdown");
    expect(stored().map((r) => r.q)).toEqual(["wysiwyg", "markdown"]);
  });

  it("caps the log at 50 entries (keeps the most recent)", () => {
    for (let i = 0; i < 60; i++) logEmptyQuery(`q${i}`);
    const list = stored();
    expect(list).toHaveLength(50);
    expect(list[0].q).toBe("q10");
    expect(list[list.length - 1].q).toBe("q59");
  });

  it("recovers from a corrupted (non-array) stored value without throwing", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: "an array" }));
    expect(() => logEmptyQuery("recovered")).not.toThrow();
    expect(stored().map((r) => r.q)).toEqual(["recovered"]);
  });
});
