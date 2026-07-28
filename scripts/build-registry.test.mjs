import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildRegistryModel, ENGINE_DIRS } from "./build-registry.mjs";
import { collectFiles } from "./collectFiles.mjs";

/**
 * Anti-drift guard for the Phase 2 registry (scripts/build-registry.mjs).
 *
 * Deliberately does NOT reuse build-registry.mjs's own import scanner —
 * these checks re-derive the same two facts with independent, narrower
 * regexes so a bug in the shared scanner has a real chance of disagreeing
 * with the model, instead of both sides sharing the same blind spot.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FORM_BUILDER_DIR = path.join(ROOT, "form-builder");
// Kept as an independent copy of build-registry.mjs's filter, per this file's
// header. It must cover BOTH test spellings for the same reason the original
// does: a test-only file left in `allSourceFiles()` makes the import-closure
// checks below demand that its imports ship, which is a false failure.
const isTestFile = (relPath) => /\.test(-d)?\.(ts|tsx)$/.test(relPath);

function allSourceFiles() {
  const files = [];
  for (const rel of collectFiles(FORM_BUILDER_DIR)) {
    if (isTestFile(rel)) continue;
    files.push(path.join(FORM_BUILDER_DIR, rel));
  }
  return files;
}

describe("build-registry closure", () => {
  const model = buildRegistryModel();

  it("registers a fb-ui-<name> item for every @/components/ui/<name> import in form-builder/", () => {
    const referenced = new Set();
    const uiImportRe = /@\/components\/ui\/([\w-]+)/g;
    for (const absPath of allSourceFiles()) {
      const src = fs.readFileSync(absPath, "utf8");
      let m;
      while ((m = uiImportRe.exec(src))) referenced.add(m[1]);
    }

    expect(referenced.size).toBeGreaterThan(0); // sanity: the scan itself must find something
    const missing = [...referenced].filter((name) => !model.primitives.has(name));
    expect(missing, `components/ui/${missing[0]}.tsx is imported but has no fb-ui-${missing[0]} item`).toEqual([]);
  });

  it("form-engine ships every file a relative ../{core,hooks,store,ui,components,internal} import resolves to", () => {
    const engineDirPattern = ENGINE_DIRS.join("|");
    const relImportRe = new RegExp(`from\\s+["'](\\.\\./(?:${engineDirPattern})/[\\w./-]*)["']`, "g");
    const missing = [];

    for (const absPath of allSourceFiles()) {
      const src = fs.readFileSync(absPath, "utf8");
      let m;
      while ((m = relImportRe.exec(src))) {
        const resolved = path.resolve(path.dirname(absPath), m[1]);
        const candidates = ["", ".ts", ".tsx"].map((ext) => resolved + ext);
        const hit = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
        if (!hit) {
          missing.push(`${path.relative(ROOT, absPath)} -> unresolved "${m[1]}"`);
          continue;
        }
        const relFromFormBuilder = path.relative(FORM_BUILDER_DIR, hit).split(path.sep).join("/");
        if (!model.engine.filesRel.has(relFromFormBuilder)) {
          missing.push(`${path.relative(ROOT, absPath)} -> ${relFromFormBuilder} (not in form-engine's file list)`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("is deterministic across two derivations (stable sort, no filesystem-order leakage)", () => {
    const first = JSON.stringify([...buildRegistryModel().engine.filesRel].sort());
    const second = JSON.stringify([...buildRegistryModel().engine.filesRel].sort());
    expect(first).toEqual(second);
  });

  // The exclusion itself had no guard until now, and it was wrong: the filter
  // read `.test.(ts|tsx)`, which does not match `.test-d.ts(x)`, so four type
  // tests shipped to copy-in consumers. Nothing caught it, because every other
  // check here asks whether something is MISSING from the model — none asked
  // what got in that should not have.
  //
  // Matches deliberately WIDER than the filter it guards (`.test` or `.spec`
  // followed by either separator), so a third spelling escapes the filter and
  // still lands here rather than slipping past both.
  it("ships no test file, in any spelling", () => {
    const testFilePattern = /\.(test|spec)[.-]/;

    const present = ENGINE_DIRS.flatMap((dir) => {
      const abs = path.join(FORM_BUILDER_DIR, dir);
      if (!fs.existsSync(abs)) return [];
      return collectFiles(abs)
        .filter((rel) => testFilePattern.test(rel))
        .map((rel) => `${dir}/${rel}`);
    });
    // Sanity: if this is empty the assertion below passes for the wrong
    // reason. Both spellings must be represented, or the guard is only
    // proving whichever one happens to still exist.
    expect(present.some((rel) => /\.test\.(ts|tsx)$/.test(rel))).toBe(true);
    expect(present.some((rel) => /\.test-d\.(ts|tsx)$/.test(rel))).toBe(true);

    const shipped = [...model.engine.filesRel].filter((rel) => testFilePattern.test(rel));
    expect(
      shipped,
      `${shipped[0]} is a test file but is in form-engine's shipped file list — a copy-in consumer would receive it, and a type test drags in vitest's expectTypeOf. Widen isTestFile in scripts/build-registry.mjs.`,
    ).toEqual([]);
  });

  it("every field item's registryDependencies-implying uiDeps resolve to a real primitive item", () => {
    for (const [itemName, info] of model.fields) {
      for (const uiName of info.uiDeps) {
        expect(model.primitives.has(uiName), `${itemName} needs fb-ui-${uiName}, but no such primitive was derived`).toBe(true);
      }
    }
  });

  // Anti-drift for the allowlist-drift bug class: ENGINE_DIRS is a
  // hand-maintained list, and the other closure tests above only see dirs
  // that something ALREADY imports — so a brand-new top-level dir that
  // nothing internally references (exactly how form-builder/next/ shipped
  // its createFormAction to nobody) is invisible to them and silently fails
  // to ship in the copy-in CLI. This guard forces a conscious ship-or-exclude
  // decision for every new dir instead.
  it("every source dir under form-builder/ is classified (in ENGINE_DIRS or a known non-engine item)", () => {
    // fields/ -> per-field registry items; theme/ -> buildThemeItem;
    // dist/ -> engine build output, not source.
    const NON_ENGINE_DIRS = new Set(["fields", "theme", "dist"]);
    const subdirs = fs
      .readdirSync(FORM_BUILDER_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    const unclassified = subdirs.filter((d) => !ENGINE_DIRS.includes(d) && !NON_ENGINE_DIRS.has(d));
    expect(
      unclassified,
      `form-builder/${unclassified[0]}/ is a new top-level dir covered by neither ENGINE_DIRS nor the known non-engine set — it would silently NOT ship in the copy-in CLI. Add it to ENGINE_DIRS (to ship it) or to this test's NON_ENGINE_DIRS (to deliberately exclude it).`,
    ).toEqual([]);
  });

  // The installation docs page states how many shadcn primitives a full
  // install copies. It cannot call this scanner (Node-only) at render time,
  // so the number is a literal there — and a literal restating a derived
  // list is exactly the thing that desynchronises quietly. `primitives.size`
  // moves whenever a field adds or drops a `@/components/ui/*` import, and
  // nothing about that edit would prompt anyone to reopen a docs page.
  //
  // Note this is NOT `components/ui/`'s file count: that folder also holds
  // primitives outside the registry's closure (alert, progress,
  // segmented-control today), which are never vendored. Reading the source as
  // text rather than importing it keeps this .mjs test free of JSX/React.
  it("the installation docs page's primitive count matches the derived model", () => {
    const docsPath = path.join(ROOT, "components", "docs", "installation", "InstallCliSection.tsx");
    const src = fs.readFileSync(docsPath, "utf8");
    const match = /export const VENDORED_PRIMITIVE_COUNT = (\d+);/.exec(src);
    expect(
      match,
      `Could not find "export const VENDORED_PRIMITIVE_COUNT = <n>;" in ${path.relative(ROOT, docsPath)} — if it was renamed or inlined back into the prose, update this guard rather than deleting it.`,
    ).not.toBeNull();
    expect(
      Number(match[1]),
      `${path.relative(ROOT, docsPath)} claims ${match[1]} vendored shadcn primitives, but the registry closure derives ${model.primitives.size}. Set VENDORED_PRIMITIVE_COUNT to ${model.primitives.size}.`,
    ).toBe(model.primitives.size);
    // Guards the guard: a prose edit that drops the interpolation would leave
    // the constant correct-but-unused and the page silently stale.
    expect(
      (src.match(/\{VENDORED_PRIMITIVE_COUNT\}/g) ?? []).length,
      "VENDORED_PRIMITIVE_COUNT is declared but no longer interpolated into the prose — the page has a hardcoded number again.",
    ).toBeGreaterThan(0);
  });
});
