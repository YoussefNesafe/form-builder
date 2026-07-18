import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectFiles } from "./collectFiles.mjs";

/**
 * Phase 2 registry generator (see docs/adr/0003-packaging-split-distribution.md).
 *
 * Emits `registry/registry.json`: a shadcn-registry manifest for Unit B (the
 * rendered UI layer — `ui`/`components`/`fields` + the vendored shadcn
 * primitives). Unit A (the headless engine) is published separately via
 * `form-builder/package.json` + tsup; this script does not touch that.
 *
 * DERIVES the item graph from the real import graph instead of a
 * hand-maintained table — reruns automatically stay correct as fields/
 * primitives are added or their imports change. The spike
 * (docs/adr/0003 phase 2 bounded viability spike) proved two things this
 * design leans on:
 *   1. shadcn's `registryDependencies` field does NOT resolve local files —
 *      bare names always hit the default/configured HTTP(S) registry, and
 *      `file://` URLs are rejected outright by Node's fetch. So every
 *      registryDependencies array this script writes is DOCUMENTATION ONLY
 *      (visible in `shadcn view`/the built JSON for humans; the actual
 *      installer, cli/src/plan.mjs, computes installs itself rather than
 *      relying on shadcn to walk this).
 *   2. A single `shadcn add` call given every needed item's local path
 *      explicitly (relative `./...` addresses, never absolute Windows
 *      paths — those get misparsed as a URL scheme) installs the whole set
 *      correctly, including deduped npm `dependencies` across items.
 *
 * Import scanner caveat: this repo's import style is always
 * `import ... from "specifier"` / `export ... from "specifier"`, with the
 * specifier on the same line as `from` even when the imported-names list
 * spans multiple lines — so a whole-file regex on `from "..."` is sufficient
 * without a real TS parser (same regex-over-parser tradeoff as
 * scripts/collectFiles.mjs and scripts/zip-form-builder.mjs elsewhere in
 * this build).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FORM_BUILDER_DIR = path.join(ROOT, "form-builder");
const UI_DIR = path.join(ROOT, "components", "ui");
const GLOBALS_CSS = path.join(ROOT, "app", "globals.css");
const TOKENS_CSS = path.join(FORM_BUILDER_DIR, "theme", "tokens.css");
export const DEFAULT_OUT_FILE = path.join(ROOT, "registry", "registry.json");

// Directories under form-builder/ that make up the headless-engine-plus-
// runtime slice (Unit A's source, minus `fields/` which gets its own
// per-field items). Order is the file-list sort key's tiebreak only —
// output is always fully sorted below.
export const ENGINE_DIRS = ["core", "hooks", "store", "ui", "components", "internal"];

// ADR-0003 peer/bundled npm split: peers are shared-instance-critical
// (react/react-dom/react-hook-form/zod) or heavy enough the host almost
// certainly already has a copy (date-fns, lucide-react) — never listed in
// an item's `dependencies`, only documented as prerequisites. Everything
// else importable in this tree is a "bundled" leaf dependency and DOES go
// in the owning item's `dependencies`.
export const PEER_PACKAGES = new Set(["react", "react-dom", "react-hook-form", "zod", "date-fns", "lucide-react"]);

const isTestFile = (relPath) => /\.test\.(ts|tsx)$/.test(relPath);
const toPosix = (p) => p.split(path.sep).join("/");

/**
 * All import/export specifiers in a file, in source order: static
 * `import ... from "x"` / `export ... from "x"`, dynamic `import("x")`, and
 * side-effect `import "x"`. No field/primitive in this repo uses the latter
 * two today, but the codebase's documented pattern for heavy field libs is
 * to lazy-load them (e.g. `signature_pad` via `await import(...)`) — a
 * scanner that only understood the static form would silently drop a future
 * lazy import from that item's `dependencies`, producing a registry item
 * that builds fine and fails only once installed. Three independent
 * passes, results concatenated (order doesn't matter to the caller, only
 * membership does):
 *
 *  1. Static form, anchored on `import`/`export` at (optionally indented)
 *     line-start, scanning up to the `from "..."` clause with `;` as a hard
 *     stop — NOT a bare `from "..."` scan, because this codebase's
 *     runtime-error template literals legitimately contain the English word
 *     "from" followed by a quoted interpolation (e.g. core/schema.ts:
 *     `` `copyFrom chain from "${field.name}" loops back...` ``) which a
 *     naive scan would misread as an import specifier. The `[^;]*?` middle
 *     section matches across the newlines of a multi-line named-import list
 *     (no semicolon appears until the statement's actual end), while the
 *     `;` exclusion stops the non-greedy match from ever crossing into an
 *     unrelated later statement.
 *  2. Dynamic `import("x")` / `import('x')`, anywhere in the file (these
 *     are expressions, not statements, so no line-start anchor applies).
 *  3. Side-effect `import "x";` — no binding, so the static regex above
 *     (which requires a `from` clause) never matches it.
 */
function scanSpecifiers(absPath) {
  const src = fs.readFileSync(absPath, "utf8");
  const specifiers = [];

  const staticRe = /^[ \t]*(?:import|export)\b[^;]*?\bfrom\s+["']([^"']+)["']/gm;
  let m;
  while ((m = staticRe.exec(src))) specifiers.push(m[1]);

  const dynamicRe = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynamicRe.exec(src))) specifiers.push(m[1]);

  const sideEffectRe = /^[ \t]*import\s+["']([^"']+)["']\s*;/gm;
  while ((m = sideEffectRe.exec(src))) specifiers.push(m[1]);

  return specifiers;
}

function resolveRelative(fromAbsPath, specifier) {
  const base = path.resolve(path.dirname(fromAbsPath), specifier);
  for (const ext of ["", ".ts", ".tsx"]) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`build-registry: cannot resolve "${specifier}" imported from ${fromAbsPath}`);
}

/** Bare specifier -> installable package name (scoped packages keep their scope segment). */
function packageNameOf(specifier) {
  return specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
}

/**
 * Classify one specifier found in `absPath`.
 *   - "relative": resolves inside the repo (../core/x, ./siblingHelper)
 *   - "ui-primitive": @/components/ui/<name> — a vendored shadcn primitive
 *   - "host-alias": any other @/... (e.g. @/lib/utils) — host-provided,
 *     assumed present from `shadcn init`; never vendored by this generator
 *   - "npm": a real installable package
 */
function classify(absPath, specifier) {
  if (specifier.startsWith(".")) {
    return { kind: "relative", resolved: resolveRelative(absPath, specifier) };
  }
  if (specifier.startsWith("@/components/ui/")) {
    return { kind: "ui-primitive", name: specifier.slice("@/components/ui/".length) };
  }
  if (specifier.startsWith("@/")) {
    return { kind: "host-alias" };
  }
  return { kind: "npm", pkg: packageNameOf(specifier) };
}

function isUnderDir(absPath, dirAbs) {
  const rel = path.relative(dirAbs, absPath);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function engineDirAbs(dir) {
  return path.join(FORM_BUILDER_DIR, dir);
}

function isUnderEngine(absPath) {
  return ENGINE_DIRS.some((dir) => isUnderDir(absPath, engineDirAbs(dir)));
}

function relFromFormBuilder(absPath) {
  return toPosix(path.relative(FORM_BUILDER_DIR, absPath));
}

/** "CheckboxField" -> "field-checkbox"; "PhoneField" -> "field-phone" */
function fieldItemName(componentName) {
  const base = componentName.replace(/Field$/, "");
  const kebab = base.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `field-${kebab}`;
}

/** components/ui file base name (already kebab-case) -> registry item name */
function primitiveItemName(fileBase) {
  return `fb-ui-${fileBase}`;
}

/**
 * Parses `import { X } from "./Y"` lines out of
 * form-builder/fields/index.ts's registerBuiltInFields. Only matches a
 * single-name brace import (today's actual shape, one component per file).
 * If a future edit adds a second name to one of these lines (e.g.
 * `import { FooField, useHelper } from "./Foo"`), this regex would silently
 * match nothing for that line and drop field-foo from the registry with no
 * error — so this asserts the count of relative `./`-import lines in the
 * file equals the count of components parsed, and fails loudly instead.
 */
function fieldComponentList() {
  const indexPath = path.join(FORM_BUILDER_DIR, "fields", "index.ts");
  const src = fs.readFileSync(indexPath, "utf8");

  const re = /import\s+\{\s*(\w+)\s*\}\s+from\s+["']\.\/(\w+)["']/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push({ componentName: m[1], fileBase: m[2] });

  const relativeImportLineRe = /^[ \t]*import\b[^;]*?\bfrom\s+["']\.\/[^"']+["']/gm;
  const relativeImportLineCount = [...src.matchAll(relativeImportLineRe)].length;
  if (relativeImportLineCount !== out.length) {
    throw new Error(
      `build-registry: fields/index.ts has ${relativeImportLineCount} relative "./" import(s) but fieldComponentList() only parsed ${out.length} — its single-name-brace regex likely doesn't match a new import shape (e.g. multi-name braces). Update fieldComponentList() to match.`,
    );
  }

  return out;
}

function sortedArray(iterable) {
  return [...iterable].sort();
}

// ---------------------------------------------------------------------------
// Engine: base file list + npm/ui deps + any fields/-local helper it reaches
// into (e.g. components/reviewValue.ts -> fields/maskedValue.ts, which is
// shared between the engine and MaskedField and must ship with form-engine,
// not be duplicated per-field).
// ---------------------------------------------------------------------------
function scanEngine() {
  const filesRel = new Set();
  for (const dir of ENGINE_DIRS) {
    for (const rel of collectFiles(engineDirAbs(dir))) {
      if (isTestFile(rel)) continue;
      filesRel.add(toPosix(path.join(dir, rel)));
    }
  }

  const npmDeps = new Set();
  const uiDeps = new Set();
  const helperFilesAbs = new Set();

  // Fixed point: scanning an engine file can pull in a fields/-local helper
  // (outside ENGINE_DIRS), which itself needs scanning for its own deps.
  const queue = [...filesRel].map((rel) => path.join(FORM_BUILDER_DIR, rel));
  const seen = new Set(queue);
  while (queue.length > 0) {
    const absPath = queue.shift();
    for (const specifier of scanSpecifiers(absPath)) {
      const c = classify(absPath, specifier);
      if (c.kind === "npm") {
        if (!PEER_PACKAGES.has(c.pkg)) npmDeps.add(c.pkg);
      } else if (c.kind === "ui-primitive") {
        uiDeps.add(c.name);
      } else if (c.kind === "relative") {
        if (!isUnderEngine(c.resolved) && !seen.has(c.resolved)) {
          seen.add(c.resolved);
          helperFilesAbs.add(c.resolved);
          queue.push(c.resolved);
        }
      }
    }
  }

  for (const abs of helperFilesAbs) filesRel.add(relFromFormBuilder(abs));

  return { filesRel, npmDeps, uiDeps, helperFilesAbs };
}

// ---------------------------------------------------------------------------
// Fields: one item per component registered in registerBuiltInFields(). A
// field's own sibling helpers (./maskedValue, ./phoneCountrySync, ./richText)
// attach to that field's item UNLESS the engine already claimed the helper
// (shared file — see scanEngine above), in which case the field gets it via
// its form-engine registryDependency instead of a duplicate file entry.
// ---------------------------------------------------------------------------
function scanFields(engineHelperFilesAbs) {
  const items = new Map(); // itemName -> { componentName, filesRel: Set, npmDeps: Set, uiDeps: Set, needsEngine: bool }

  for (const { componentName, fileBase } of fieldComponentList()) {
    const mainAbs = path.join(FORM_BUILDER_DIR, "fields", `${fileBase}.tsx`);
    if (!fs.existsSync(mainAbs)) {
      throw new Error(`build-registry: registerBuiltInFields references missing file fields/${fileBase}.tsx`);
    }

    const itemName = fieldItemName(componentName);
    const filesRel = new Set([relFromFormBuilder(mainAbs)]);
    const npmDeps = new Set();
    const uiDeps = new Set();
    let needsEngine = false;

    const queue = [mainAbs];
    const seen = new Set(queue);
    while (queue.length > 0) {
      const absPath = queue.shift();
      for (const specifier of scanSpecifiers(absPath)) {
        const c = classify(absPath, specifier);
        if (c.kind === "npm") {
          if (!PEER_PACKAGES.has(c.pkg)) npmDeps.add(c.pkg);
        } else if (c.kind === "ui-primitive") {
          uiDeps.add(c.name);
        } else if (c.kind === "relative") {
          if (isUnderEngine(c.resolved) || engineHelperFilesAbs.has(c.resolved)) {
            needsEngine = true;
          } else if (!seen.has(c.resolved)) {
            // Sibling helper local to this field (e.g. ./phoneCountrySync).
            seen.add(c.resolved);
            filesRel.add(relFromFormBuilder(c.resolved));
            queue.push(c.resolved);
          }
        }
      }
    }

    items.set(itemName, { componentName, filesRel, npmDeps, uiDeps, needsEngine });
  }

  return items;
}

// ---------------------------------------------------------------------------
// UI primitives: transitive closure over components/ui/*.tsx's OWN
// `@/components/ui/*` imports, seeded by every primitive form-builder
// (engine + fields) actually imports. This is how e.g. `command` pulls in
// `dialog` + `input-group` even though no field imports those directly —
// CommandInput/CommandDialog use them unconditionally, and registry items
// copy whole files, not tree-shaken exports.
// ---------------------------------------------------------------------------
function scanPrimitives(seedNames) {
  const items = new Map(); // name -> { npmDeps: Set, registryDeps: Set<name> }
  const queue = [...seedNames];
  const seen = new Set(seedNames);

  while (queue.length > 0) {
    const name = queue.shift();
    const absPath = path.join(UI_DIR, `${name}.tsx`);
    if (!fs.existsSync(absPath)) {
      throw new Error(`build-registry: no components/ui/${name}.tsx for a primitive referenced via "@/components/ui/${name}"`);
    }
    const npmDeps = new Set();
    const registryDeps = new Set();

    for (const specifier of scanSpecifiers(absPath)) {
      const c = classify(absPath, specifier);
      if (c.kind === "npm") {
        if (!PEER_PACKAGES.has(c.pkg)) npmDeps.add(c.pkg);
      } else if (c.kind === "ui-primitive") {
        registryDeps.add(c.name);
        if (!seen.has(c.name)) {
          seen.add(c.name);
          queue.push(c.name);
        }
      } else if (c.kind === "relative") {
        throw new Error(`build-registry: unexpected relative import "${specifier}" in components/ui/${name}.tsx — primitives should only use @/lib/utils and @/components/ui/*`);
      }
    }

    items.set(name, { npmDeps, registryDeps });
  }

  return items;
}

// ---------------------------------------------------------------------------
// fb-theme: derived from the actual source of truth (app/globals.css,
// form-builder/theme/tokens.css) instead of copy-pasted literals, so a
// retheme there is automatically picked up on the next generator run.
// Lightweight block/var extraction (not a CSS parser) — safe here because
// none of the three source blocks below (`@theme inline`, `:root`, `.dark`)
// nest braces; see the regex comment for the one assumption this leans on.
// ---------------------------------------------------------------------------
function extractBlock(css, selectorPattern, label) {
  // Non-greedy up to the first bare `\n}` — correct as long as the block has
  // no nested `{ }` (true for the three blocks this script reads today).
  const re = new RegExp(`${selectorPattern}\\s*\\{([\\s\\S]*?)\\n\\}`, "m");
  const m = css.match(re);
  if (!m) throw new Error(`build-registry: could not find CSS block "${label}"`);
  return m[1];
}

function extractVars(block, names) {
  const out = {};
  for (const name of names) {
    const m = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
    if (!m) throw new Error(`build-registry: css var --${name} not found in expected block`);
    out[name] = m[1].trim();
  }
  return out;
}

/**
 * Exported (not just used internally) so cli/src/theme.mjs's direct
 * globals.css writer reuses this exact derivation instead of duplicating
 * the CSS-extraction logic — one source of truth for the token values,
 * whether they end up in the registry's fb-theme.json or written straight
 * into a consumer's globals.css.
 */
export function buildThemeItem() {
  const globalsCss = fs.readFileSync(GLOBALS_CSS, "utf8");
  const tokensCss = fs.readFileSync(TOKENS_CSS, "utf8");

  const themeBlock = extractBlock(globalsCss, "@theme inline", "app/globals.css @theme inline");
  const rootBlock = extractBlock(globalsCss, ":root", "app/globals.css :root");
  const darkBlock = extractBlock(globalsCss, "\\.dark", "app/globals.css .dark");
  const fbSpaceBlock = extractBlock(tokensCss, ":root", "form-builder/theme/tokens.css :root");

  const ACCENT_BRAND_MAP_VARS = [
    "color-accent-brand",
    "color-accent-brand-hover",
    "color-accent-brand-solid",
    "color-accent-brand-solid-hover",
    "color-accent-brand-foreground",
  ];
  const ACCENT_BRAND_RAW_VARS = [
    "accent-brand",
    "accent-brand-hover",
    "accent-brand-solid",
    "accent-brand-solid-hover",
    "accent-brand-foreground",
  ];

  const breakpointVars = extractVars(themeBlock, ["breakpoint-tablet", "breakpoint-desktop"]);
  const accentBrandThemeMap = extractVars(themeBlock, ACCENT_BRAND_MAP_VARS);
  const accentBrandLight = extractVars(rootBlock, ACCENT_BRAND_RAW_VARS);
  const accentBrandDark = extractVars(darkBlock, ACCENT_BRAND_RAW_VARS);

  const fbSpaceNames = [...fbSpaceBlock.matchAll(/--([\w-]+):/g)].map((m) => m[1]);
  const fbSpaceVars = extractVars(fbSpaceBlock, fbSpaceNames);

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "fb-theme",
    type: "registry:theme",
    title: "Form Builder theme tokens",
    description:
      "Custom tablet/desktop breakpoints, the additive --accent-brand* tokens, and the --fb-space-* sizing override scale. Additive only: does not re-ship base shadcn color/radius tokens or the border-border base rule — those already exist in any project that ran `shadcn init`.",
    devDependencies: ["tw-animate-css"],
    cssVars: {
      theme: { ...breakpointVars, ...accentBrandThemeMap, ...fbSpaceVars },
      light: accentBrandLight,
      dark: accentBrandDark,
    },
  };
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------
function fileEntry(relFromFormBuilderRoot, type) {
  return {
    path: `form-builder/${relFromFormBuilderRoot}`,
    type,
    target: `~/form-builder/${relFromFormBuilderRoot}`,
  };
}

function primitiveFileEntry(name) {
  return {
    path: `components/ui/${name}.tsx`,
    type: "registry:ui",
    target: `~/components/ui/${name}.tsx`,
  };
}

/**
 * Builds the full in-memory registry (used by both the CLI entry point and
 * scripts/build-registry.test.mjs's closure-lint assertions, so the test
 * checks the exact same derivation the generator ships).
 */
export function buildRegistryModel() {
  const engine = scanEngine();
  const fields = scanFields(engine.helperFilesAbs);

  const primitiveSeed = new Set(engine.uiDeps);
  for (const item of fields.values()) for (const name of item.uiDeps) primitiveSeed.add(name);
  const primitives = scanPrimitives(primitiveSeed);

  return { engine, fields, primitives };
}

function toRegistryItems(model) {
  const { engine, fields, primitives } = model;
  const items = [];

  items.push({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "form-engine",
    type: "registry:file",
    title: "Form Builder engine",
    description:
      "The shadcn-free-plus-runtime base every field depends on: core/hooks/store/ui/components/internal. See docs/adr/0003-packaging-split-distribution.md.",
    files: sortedArray(engine.filesRel).map((rel) => fileEntry(rel, "registry:file")),
    dependencies: sortedArray(engine.npmDeps),
    // Documentation only — see the module doc comment. cli/src/plan.mjs
    // computes the real install set itself rather than relying on shadcn to
    // walk this.
    registryDependencies: sortedArray(engine.uiDeps).map(primitiveItemName),
  });

  for (const name of sortedArray(primitives.keys())) {
    const { npmDeps, registryDeps } = primitives.get(name);
    items.push({
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: primitiveItemName(name),
      type: "registry:ui",
      title: `${name} primitive`,
      description: `Vendored shadcn ${name} primitive (radix-nova style, see components.json).`,
      files: [primitiveFileEntry(name)],
      dependencies: sortedArray(npmDeps),
      registryDependencies: sortedArray(registryDeps).map(primitiveItemName),
    });
  }

  const fieldItemNames = sortedArray(fields.keys());
  for (const itemName of fieldItemNames) {
    const { componentName, filesRel, npmDeps, uiDeps, needsEngine } = fields.get(itemName);
    const registryDeps = [...(needsEngine ? ["form-engine"] : []), ...sortedArray(uiDeps).map(primitiveItemName)];
    items.push({
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: itemName,
      type: "registry:file",
      title: componentName,
      description: `Form Builder ${componentName} field component.`,
      files: sortedArray(filesRel).map((rel) => fileEntry(rel, "registry:file")),
      dependencies: sortedArray(npmDeps),
      registryDependencies: registryDeps,
    });
  }

  items.push({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "form-builder",
    type: "registry:file",
    title: "Form Builder (all fields)",
    description: "Aggregate item: registerBuiltInFields() plus every built-in field. The default one-command install.",
    files: [fileEntry("fields/index.ts", "registry:file")],
    registryDependencies: ["form-engine", ...fieldItemNames],
  });

  items.push(buildThemeItem());

  return items;
}

export function buildRegistry() {
  const model = buildRegistryModel();
  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "form-builder",
    homepage: "https://ui.shadcn.com/schema/registry.json",
    items: toRegistryItems(model),
  };
}

const isCliEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isCliEntryPoint) {
  const registry = buildRegistry();
  fs.mkdirSync(path.dirname(DEFAULT_OUT_FILE), { recursive: true });
  fs.writeFileSync(DEFAULT_OUT_FILE, JSON.stringify(registry, null, 2) + "\n");
  console.log(`Wrote ${path.relative(ROOT, DEFAULT_OUT_FILE)} (${registry.items.length} items)`);
}
