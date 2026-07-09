import { describe, it, expect } from "vitest";
import { structuralKey } from "./structuralKey";
import type { BuilderNode } from "./types";

const n = (id: string, type: BuilderNode["type"], name: string): BuilderNode => ({ _id: id, type, props: { name } });

describe("structuralKey", () => {
  const base = [n("1", "text", "a"), n("2", "email", "b")];

  it("is stable when only cosmetic props change", () => {
    const withLabels = [
      { ...base[0], props: { name: "a", label: "Label", placeholder: "x" } },
      base[1],
    ];
    expect(structuralKey(withLabels, [], false)).toBe(structuralKey(base, [], false));
  });

  it("changes on rename", () => {
    const renamed = [{ ...base[0], props: { name: "z" } }, base[1]];
    expect(structuralKey(renamed, [], false)).not.toBe(structuralKey(base, [], false));
  });

  it("changes on reorder and on type change", () => {
    expect(structuralKey([base[1], base[0]], [], false)).not.toBe(structuralKey(base, [], false));
    const retyped = [{ ...base[0], type: "number" as const }, base[1]];
    expect(structuralKey(retyped, [], false)).not.toBe(structuralKey(base, [], false));
  });

  it("reflects step assignment only when multiStep is on", () => {
    const steps = [{ title: "S", nodeIds: ["1"] }];
    expect(structuralKey(base, steps, false)).toBe(structuralKey(base, [], false));
    expect(structuralKey(base, steps, true)).not.toBe(structuralKey(base, [], true));
  });
});
