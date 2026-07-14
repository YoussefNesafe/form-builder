import { describe, expect, it } from "vitest";
import { resolveNav } from "./resolveNav";

describe("resolveNav", () => {
  it("pushes to a page result (no hash)", () => {
    expect(resolveNav("/docs/conditions", "/docs")).toEqual({
      kind: "push",
      href: "/docs/conditions",
    });
  });

  it("pushes to a hash result on a DIFFERENT page (cross-page deep link)", () => {
    expect(
      resolveNav("/docs/field-types#field-type-phone", "/docs/wizards"),
    ).toEqual({ kind: "push", href: "/docs/field-types#field-type-phone" });
  });

  it("scrolls in-page when the hash target is on the CURRENT page", () => {
    expect(
      resolveNav("/docs/wizards#step-gating", "/docs/wizards"),
    ).toEqual({
      kind: "scroll",
      id: "step-gating",
      href: "/docs/wizards#step-gating",
    });
  });
});
