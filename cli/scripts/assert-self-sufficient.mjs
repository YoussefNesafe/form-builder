#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The self-sufficiency gate run at `prepack`/`prepublishOnly` time (see
 * cli/package.json), right after cli/scripts/vendor.mjs. Fails loudly,
 * before `npm publish` can ship a broken tarball, if either:
 *
 *   1. cli/vendor/ is missing or incomplete — vendor.mjs didn't run, or
 *      didn't finish. A published package with no vendored source has
 *      nothing to install from once the monorepo it was reaching into
 *      (../../form-builder etc.) isn't there anymore.
 *   2. Any RUNTIME file under cli/bin/ or cli/src/ (never test files, and
 *      never cli/scripts/ — this script and vendor.mjs are dev-only tools,
 *      not part of what `files` in package.json ships) has a STATIC
 *      `import`/`export ... from "..."` whose specifier resolves outside
 *      cli/. A dynamic `import()` (like source.mjs's local-mode fallback)
 *      is fine — it's gated behind a runtime existence check and simply
 *      never executes in a published tarball, which never has cli/vendor/
 *      absent AND a monorepo to fall back to at the same time. A STATIC
 *      import is resolved eagerly at module-load time regardless of any
 *      runtime branching, so one reaching outside cli/ would crash a
 *      published install immediately.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, "..");
const VENDOR_DIR = path.join(CLI_ROOT, "vendor");

function assertVendorPresent() {
  const required = [
    path.join(VENDOR_DIR, "registry-model.json"),
    path.join(VENDOR_DIR, "form-builder"),
    path.join(VENDOR_DIR, "components-ui"),
  ];
  const missing = required.filter((p) => !fs.existsSync(p));
  if (missing.length > 0) {
    throw new Error(
      `form-builder-cli: self-sufficiency check failed — missing ${missing.map((p) => path.relative(CLI_ROOT, p)).join(", ")}. Run "node cli/scripts/vendor.mjs" first.`,
    );
  }
  const primitives = fs.readdirSync(path.join(VENDOR_DIR, "components-ui")).filter((f) => f.endsWith(".tsx"));
  if (primitives.length === 0) {
    throw new Error("form-builder-cli: self-sufficiency check failed — cli/vendor/components-ui/ has no .tsx files.");
  }
}

function listRuntimeFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listRuntimeFiles(abs));
    } else if (entry.isFile() && entry.name.endsWith(".mjs") && !entry.name.endsWith(".test.mjs")) {
      out.push(abs);
    }
  }
  return out;
}

// Same shape as scripts/build-registry.mjs's static-import scanner: anchored
// on import/export at line start, `;` as a hard stop so it can't cross into
// an unrelated later statement. Deliberately does NOT match `import(...)`
// (dynamic import is a call expression, not `from "..."`) — that's the
// point: dynamic imports are exempt by construction.
const STATIC_IMPORT_RE = /^[ \t]*(?:import|export)\b[^;]*?\bfrom\s+["'](\.\.[^"']*)["']/gm;

function assertNoMonorepoReach() {
  const files = [...listRuntimeFiles(path.join(CLI_ROOT, "bin")), ...listRuntimeFiles(path.join(CLI_ROOT, "src"))];
  const offenders = [];

  for (const absPath of files) {
    const src = fs.readFileSync(absPath, "utf8");
    let m;
    while ((m = STATIC_IMPORT_RE.exec(src))) {
      const specifier = m[1];
      const resolved = path.resolve(path.dirname(absPath), specifier);
      const insideCli = resolved === CLI_ROOT || resolved.startsWith(CLI_ROOT + path.sep);
      if (!insideCli) {
        offenders.push(`${path.relative(CLI_ROOT, absPath)}: static import "${specifier}" resolves outside cli/`);
      }
    }
  }

  if (offenders.length > 0) {
    throw new Error(
      `form-builder-cli: self-sufficiency check failed — a published tarball must never statically import outside cli/:\n${offenders.map((o) => `  - ${o}`).join("\n")}`,
    );
  }
}

assertVendorPresent();
assertNoMonorepoReach();
console.log("form-builder-cli: self-sufficiency check passed (cli/vendor/ present, no static imports reach outside cli/).");
