// Pins the SSR contract directly (no jsdom `window` presence/absence
// gymnastics): whatever `packageManager` currently is, the exported
// server-snapshot function must always return the deterministic default —
// that's what keeps server HTML and first client paint from mismatching.
// See packageManagerStore.ts's `getServerSnapshot` doc comment and
// CommandBlock.test.tsx for the end-to-end (component-level) coverage of
// the same contract.
import { describe, expect, it } from "vitest";
import { DEFAULT_PACKAGE_MANAGER } from "./command";
import { __resetPackageManagerStoreForTests, getServerSnapshot, setPackageManager } from "./packageManagerStore";

describe("getServerSnapshot", () => {
  it("returns DEFAULT_PACKAGE_MANAGER", () => {
    expect(getServerSnapshot()).toBe(DEFAULT_PACKAGE_MANAGER);
  });

  it("stays DEFAULT_PACKAGE_MANAGER even after the client selection changes", () => {
    setPackageManager("bun");
    try {
      expect(getServerSnapshot()).toBe(DEFAULT_PACKAGE_MANAGER);
    } finally {
      __resetPackageManagerStoreForTests();
      window.localStorage.clear();
    }
  });
});
