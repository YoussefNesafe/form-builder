import { describe, it, expect, beforeEach } from "vitest";
import { newId, resetIds, syncCounterFromIds } from "./ids";

beforeEach(() => resetIds());

describe("id counter", () => {
  it("issues monotonic ids", () => {
    expect(newId()).toBe("n1");
    expect(newId()).toBe("n2");
  });

  it("advances past restored ids so it never re-issues a live one", () => {
    // Simulates rehydration from persisted nodes n1..n5 into a fresh module.
    syncCounterFromIds(["n1", "n3", "n5", "not-an-id"]);
    expect(newId()).toBe("n6");
  });
});
