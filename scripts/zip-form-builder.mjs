#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
import { collectFiles } from "./collectFiles.mjs";
import { FORM_BUILDER_ZIP_BASENAME } from "./zipConfig.mjs";

/**
 * Build-time asset for the installation page's download button
 * (components/docs/installation/CopyPackageFolderSection.tsx): zips
 * `form-builder/` — and only `form-builder/` — into
 * `public/form-builder.zip`, i.e. exactly the folder step 1 of
 * /docs/installation tells a developer to copy into their own project.
 * Wired into `predev`/`prebuild` (see package.json) so the file exists
 * before a fresh `next dev`/`next build` starts. Caveat: `predev` only runs
 * once at dev-server startup, not on every request — if `form-builder/`
 * changes while `next dev` is already running, the served zip is stale
 * until the dev server restarts or you rerun `yarn zip:form-builder`.
 *
 * adm-zip over archiver: this is a synchronous, one-shot, small
 * (source-only) folder-to-zip job with no need for backpressure/streaming
 * — adm-zip's addLocalFile + writeZip give a linear, easy-to-unit-test
 * script instead of archiver's stream/event-listener wiring, and it's pure
 * JS with no native bindings, so the same code runs unmodified on the
 * Windows dev box and Linux CI — no shelling out to a `zip` binary either
 * way.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SOURCE_DIR = path.join(ROOT, "form-builder");
const DEFAULT_OUT_FILE = path.join(ROOT, "public", FORM_BUILDER_ZIP_BASENAME);

/**
 * Core logic, parameterized so tests can point it at a throwaway fixture
 * directory/output path instead of the real form-builder/ folder (see
 * zip-form-builder.test.mjs). Zip entry names always use `/` (path.posix),
 * even on Windows, so the archive is portable regardless of which OS built
 * it; every entry is prefixed with `zipRootName` so extracting drops a
 * ready-to-copy `<zipRootName>/` folder rather than dumping the source
 * folder's contents at the archive root.
 */
export function buildZip({ sourceDir, outFile, zipRootName = "form-builder" }) {
  const files = collectFiles(sourceDir);
  if (files.length === 0) {
    throw new Error(`No files found under ${sourceDir} — refusing to write an empty zip.`);
  }

  const zip = new AdmZip();
  for (const relPath of files) {
    const absPath = path.join(sourceDir, relPath);
    // Entry folder inside the zip: "<zipRootName>" (+ any subfolders), as a
    // forward-slash path regardless of host OS.
    const zipEntryDir = path.posix.dirname(path.posix.join(zipRootName, relPath));
    zip.addLocalFile(absPath, zipEntryDir);
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  zip.writeZip(outFile);
  return { fileCount: files.length, outFile };
}

const isCliEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isCliEntryPoint) {
  const { fileCount, outFile } = buildZip({ sourceDir: DEFAULT_SOURCE_DIR, outFile: DEFAULT_OUT_FILE });
  console.log(`Wrote ${path.relative(ROOT, outFile)} (${fileCount} files from form-builder/)`);
}
