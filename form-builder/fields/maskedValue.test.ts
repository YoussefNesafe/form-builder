import { describe, expect, it } from "vitest";
import { extractRaw, formatMasked, maskTokenCount } from "./maskedValue";

const CARD = "#### #### #### ####";

describe("maskTokenCount", () => {
  it("counts only token chars", () => {
    expect(maskTokenCount(CARD)).toBe(16);
    expect(maskTokenCount("AA-####")).toBe(6);
    expect(maskTokenCount("---")).toBe(0);
  });
});

describe("formatMasked", () => {
  it("inserts literals between token groups", () => {
    expect(formatMasked("4111111111111111", CARD)).toBe("4111 1111 1111 1111");
  });

  it("formats partial raw values without trailing literals", () => {
    expect(formatMasked("4111", CARD)).toBe("4111");
    expect(formatMasked("41115", CARD)).toBe("4111 5");
    expect(formatMasked("", CARD)).toBe("");
  });

  it("handles letter and wildcard tokens with literals", () => {
    expect(formatMasked("AB1234", "AA-##-##")).toBe("AB-12-34");
  });
});

describe("extractRaw", () => {
  it("is the inverse of formatMasked", () => {
    expect(extractRaw("4111 1111 1111 1111", CARD)).toBe("4111111111111111");
    expect(extractRaw("AB-12-34", "AA-##-##")).toBe("AB1234");
  });

  it("drops chars that do not fit the next token class", () => {
    expect(extractRaw("41ab", "####")).toBe("41");
    expect(extractRaw("ab12", "AA##")).toBe("ab12");
    expect(extractRaw("1a2b", "AA##")).toBe("ab");
  });

  it("caps the raw value at the token count", () => {
    expect(extractRaw("41111111111111119999", CARD)).toBe("4111111111111111");
  });

  it("returns empty for a tokenless mask", () => {
    expect(extractRaw("anything", "---")).toBe("");
  });

  it("literals matching a token class are not absorbed (leading digit literal)", () => {
    const phone = "+1 ### ###";
    expect(extractRaw("5", phone)).toBe("5");
    expect(formatMasked("5", phone)).toBe("+1 5");
    expect(extractRaw("+1 56", phone)).toBe("56");
    expect(extractRaw("+1 567 89", phone)).toBe("56789");
  });

  it("round-trips masks whose literals collide with token classes", () => {
    for (const [raw, mask] of [
      ["b4", "A3#"],
      ["567890", "+1 ### ###"],
      ["12", "#-#"],
    ] as const) {
      expect(extractRaw(formatMasked(raw, mask), mask)).toBe(raw);
    }
  });
});
