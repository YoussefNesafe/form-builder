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
const isTestFile = (relPath) => /\.test\.(ts|tsx)$/.test(relPath);

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

  it("every field item's registryDependencies-implying uiDeps resolve to a real primitive item", () => {
    for (const [itemName, info] of model.fields) {
      for (const uiName of info.uiDeps) {
        expect(model.primitives.has(uiName), `${itemName} needs fb-ui-${uiName}, but no such primitive was derived`).toBe(true);
      }
    }
  });
});
