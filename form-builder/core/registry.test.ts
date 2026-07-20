import { afterEach, describe, expect, it } from "vitest";
import { getField, getRegisteredTypes, registerField, type FieldComponentProps } from "./registry";

const ComponentA = ({ field }: FieldComponentProps) => field.name;
const ComponentB = ({ field }: FieldComponentProps) => field.name;

afterEach(() => {
  const registryKey = Symbol.for("form-builder.fieldRegistry.v1");
  delete (globalThis as unknown as Record<symbol, unknown>)[registryKey];
});

describe("field registry", () => {
  it("returns registered component", () => {
    registerField("custom-a", ComponentA);
    expect(getField("custom-a")).toBe(ComponentA);
  });

  it("returns undefined for unknown type", () => {
    expect(getField("never-registered")).toBeUndefined();
  });

  it("re-registering overrides previous component", () => {
    registerField("custom-b", ComponentA);
    registerField("custom-b", ComponentB);
    expect(getField("custom-b")).toBe(ComponentB);
  });

  it("lists registered types", () => {
    registerField("custom-c", ComponentA);
    expect(getRegisteredTypes()).toContain("custom-c");
  });

  it("anchors the registry on globalThis so separate module instances would share it", () => {
    registerField("custom-d", ComponentA);
    const registryKey = Symbol.for("form-builder.fieldRegistry.v1");
    const globalRegistry = (globalThis as unknown as Record<symbol, Map<string, unknown> | undefined>)[
      registryKey
    ];
    expect(globalRegistry).toBeInstanceOf(Map);
    expect(globalRegistry?.get("custom-d")).toBe(ComponentA);
  });
});
