import { describe, expect, it } from "vitest";
import { SHOWCASE_CARDS } from "./content";
import { peekFields } from "./fieldPeek";

describe("peekFields", () => {
  it("renders a field's real props as a compact single line", () => {
    const config = { id: "x", fields: [{ type: "phone" as const, name: "phone", countryFrom: "country" }] };
    expect(peekFields(config, ["phone"])).toBe('{ type: "phone", name: "phone", countryFrom: "country" }');
  });

  it("skips names that don't match any field instead of throwing", () => {
    const config = { id: "x", fields: [{ type: "text" as const, name: "a" }] };
    expect(peekFields(config, ["a", "nope"])).toBe('{ type: "text", name: "a" }');
  });

  // Every showcase card's peekFieldNames must resolve — a typo would
  // silently render fewer peek lines than intended (fieldPeek.ts skips
  // misses rather than throwing), so pin the count here instead.
  it.each(SHOWCASE_CARDS)("$slug's peekFieldNames all resolve against its real config", (card) => {
    const peek = peekFields(card.config, card.peekFieldNames);
    const lineCount = peek.split("\n").filter(Boolean).length;
    expect(lineCount).toBe(card.peekFieldNames.length);
  });
});
