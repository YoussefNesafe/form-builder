import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildZip } from "./zip-form-builder.mjs";

// Exercises the actual archive-writing logic (not just collectFiles.mjs's
// file listing) against a throwaway fixture tree, so a regression in how
// entries are named/prefixed is caught here instead of only being visible
// by unzipping public/form-builder.zip by hand.
describe("buildZip", () => {
  let workDir;
  let sourceDir;
  let outFile;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "build-zip-"));
    sourceDir = path.join(workDir, "source");
    outFile = path.join(workDir, "out", "bundle.zip");
    fs.mkdirSync(path.join(sourceDir, "core"), { recursive: true });
    fs.writeFileSync(path.join(sourceDir, "index.ts"), "export {};");
    fs.writeFileSync(path.join(sourceDir, "core", "types.ts"), "export type X = never;");
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  it("writes every entry POSIX-slashed and prefixed with the zip root name, on every host OS", () => {
    const { fileCount, outFile: writtenPath } = buildZip({ sourceDir, outFile, zipRootName: "form-builder" });

    expect(fileCount).toBe(2);
    expect(writtenPath).toBe(outFile);

    const entries = new AdmZip(outFile).getEntries().map((e) => e.entryName);
    expect(entries.sort()).toEqual(["form-builder/core/types.ts", "form-builder/index.ts"]);
    for (const entry of entries) {
      expect(entry.includes("\\"), `entry "${entry}" must use / not \\`).toBe(false);
      expect(entry.startsWith("form-builder/"), `entry "${entry}" must be prefixed form-builder/`).toBe(true);
    }
  });

  it("respects a custom zipRootName", () => {
    buildZip({ sourceDir, outFile, zipRootName: "my-lib" });

    const entries = new AdmZip(outFile).getEntries().map((e) => e.entryName);
    expect(entries.sort()).toEqual(["my-lib/core/types.ts", "my-lib/index.ts"]);
  });

  it("throws instead of writing an empty zip when the source directory has no files", () => {
    const emptyDir = path.join(workDir, "empty");
    fs.mkdirSync(emptyDir);

    expect(() => buildZip({ sourceDir: emptyDir, outFile })).toThrow(/No files found/);
    expect(fs.existsSync(outFile)).toBe(false);
  });
});
