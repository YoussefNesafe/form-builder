import { afterEach, describe, expect, it } from "vitest";
import { getField, getRegisteredTypes, registerField, type FieldComponentProps } from "./registry";

const ComponentA = ({ field }: FieldComponentProps) => field.name;
const ComponentB = ({ field }: FieldComponentProps) => field.name;

// The registry is anchored on globalThis (Symbol.for), not a plain
// module-level Map, so it persists across the whole worker process — without
// this, registrations from this file (custom-a/b/c/d) would leak into every
// other test file sharing the worker.
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
    // Simulates the dual ESM/CJS instance scenario: a second "instance" of this module
    // would look up the same Symbol.for key on globalThis and find this exact Map,
    // rather than creating its own. This is what prevents "field type not registered"
    // errors caused by version skew after the package is published.
    registerField("custom-d", ComponentA);
    const registryKey = Symbol.for("form-builder.fieldRegistry.v1");
    const globalRegistry = (globalThis as unknown as Record<symbol, Map<string, unknown> | undefined>)[
      registryKey
    ];
    expect(globalRegistry).toBeInstanceOf(Map);
    expect(globalRegistry?.get("custom-d")).toBe(ComponentA);
  });
});
