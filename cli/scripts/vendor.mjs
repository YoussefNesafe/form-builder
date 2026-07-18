#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectFiles } from "../../scripts/collectFiles.mjs";
import { buildRegistryModel, buildThemeItem } from "../../scripts/build-registry.mjs";

/**
 * Produces everything cli/src needs to run WITHOUT reaching into this
 * monorepo — the vendoring step that makes a published tarball
 * self-sufficient. Run at `prepack`/`prepublishOnly` time (see
 * cli/package.json), or manually in a repo checkout to exercise the
 * published-mode code path locally. Output is gitignored (build output,
 * same treatment as form-builder/dist or public/r) and fully regenerated
 * on every run — never hand-edited.
 *
 * This script itself is NOT part of the published package (`cli/scripts`
 * is deliberately absent from cli/package.json's `files`) — only its
 * OUTPUT (cli/vendor/) ships. It's the one place in this tree that's
 * EXPECTED to reach `../../scripts` and `../../form-builder` and
 * `../../components/ui` — that's its entire job.
 *
 * Produces:
 *   cli/vendor/form-builder/**        — full mirror of form-builder/,
 *                                        minus *.test.* and dist/ (same
 *                                        filter scripts/build-registry.mjs
 *                                        and scripts/zip-form-builder.mjs
 *                                        already apply). A full mirror
 *                                        rather than a selective copy —
 *                                        cli/src/install.mjs's
 *                                        resolveItemFiles() picks whichever
 *                                        specific files an item needs by
 *                                        relative path, exactly as it does
 *                                        against the live repo tree today.
 *   cli/vendor/components-ui/*.tsx    — the vendored shadcn primitives
 *                                        this registry's closure actually
 *                                        needs (today, all 17).
 *   cli/vendor/registry-model.json    — buildRegistryModel()'s item graph
 *                                        (files/npm-deps/primitive-closure
 *                                        per item) AND buildThemeItem()'s
 *                                        cssVars, precomputed and
 *                                        serialized to plain JSON so a
 *                                        published tarball never needs to
 *                                        ship or run the import-graph
 *                                        scanner (scripts/build-registry.mjs)
 *                                        at a USER's install time — it just
 *                                        reads this file. cli/src/source.mjs
 *                                        reconstructs the exact Map/Set
 *                                        shape buildRegistryModel() returns
 *                                        from this plain-object form.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(CLI_ROOT, "..");
const FORM_BUILDER_SRC = path.join(REPO_ROOT, "form-builder");
const UI_SRC = path.join(REPO_ROOT, "components", "ui");
const VENDOR_DIR = path.join(CLI_ROOT, "vendor");

const isTestFile = (relPath) => /\.test\.(ts|tsx)$/.test(relPath);

function copyFormBuilderSource() {
  const outDir = path.join(VENDOR_DIR, "form-builder");
  fs.rmSync(outDir, { recursive: true, force: true });
  let count = 0;
  for (const rel of collectFiles(FORM_BUILDER_SRC)) {
    if (isTestFile(rel)) continue;
    const dest = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(FORM_BUILDER_SRC, rel), dest);
    count += 1;
  }
  return count;
}

function copyPrimitives(names) {
  const outDir = path.join(VENDOR_DIR, "components-ui");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of names) {
    fs.copyFileSync(path.join(UI_SRC, `${name}.tsx`), path.join(outDir, `${name}.tsx`));
  }
  return names.length;
}

function sortedArray(iterable) {
  return [...iterable].sort();
}

function serializeModel(model) {
  return {
    engine: {
      filesRel: sortedArray(model.engine.filesRel),
      npmDeps: sortedArray(model.engine.npmDeps),
      uiDeps: sortedArray(model.engine.uiDeps),
    },
    fields: Object.fromEntries(
      sortedArray(model.fields.keys()).map((name) => {
        const info = model.fields.get(name);
        return [
          name,
          {
            componentName: info.componentName,
            filesRel: sortedArray(info.filesRel),
            npmDeps: sortedArray(info.npmDeps),
            uiDeps: sortedArray(info.uiDeps),
            needsEngine: info.needsEngine,
          },
        ];
      }),
    ),
    primitives: Object.fromEntries(
      sortedArray(model.primitives.keys()).map((name) => {
        const info = model.primitives.get(name);
        return [name, { npmDeps: sortedArray(info.npmDeps), registryDeps: sortedArray(info.registryDeps) }];
      }),
    ),
  };
}

function main() {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });

  const fileCount = copyFormBuilderSource();
  const model = buildRegistryModel();
  const primitiveNames = sortedArray(model.primitives.keys());
  const primitiveCount = copyPrimitives(primitiveNames);
  const themeItem = buildThemeItem();

  const out = {
    ...serializeModel(model),
    themeItem: { cssVars: themeItem.cssVars, devDependencies: themeItem.devDependencies },
  };
  // No timestamp/generatedAt field on purpose — output must be byte-for-byte
  // deterministic across runs (verified by the publish gate), and a
  // timestamp would make every run diff even when nothing real changed.
  fs.writeFileSync(path.join(VENDOR_DIR, "registry-model.json"), JSON.stringify(out, null, 2) + "\n");

  console.log(
    `Vendored ${fileCount} form-builder/ file(s) + ${primitiveCount} primitive(s) + registry-model.json into ${path.relative(REPO_ROOT, VENDOR_DIR)}/`,
  );
}

main();
