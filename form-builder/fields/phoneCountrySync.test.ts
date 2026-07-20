import { describe, expect, it } from "vitest";
import { applyCountryToPhoneValue } from "./phoneCountrySync";

describe("applyCountryToPhoneValue", () => {
  it("seeds an empty value with the calling code", () => {
    expect(applyCountryToPhoneValue("", "AE")).toBe("+971");
  });

  it("rewrites the calling code and preserves national digits", () => {
    expect(applyCountryToPhoneValue("+201001234567", "AE")).toBe("+9711001234567");
  });

  it("handles partially typed numbers", () => {
    expect(applyCountryToPhoneValue("+2010", "AE")).toBe("+97110");
  });

  it("is idempotent for the same country", () => {
    expect(applyCountryToPhoneValue("+971501234567", "AE")).toBe("+971501234567");
  });

  it("returns null for an unknown ISO code", () => {
    expect(applyCountryToPhoneValue("+201001234567", "XX")).toBeNull();
  });

  it("falls back to a bare calling code when the value has no parseable prefix", () => {
    expect(applyCountryToPhoneValue("+", "AE")).toBe("+971");
  });

  it("discards national-format digits typed without a calling code", () => {
    expect(applyCountryToPhoneValue("0501234567", "AE")).toBe("+971");
  });

  it("is a no-op across countries sharing a calling code", () => {
    expect(applyCountryToPhoneValue("+12025550123", "CA")).toBe("+12025550123");
  });
});
