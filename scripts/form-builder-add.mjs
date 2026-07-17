#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildRegistryModel } from "./build-registry.mjs";

/**
 * Phase 2 "CLI" (Phase 3 hosts a real command around this): installs
 * form-builder field(s) into a consumer project with ONE `shadcn add` call.
 *
 * Per the packaging spike (docs/adr/0003-packaging-split-distribution.md),
 * shadcn's `registryDependencies` field cannot resolve local files — bare
 * names always hit the default/configured HTTP(S) registry, and `file://`
 * is rejected outright. So this script owns the transitive graph itself
 * (reusing scripts/build-registry.mjs's derivation) and calls `shadcn add`
 * with every needed item's local path spelled out explicitly, as relative
 * `./...` addresses — never absolute Windows paths, which get misparsed as
 * a URL scheme ("C:" read as a scheme prefix).
 *
 * Usage:
 *   node scripts/form-builder-add.mjs <field...> --cwd <consumerDir> [--yes] [--no-theme]
 *   node scripts/form-builder-add.mjs all --cwd <consumerDir>
 *
 * <field> is a field item's short name (the part after "field-", e.g.
 * "text", "phone", "date") or the full item name ("field-text"). "all"
 * installs the full aggregate: every field, form-engine, every primitive
 * any field needs, and the theme.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REGISTRY_OUT_DIR = path.join(ROOT, "public", "r");
// Staging MUST live under ROOT, not os.tmpdir(): toShadcnAddress() below
// computes an address relative to process.cwd() (this repo's root, in
// normal usage) and requires that address to stay relative. On a
// multi-drive Windows box (repo on D:, %TEMP% on C:) path.relative() from a
// D:\ cwd to a C:\ temp dir can't produce a relative path at all — it falls
// back to the absolute C:\... path, which is exactly the "drive letter
// misparsed as a URL scheme" failure this whole address scheme exists to
// avoid. Staging inside the repo keeps the relative math on one drive.
const STAGING_PARENT_DIR = path.join(ROOT, ".registry-staging");

function primitiveItemName(name) {
  return `fb-ui-${name}`;
}

function normalizeFieldToken(token) {
  return token.startsWith("field-") ? token : `field-${token}`;
}

/**
 * Expands a set of requested field item names into the full concrete
 * item-name set to install.
 *
 * BLOCKER fix: form-engine itself imports shadcn primitives — `ui/FieldWrapper.tsx`
 * needs `@/components/ui/field`, `components/FormStepper.tsx` needs
 * `@/components/ui/button`, `components/ReviewStep.tsx` needs `button` +
 * `separator`. Adding "form-engine" to the result WITHOUT also expanding
 * model.engine.uiDeps (the engine's own primitive closure, the same field
 * scanEngine() already computed in build-registry.mjs) ships form-engine's
 * files with unresolved `@/components/ui/*` imports in the consumer. A
 * single-field install (e.g. "text") exposed this; `all` masked it because
 * the union of every field's own uiDeps happened to already cover
 * fb-ui-field/fb-ui-separator.
 */
function resolveInstallSet(requestedFieldItemNames, { includeTheme, model }) {
  const { fields, primitives, engine } = model;
  const result = new Set();

  const addPrimitive = (name) => {
    const itemName = primitiveItemName(name);
    if (result.has(itemName)) return;
    result.add(itemName);
    const info = primitives.get(name);
    if (!info) throw new Error(`form-builder-add: registry model has no primitive "${name}"`);
    for (const dep of info.registryDeps) addPrimitive(dep);
  };

  const addEngine = () => {
    if (result.has("form-engine")) return;
    result.add("form-engine");
    // form-engine's npm dependencies already live in its own `dependencies`
    // array (deduped at install time by shadcn); only its UI-primitive
    // closure needs expanding here.
    for (const name of engine.uiDeps) addPrimitive(name);
  };

  for (const itemName of requestedFieldItemNames) {
    const info = fields.get(itemName);
    if (!info) {
      const available = [...fields.keys()].sort().join(", ");
      throw new Error(`form-builder-add: unknown field item "${itemName}". Available: ${available}`);
    }
    result.add(itemName);
    if (info.needsEngine) addEngine();
    for (const name of info.uiDeps) addPrimitive(name);
  }

  if (includeTheme) result.add("fb-theme");

  return result;
}

function itemJsonPath(itemName) {
  const abs = path.join(REGISTRY_OUT_DIR, `${itemName}.json`);
  if (!fs.existsSync(abs)) {
    throw new Error(
      `form-builder-add: ${path.relative(ROOT, abs)} does not exist. Run "node scripts/build-registry.mjs && shadcn build registry/registry.json -o public/r" first (or "yarn registry:build").`,
    );
  }
  return abs;
}

/**
 * The spike (docs/adr/0003) proved `shadcn add` chases every item's
 * `registryDependencies` through its default/configured HTTP(S) registry
 * REGARDLESS of whether an item with that name was also passed explicitly
 * on the same `add` call — it does not dedupe a dependency name against the
 * local set already provided. registryDependencies in public/r/*.json is
 * kept as real documentation metadata (see build-registry.mjs), so instead
 * of stripping it at generation time, this writes throwaway copies with
 * registryDependencies zeroed to a temp staging dir and installs from
 * there, leaving the committed public/r/*.json intact for humans/tooling
 * that want to read the real dependency graph.
 */
function stageItemsWithoutRegistryDeps(itemNames) {
  fs.mkdirSync(STAGING_PARENT_DIR, { recursive: true });
  const stagingDir = fs.mkdtempSync(path.join(STAGING_PARENT_DIR, "run-"));
  const stagedPaths = itemNames.map((name) => {
    const item = JSON.parse(fs.readFileSync(itemJsonPath(name), "utf8"));
    item.registryDependencies = [];
    const outPath = path.join(stagingDir, `${name}.json`);
    fs.writeFileSync(outPath, JSON.stringify(item));
    return outPath;
  });
  return { stagingDir, stagedPaths };
}

/**
 * Relative address shadcn's local-file resolution accepts, computed against
 * THIS process's cwd — shadcn resolves a relative item address against
 * process.cwd(), not against --cwd (--cwd only controls where target files
 * land). A bare "public/r/x.json" without a "./" prefix gets misrouted to
 * shadcn's default remote registry instead of being read as a local file
 * (mc() in the CLI only recognizes "./" and "/" prefixes as local) — so
 * every address here is forced to start with "./" unless it's already a
 * ".."-relative path.
 */
function toShadcnAddress(absPath) {
  let rel = path.relative(process.cwd(), absPath).split(path.sep).join("/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function resolveShadcnBin() {
  const candidate = path.join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "shadcn.cmd" : "shadcn");
  return fs.existsSync(candidate) ? candidate : "shadcn";
}

function parseArgs(argv) {
  const fieldsRequested = [];
  let cwd;
  let yes = true;
  let includeTheme = true;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cwd") {
      cwd = argv[++i];
    } else if (arg === "--interactive") {
      yes = false;
    } else if (arg === "--yes") {
      yes = true;
    } else if (arg === "--no-theme") {
      includeTheme = false;
    } else if (arg.startsWith("--")) {
      throw new Error(`form-builder-add: unknown flag "${arg}"`);
    } else {
      fieldsRequested.push(arg);
    }
  }

  if (!cwd) throw new Error("form-builder-add: --cwd <consumerDir> is required");
  if (fieldsRequested.length === 0) throw new Error("form-builder-add: pass at least one field name, or \"all\"");

  return { fieldsRequested, cwd, yes, includeTheme };
}

export function planInstall(fieldsRequested, { includeTheme, model }) {
  const isAll = fieldsRequested.length === 1 && fieldsRequested[0] === "all";
  const requestedFieldItemNames = isAll ? [...model.fields.keys()] : fieldsRequested.map(normalizeFieldToken);
  const items = resolveInstallSet(requestedFieldItemNames, { includeTheme, model });
  if (isAll) items.add("form-builder"); // ship registerBuiltInFields() too
  return [...items].sort();
}

function main() {
  const { fieldsRequested, cwd, yes, includeTheme } = parseArgs(process.argv.slice(2));
  const model = buildRegistryModel();
  const itemNames = planInstall(fieldsRequested, { includeTheme, model });

  console.log(`form-builder-add: installing ${itemNames.length} item(s) into ${cwd}`);
  for (const name of itemNames) console.log(`  - ${name}`);

  const { stagingDir, stagedPaths } = stageItemsWithoutRegistryDeps(itemNames);
  let result;
  try {
    const addresses = stagedPaths.map(toShadcnAddress);
    const args = ["add", ...addresses, "--cwd", cwd];
    if (yes) args.push("--yes");

    // Windows' node_modules/.bin/shadcn is a .cmd wrapper: CreateProcess
    // can't exec a .cmd directly (spawnSync fails with EINVAL), it needs to
    // go through cmd.exe. `shell: true` is scoped to win32 only — on POSIX
    // the shebang shim in .bin/shadcn is directly executable, so no shell
    // hop (and no arg-escaping tradeoff) is needed there. `shell: true`
    // means `args` (including `cwd`, below) is concatenated rather than
    // escaped — acceptable here because this is a local dev/CI tool: every
    // arg is either a path this script built from repo-relative constants,
    // or `--cwd`, which is trusted developer-supplied input (an operator
    // running this script locally or a CI job under repo control), never
    // untrusted/user-facing input.
    result = spawnSync(resolveShadcnBin(), args, {
      stdio: "inherit",
      cwd: process.cwd(),
      shell: process.platform === "win32",
    });
  } finally {
    // Always clean up the staging dir, even if spawnSync throws — never
    // leave a temp dir behind, and never let cleanup swallow a real exit
    // code by calling process.exit() before this runs.
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

const isCliEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCliEntryPoint) main();
