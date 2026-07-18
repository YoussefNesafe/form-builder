/**
 * Closure planner — which registry items (form-engine, fb-ui-*, field-*,
 * fb-theme, the form-builder aggregate) a requested install needs. Moved
 * here verbatim from the earlier scripts/form-builder-add.mjs (the shadcn-
 * add-based installer this CLI replaces) — the CLOSURE math didn't change,
 * only how the resolved items get onto disk (see install.mjs: direct copy +
 * import-rewrite instead of `shadcn add`).
 */

export function primitiveItemName(name) {
  return `fb-ui-${name}`;
}

export function normalizeFieldToken(token) {
  return token.startsWith("field-") ? token : `field-${token}`;
}

/**
 * Expands a set of requested field item names into the full concrete
 * item-name set to install.
 *
 * form-engine itself imports shadcn primitives — `ui/FieldWrapper.tsx` needs
 * `@/components/ui/field`, `components/FormStepper.tsx` needs
 * `@/components/ui/button`, `components/ReviewStep.tsx` needs `button` +
 * `separator`. Adding "form-engine" to the result WITHOUT also expanding
 * model.engine.uiDeps (the engine's own primitive closure, computed by
 * scanEngine() in scripts/build-registry.mjs) would ship form-engine's files
 * with unresolved `@/components/ui/*` imports in the consumer. A
 * single-field install (e.g. "text") exposes this; installing "all" masks
 * it because the union of every field's own uiDeps happens to already cover
 * fb-ui-field/fb-ui-separator.
 */
export function resolveInstallSet(requestedFieldItemNames, { includeTheme, model }) {
  const { fields, primitives, engine } = model;
  const result = new Set();

  const addPrimitive = (name) => {
    const itemName = primitiveItemName(name);
    if (result.has(itemName)) return;
    result.add(itemName);
    const info = primitives.get(name);
    if (!info) throw new Error(`form-builder: registry model has no primitive "${name}"`);
    for (const dep of info.registryDeps) addPrimitive(dep);
  };

  const addEngine = () => {
    if (result.has("form-engine")) return;
    result.add("form-engine");
    // form-engine's npm dependencies already live in its own npmDeps set
    // (deduped when installed); only its UI-primitive closure needs
    // expanding here.
    for (const name of engine.uiDeps) addPrimitive(name);
  };

  for (const itemName of requestedFieldItemNames) {
    const info = fields.get(itemName);
    if (!info) {
      const available = [...fields.keys()].sort().join(", ");
      throw new Error(`form-builder: unknown field item "${itemName}". Available: ${available}`);
    }
    result.add(itemName);
    if (info.needsEngine) addEngine();
    for (const name of info.uiDeps) addPrimitive(name);
  }

  if (includeTheme) result.add("fb-theme");

  // Guards the internal/cn coupling: every primitive's own `@/lib/utils`
  // rewrites to a relative path INTO form-engine's vendored internal/cn.ts
  // (see cli/src/rewrite.mjs) — a primitive installed without form-engine
  // in the same set would ship an import pointing at a file that was never
  // copied. Nothing in the current tree can reach this (every field that
  // pulls in a primitive also needsEngine), but assert it rather than let a
  // future field/primitive combination surface this as a runtime
  // "module not found" once actually installed.
  for (const itemName of result) {
    if (itemName.startsWith("fb-ui-") && !result.has("form-engine")) {
      throw new Error(
        `form-builder: internal error — ${itemName} was added to the install set without form-engine, so internal/cn.ts (which it rewrites @/lib/utils to) would never ship.`,
      );
    }
  }

  return result;
}

/**
 * fieldsRequested === ["all"] installs every field, form-engine, every
 * primitive any field needs, and (if includeTheme) the theme — plus the
 * "form-builder" aggregate item (registerBuiltInFields() + all fields), so
 * a whole-tree install ships fields/index.ts too.
 */
export function planInstall(fieldsRequested, { includeTheme, model }) {
  const isAll = fieldsRequested.length === 1 && fieldsRequested[0] === "all";
  const requestedFieldItemNames = isAll ? [...model.fields.keys()] : fieldsRequested.map(normalizeFieldToken);
  const items = resolveInstallSet(requestedFieldItemNames, { includeTheme, model });
  if (isAll) items.add("form-builder");
  return [...items].sort();
}
