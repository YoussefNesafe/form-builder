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
