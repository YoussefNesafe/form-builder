import { describe, it, expect } from "vitest";
import { findContext, eligibleRefs, visibleDescriptors } from "./context";
import { FIELD_PROPS } from "./fieldProps";
import type { BuilderNode } from "./types";

const node = (id: string, type: BuilderNode["type"], props: Record<string, unknown> = {}): BuilderNode => ({
  _id: id,
  type,
  props: { name: id, ...props },
});

const tree: BuilderNode[] = [
  node("email", "email"),
  node("otp1", "otp"),
  node("res", "country"),
  node("sel", "select", { multiple: true }),
  { ...node("grp", "group"), children: [node("child", "text"), node("childOtp", "otp")] },
];

describe("findContext", () => {
  it("finds a top-level node (not nested)", () => {
    const ctx = findContext(tree, "otp1")!;
    expect(ctx.node.type).toBe("otp");
    expect(ctx.isNested).toBe(false);
    expect(ctx.siblings).toBe(tree);
  });

  it("finds a nested node and reports its group siblings", () => {
    const ctx = findContext(tree, "child")!;
    expect(ctx.isNested).toBe(true);
    expect(ctx.siblings.map((n) => n._id)).toEqual(["child", "childOtp"]);
  });

  it("returns null for an unknown id", () => {
    expect(findContext(tree, "nope")).toBeNull();
  });
});

describe("eligibleRefs", () => {
  it("otp refKind lists only sibling otp fields, excluding self", () => {
    expect(eligibleRefs(tree, "otp", "email")).toEqual(["otp1"]);
    expect(eligibleRefs(tree, "otp", "otp1")).toEqual([]);
  });

  it("countrySource lists country + single-value selects, not multi-selects", () => {
    const names = eligibleRefs(tree, "countrySource", "phoneX");
    expect(names).toContain("res");
    expect(names).not.toContain("sel");
  });

  it("any lists every named sibling except self", () => {
    expect(eligibleRefs(tree, "any", "email")).toEqual(["otp1", "res", "sel", "grp"]);
  });
});

describe("visibleDescriptors", () => {
  it("keeps all descriptors at the top level", () => {
    const all = FIELD_PROPS.otp;
    expect(visibleDescriptors(all, false)).toBe(all);
  });

  it("drops enabledWhenVerified/dependsOn/countryFrom when nested in a group", () => {
    const keys = visibleDescriptors(FIELD_PROPS.otp, true).map((d) => d.key);
    expect(keys).not.toContain("dependsOn");
    expect(keys).not.toContain("enabledWhenVerified");
    const phoneKeys = visibleDescriptors(FIELD_PROPS.phone, true).map((d) => d.key);
    expect(phoneKeys).not.toContain("countryFrom");
  });
});
