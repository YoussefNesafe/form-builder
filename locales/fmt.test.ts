import { describe, expect, it } from "vitest";
import { fmt, t } from "./index";

describe("fmt", () => {
  it("interpolates a single placeholder", () => {
    expect(fmt("Hello {name}", { name: "World" })).toBe("Hello World");
  });

  it("interpolates multiple placeholders", () => {
    expect(fmt("{a} + {b} = {c}", { a: 1, b: 2, c: 3 })).toBe("1 + 2 = 3");
  });

  it("leaves a placeholder untouched when its param is missing", () => {
    expect(fmt("Hello {name}", {})).toBe("Hello {name}");
  });

  it("returns the string unchanged when it has no placeholders", () => {
    expect(fmt("Hello", { name: "World" })).toBe("Hello");
  });
});

describe("dictionary smoke test", () => {
  it("exposes the expected nav keys", () => {
    expect(t.nav.brand).toBe("Form Builder");
    expect(t.nav.links.builder).toBeTruthy();
    expect(t.nav.links.examples).toBeTruthy();
    expect(t.nav.links.docs).toBeTruthy();
    expect(t.nav.githubLabel).toBeTruthy();
  });

  it("exposes the expected common keys", () => {
    expect(t.common.skipToContent).toBeTruthy();
  });
});
