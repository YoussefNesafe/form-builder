import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Dual-mode source resolver — the ONLY module in cli/src allowed to reach
 * outside cli/, and even then only via a DYNAMIC import gated behind a
 * runtime file-existence check (never a top-level static import), so a
 * published tarball — which never has ../../scripts/build-registry.mjs at
 * all — never attempts to resolve that path.
 *
 *   - "vendored" mode: cli/vendor/ exists (a published tarball always has
 *     this, produced by `cli/scripts/vendor.mjs` at `prepack` time; a repo
 *     checkout has it after running that script manually). Reads the
 *     precomputed registry-model.json and copies source from cli/vendor/.
 *   - "local" mode: cli/vendor/ is absent (a repo checkout that hasn't run
 *     the vendor script) — falls back to computing the model live via
 *     ../../scripts/build-registry.mjs and reading source straight from
 *     ../../form-builder and ../../components/ui. This is how `yarn`-in-repo
 *     usage has always worked; it must keep working unchanged.
 *
 * `loadSource()` accepts an optional `{ cliRoot }` override purely for
 * testability (same parameterize-for-tests/default-for-production shape as
 * scripts/zip-form-builder.mjs's buildZip({ sourceDir, outFile })) — tests
 * point it at a throwaway fixture directory instead of mutating the real,
 * shared cli/vendor/ that other concurrently-running test files also read
 * through this same module.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CLI_ROOT = path.resolve(__dirname, "..");

export function vendorAvailable(vendorDir) {
  return (
    fs.existsSync(path.join(vendorDir, "registry-model.json")) &&
    fs.existsSync(path.join(vendorDir, "form-builder")) &&
    fs.existsSync(path.join(vendorDir, "components-ui"))
  );
}

/** Reconstructs buildRegistryModel()'s exact shape (Maps of Sets) from the vendored plain-JSON serialization, so plan.mjs/install.mjs never need to know which mode produced the model they're given. */
export function reviveModel(raw) {
  const engine = {
    filesRel: new Set(raw.engine.filesRel),
    npmDeps: new Set(raw.engine.npmDeps),
    uiDeps: new Set(raw.engine.uiDeps),
  };
  const fields = new Map(
    Object.entries(raw.fields).map(([name, info]) => [
      name,
      {
        componentName: info.componentName,
        filesRel: new Set(info.filesRel),
        npmDeps: new Set(info.npmDeps),
        uiDeps: new Set(info.uiDeps),
        needsEngine: info.needsEngine,
      },
    ]),
  );
  const primitives = new Map(
    Object.entries(raw.primitives).map(([name, info]) => [
      name,
      { npmDeps: new Set(info.npmDeps), registryDeps: new Set(info.registryDeps) },
    ]),
  );
  return { engine, fields, primitives };
}

function loadVendored(vendorDir) {
  const raw = JSON.parse(fs.readFileSync(path.join(vendorDir, "registry-model.json"), "utf8"));
  return {
    mode: "vendored",
    model: reviveModel(raw),
    themeItem: raw.themeItem,
    formBuilderSrcDir: path.join(vendorDir, "form-builder"),
    uiSrcDir: path.join(vendorDir, "components-ui"),
  };
}

async function loadLocal(cliRoot) {
  const repoRoot = path.resolve(cliRoot, "..");
  const buildRegistryPath = path.join(repoRoot, "scripts", "build-registry.mjs");
  let mod;
  try {
    // Dynamic + a file:// URL (required for import() to accept an absolute
    // OS path on Windows, where a raw backslash path is not a valid
    // specifier): this line only ever runs when vendorAvailable() is
    // false, so a published tarball — which never has this file — never
    // reaches it.
    mod = await import(pathToFileURL(buildRegistryPath).href);
  } catch (cause) {
    throw new Error(
      "form-builder: cli/vendor/ is missing and ../../scripts/build-registry.mjs could not be loaded either — " +
        'run "node cli/scripts/vendor.mjs" first.',
      { cause },
    );
  }
  return {
    mode: "local",
    model: mod.buildRegistryModel(),
    themeItem: mod.buildThemeItem(),
    formBuilderSrcDir: path.join(repoRoot, "form-builder"),
    uiSrcDir: path.join(repoRoot, "components", "ui"),
  };
}

/**
 * Resolves the registry model, the theme cssVars item, and the source
 * directories to copy from — vendored when present, local monorepo
 * otherwise. Always async (the local-mode branch needs a dynamic import).
 * `cliRoot` defaults to this module's real cli/ directory; only tests pass
 * an override.
 */
export async function loadSource({ cliRoot = DEFAULT_CLI_ROOT } = {}) {
  const vendorDir = path.join(cliRoot, "vendor");
  return vendorAvailable(vendorDir) ? loadVendored(vendorDir) : loadLocal(cliRoot);
}
