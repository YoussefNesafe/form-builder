import { describe, expect, it } from "vitest";
import { splitLineComment } from "./codeHighlight";

describe("splitLineComment", () => {
  it("splits a standalone comment line, preserving leading indentation", () => {
    expect(splitLineComment("  // Condition[] — every entry must match (AND)")).toEqual({
      code: "  ",
      comment: "// Condition[] — every entry must match (AND)",
    });
  });

  it("splits a trailing comment after code", () => {
    expect(splitLineComment("visibleWhen: [ // start of the AND list")).toEqual({
      code: "visibleWhen: [ ",
      comment: "// start of the AND list",
    });
  });

  it("returns no comment for a plain code line", () => {
    expect(splitLineComment('  { field: "country", equals: "US" },')).toEqual({
      code: '  { field: "country", equals: "US" },',
      comment: null,
    });
  });

  it("does NOT treat // inside a double-quoted string as a comment", () => {
    expect(splitLineComment('  url: "https://example.com",')).toEqual({
      code: '  url: "https://example.com",',
      comment: null,
    });
  });

  it("does NOT treat // inside a single-quoted string as a comment", () => {
    expect(splitLineComment("  href: 'a//b',")).toEqual({
      code: "  href: 'a//b',",
      comment: null,
    });
  });

  it("finds the real comment after a string that contains //", () => {
    expect(splitLineComment('  url: "https://x.com", // the endpoint')).toEqual({
      code: '  url: "https://x.com", ',
      comment: "// the endpoint",
    });
  });

  it("ignores // inside a string with an escaped quote before the real comment", () => {
    expect(splitLineComment('  label: "he said \\"//\\" ok", // note')).toEqual({
      code: '  label: "he said \\"//\\" ok", ',
      comment: "// note",
    });
  });

  it("ignores // inside a template literal", () => {
    expect(splitLineComment("  path: `a//b`,")).toEqual({
      code: "  path: `a//b`,",
      comment: null,
    });
  });

  it("returns the whole line as code when empty", () => {
    expect(splitLineComment("")).toEqual({ code: "", comment: null });
  });
});
