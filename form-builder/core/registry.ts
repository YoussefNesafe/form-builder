import type { ComponentType } from "react";
import type { AnyFieldConfig } from "./types";

export type FieldComponentProps = { field: AnyFieldConfig };

type FieldRegistryMap = Map<string, ComponentType<FieldComponentProps>>;

// The registry Map is anchored on globalThis (via a versioned Symbol.for key) instead of
// living as a plain module-level `const`. Once this package is published to npm, version
// skew or dual ESM/CJS resolution can load TWO separate instances of this module — each
// would get its own Map, so `registerField` (writing to instance A) and `getField`
// (reading from instance B) would silently disagree, surfacing as "field type not
// registered" at render. Symbol.for(...) uses the runtime-wide global symbol registry, so
// every module instance resolves the same key and therefore shares the same Map. The key
// is versioned ("v1") so a future breaking change to the registry's shape can move to a
// new key without colliding with old instances still expecting the old shape. Do not
// simplify this back to a bare module-level Map.
const REGISTRY_KEY = Symbol.for("form-builder.fieldRegistry.v1");

function getRegistry(): FieldRegistryMap {
  // Localized cast: globalThis has no typed slot for our symbol key. This is the one
  // point where an unchecked cast is allowed so the public API below stays fully typed.
  const globalWithRegistry = globalThis as unknown as Record<symbol, FieldRegistryMap | undefined>;
  const existing = globalWithRegistry[REGISTRY_KEY];
  if (existing) return existing;
  const created: FieldRegistryMap = new Map();
  globalWithRegistry[REGISTRY_KEY] = created;
  return created;
}

export function registerField(type: string, component: ComponentType<FieldComponentProps>): void {
  getRegistry().set(type, component);
}

export function getField(type: string): ComponentType<FieldComponentProps> | undefined {
  return getRegistry().get(type);
}

export function getRegisteredTypes(): string[] {
  return [...getRegistry().keys()];
}
