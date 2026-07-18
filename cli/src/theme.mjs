import fs from "node:fs";
import path from "node:path";

/**
 * Direct globals.css theme writer — replaces the earlier `shadcn add
 * fb-theme.json` mechanism (shelling shadcn for the theme step forced the
 * consumer to have `components.json` + `tsconfig.json` just to get a
 * handful of cssVars, which fights the "self-contained, easy" promise the
 * rest of this installer makes).
 *
 * Zero reach outside cli/: every function here operates on a `themeItem`
 * object ({ cssVars: { theme, light, dark } }) passed in by the caller
 * (cli/src/install.mjs, via cli/src/source.mjs's dual-mode resolver) —
 * this module never imports scripts/build-registry.mjs itself, vendored or
 * not, so it's trivially self-contained in a published tarball.
 */

const START_MARKER = "/* form-builder theme (managed) */";
const END_MARKER = "/* end form-builder theme */";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MANAGED_BLOCK_RE = new RegExp(`${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}`);

function formatVars(vars) {
  return Object.entries(vars)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n");
}

/** The full sentinel-wrapped CSS text this installer owns, built from `themeItem.cssVars` ({ theme, light, dark }). */
export function buildThemeCssBlock(themeItem) {
  const { theme, light, dark } = themeItem.cssVars;
  return [
    START_MARKER,
    "@theme {",
    formatVars(theme),
    "}",
    "",
    ":root {",
    formatVars(light),
    "}",
    "",
    ".dark {",
    formatVars(dark),
    "}",
    END_MARKER,
  ].join("\n");
}

/**
 * Merges `block` into `existingCss`: replaces an existing managed block
 * in-place (idempotent — never duplicates), or appends one if none is
 * present yet.
 */
export function mergeThemeBlock(existingCss, block) {
  if (MANAGED_BLOCK_RE.test(existingCss)) {
    return existingCss.replace(MANAGED_BLOCK_RE, block);
  }
  const trimmed = existingCss.replace(/\s*$/, "");
  return trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`;
}

export function hasManagedThemeBlock(css) {
  return MANAGED_BLOCK_RE.test(css);
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** Bounded shallow search (depth 3) under `dir` for a file literally named globals.css, deterministic (directories visited in sorted order). */
function findGlobalsCssShallow(dir, depth) {
  if (depth < 0 || !isDir(dir)) return null;
  const direct = path.join(dir, "globals.css");
  if (isFile(direct)) return direct;
  const subdirs = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "node_modules")
    .map((entry) => entry.name)
    .sort();
  for (const name of subdirs) {
    const found = findGlobalsCssShallow(path.join(dir, name), depth - 1);
    if (found) return found;
  }
  return null;
}

/**
 * Locates the consumer's global stylesheet: `<base>/app/globals.css` (App
 * Router convention), then `<base>/styles/globals.css` (common Pages
 * Router/custom convention), then a bounded search for any `globals.css`
 * under `<base>/`. Returns null if nothing is found (non-fatal — the caller
 * prints the block for manual paste instead of failing the install).
 */
export function findGlobalsCss(consumerRoot, base) {
  const baseDir = path.join(consumerRoot, base);
  const candidates = [path.join(baseDir, "app", "globals.css"), path.join(baseDir, "styles", "globals.css")];
  for (const candidate of candidates) if (isFile(candidate)) return candidate;
  return findGlobalsCssShallow(baseDir, 3);
}

/**
 * Injects (or refreshes) the theme block into the consumer's globals.css.
 * Same clobber protection as the file-copy step: if a managed block
 * already exists, a normal run leaves it alone (the user may have hand-
 * edited within it) — pass `force: true` to regenerate it in place.
 * Returns a result describing what happened so the caller can report it;
 * never throws for "no globals.css found", since that's expected for some
 * project layouts and shouldn't fail the whole install.
 */
export function injectThemeCss(consumerRoot, base, themeItem, { force = false } = {}) {
  const target = findGlobalsCss(consumerRoot, base);
  const block = buildThemeCssBlock(themeItem);

  if (!target) {
    return { status: "not-found", path: null, block };
  }

  const existing = fs.readFileSync(target, "utf8");
  if (hasManagedThemeBlock(existing) && !force) {
    return { status: "skipped", path: target, block };
  }

  fs.writeFileSync(target, mergeThemeBlock(existing, block));
  return { status: "written", path: target, block };
}
