import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildRegistryModel } from "../../scripts/build-registry.mjs";
import { planInstall } from "./plan.mjs";
import { copyAndRewrite } from "./rewrite.mjs";
import { detectBaseDir } from "./detect.mjs";
import { injectThemeCss } from "./theme.mjs";

/**
 * "Local mode" resolution: this CLI reads its source straight out of the
 * monorepo it lives in (form-builder/**, components/ui/**, the registry
 * generator) — the explicit requirement for now ("work locally now ... no
 * network required to run in-repo"). Publishing this as a standalone
 * package (Phase 3, an owner decision — see docs/adr/0003) would need to
 * vendor those directories into cli/'s own `files` instead of reaching
 * across `../..`.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const FORM_BUILDER_SRC_DIR = path.join(REPO_ROOT, "form-builder");
const UI_SRC_DIR = path.join(REPO_ROOT, "components", "ui");

/** Maps one resolved item name to its {sourceAbs, rel} file list — `rel` is the path under `<base>/form-builder/` the file lands at. */
export function resolveItemFiles(itemName, model) {
  if (itemName === "form-engine") {
    return [...model.engine.filesRel].map((rel) => ({ sourceAbs: path.join(FORM_BUILDER_SRC_DIR, rel), rel }));
  }
  if (itemName === "form-builder") {
    return [{ sourceAbs: path.join(FORM_BUILDER_SRC_DIR, "fields", "index.ts"), rel: "fields/index.ts" }];
  }
  if (itemName === "fb-theme") return []; // cssVars only, no files — see theme.mjs
  if (itemName.startsWith("fb-ui-")) {
    const name = itemName.slice("fb-ui-".length);
    return [{ sourceAbs: path.join(UI_SRC_DIR, `${name}.tsx`), rel: `components/ui/${name}.tsx` }];
  }
  const info = model.fields.get(itemName);
  if (!info) throw new Error(`form-builder: resolveItemFiles: unknown item "${itemName}"`);
  return [...info.filesRel].map((rel) => ({ sourceAbs: path.join(FORM_BUILDER_SRC_DIR, rel), rel }));
}

/** Union of bundled npm deps (see ADR-0003 peer/bundled split) the resolved item set needs, plus fb-theme's devDependency. */
export function collectNpmDeps(itemNames, model) {
  const deps = new Set();
  let needsThemeDevDeps = false;
  for (const itemName of itemNames) {
    if (itemName === "form-engine") {
      for (const d of model.engine.npmDeps) deps.add(d);
    } else if (itemName === "fb-theme") {
      needsThemeDevDeps = true;
    } else if (itemName === "form-builder") {
      continue;
    } else if (itemName.startsWith("fb-ui-")) {
      const info = model.primitives.get(itemName.slice("fb-ui-".length));
      if (info) for (const d of info.npmDeps) deps.add(d);
    } else {
      const info = model.fields.get(itemName);
      if (info) for (const d of info.npmDeps) deps.add(d);
    }
  }
  return { deps: [...deps].sort(), devDeps: needsThemeDevDeps ? ["tw-animate-css"] : [] };
}

const PEER_PACKAGES_MESSAGE =
  "form-builder: peer dependencies (install yourself if missing): react, react-dom, react-hook-form, zod, date-fns, lucide-react";

/**
 * The whole install, in order: plan -> detect base dir -> copy+rewrite the
 * tree (skipping files that already exist, unless force) -> inject theme
 * cssVars directly into globals.css (same skip-unless-force protection) ->
 * install npm leaf deps. `cwd` is trusted developer-supplied input (an
 * operator running this locally or a CI job under repo control), never
 * untrusted/user-facing input.
 *
 * The two `npm install` spawns below are the only remaining child processes
 * this module launches (the earlier `shadcn add`-based theme injection is
 * gone — see theme.mjs) — `shell: true` on win32 is safe there without
 * quoting because their argv is always `["install", ...packageNames]` (or
 * `["install", "-D", ...packageNames]`); no path ever appears in argv, and
 * `cwd` is passed as a spawnSync OPTION, not a shell-concatenated argument,
 * so a spaced path there is never split by cmd.exe.
 */
export function installFormBuilder({ mode, fields = [], cwd = process.cwd(), install = true, theme = true, force = false }) {
  const model = buildRegistryModel();
  const requested = mode === "add" ? fields : ["all"];
  const itemNames = planInstall(requested, { includeTheme: theme, model });

  const { base, warned } = detectBaseDir(cwd);
  if (warned) {
    console.warn(`form-builder: neither "src/" nor "app/" found under ${cwd} — installing at the project root instead.`);
  }
  const formBuilderTargetDir = path.join(cwd, base, "form-builder");

  const fileMap = new Map(); // rel -> sourceAbs, deduped across items
  for (const itemName of itemNames) {
    if (itemName === "fb-theme") continue;
    for (const { sourceAbs, rel } of resolveItemFiles(itemName, model)) fileMap.set(rel, sourceAbs);
  }

  const written = [];
  const skipped = [];
  for (const [rel, sourceAbs] of fileMap) {
    const targetAbs = path.join(formBuilderTargetDir, rel);
    if (!force && fs.existsSync(targetAbs)) {
      skipped.push(rel);
      continue;
    }
    copyAndRewrite(sourceAbs, targetAbs, formBuilderTargetDir);
    written.push(rel);
  }

  let themeResult = null;
  if (theme && itemNames.includes("fb-theme")) {
    themeResult = injectThemeCss(cwd, base, { force });
    if (themeResult.status === "not-found") {
      console.log(
        "form-builder: no globals.css found (looked under <base>/app/, <base>/styles/, and <base>/) — " +
          "paste this into your Tailwind v4 global stylesheet yourself:\n" +
          `${themeResult.block}`,
      );
    } else if (themeResult.status === "skipped") {
      console.log(
        `form-builder: ${path.relative(cwd, themeResult.path)} already has a form-builder theme block, left as-is (edits preserved) — use --force to refresh it.`,
      );
    } else {
      console.log(`form-builder: theme block written to ${path.relative(cwd, themeResult.path)}`);
    }
  }

  const { deps, devDeps } = collectNpmDeps(itemNames, model);
  if (install) {
    if (deps.length > 0) {
      const r = spawnSync("npm", ["install", ...deps], { cwd, stdio: "inherit", shell: process.platform === "win32" });
      if (r.status !== 0) throw new Error("form-builder: npm install failed for runtime dependencies");
    }
    if (devDeps.length > 0) {
      const r = spawnSync("npm", ["install", "-D", ...devDeps], { cwd, stdio: "inherit", shell: process.platform === "win32" });
      if (r.status !== 0) throw new Error("form-builder: npm install failed for dev dependencies");
    }
  } else if (deps.length > 0 || devDeps.length > 0) {
    console.log("form-builder: --no-install — install these yourself:");
    if (deps.length > 0) console.log(`  npm install ${deps.join(" ")}`);
    if (devDeps.length > 0) console.log(`  npm install -D ${devDeps.join(" ")}`);
  }

  console.log(PEER_PACKAGES_MESSAGE);

  return {
    base,
    formBuilderTargetDir,
    itemNames,
    fileCount: written.length,
    written,
    skipped,
    theme: themeResult,
    deps,
    devDeps,
  };
}
