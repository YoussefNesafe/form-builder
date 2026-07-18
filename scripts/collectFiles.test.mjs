import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectFiles } from "./collectFiles.mjs";

// Pure filesystem-walk logic behind scripts/zip-form-builder.mjs — the
// piece that decides exactly which files end up in public/form-builder.zip.
// Exercised against a throwaway fixture tree instead of the real
// form-builder/ folder so it stays fast, isolated, and doesn't need
// updating every time a field/component is added or removed there.
describe("collectFiles", () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "collect-files-"));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("returns every file, nested or not, as sorted POSIX-relative paths", () => {
    fs.writeFileSync(path.join(root, "index.ts"), "");
    fs.mkdirSync(path.join(root, "core"));
    fs.writeFileSync(path.join(root, "core", "types.ts"), "");
    fs.mkdirSync(path.join(root, "fields", "nested"), { recursive: true });
    fs.writeFileSync(path.join(root, "fields", "nested", "Deep.tsx"), "");

    expect(collectFiles(root)).toEqual(["core/types.ts", "fields/nested/Deep.tsx", "index.ts"]);
  });

  it("does not filter anything out — test files and dotfiles ship too", () => {
    fs.writeFileSync(path.join(root, "Widget.test.tsx"), "");
    fs.writeFileSync(path.join(root, ".hidden"), "");

    expect(collectFiles(root)).toEqual([".hidden", "Widget.test.tsx"]);
  });

  it("returns an empty array for an empty directory (caller decides that's fatal)", () => {
    expect(collectFiles(root)).toEqual([]);
  });

  it("skips a dist/ directory (tsup build output, not source) at any depth", () => {
    fs.writeFileSync(path.join(root, "index.ts"), "");
    fs.mkdirSync(path.join(root, "dist"));
    fs.writeFileSync(path.join(root, "dist", "index.js"), "");
    fs.mkdirSync(path.join(root, "fields", "dist"), { recursive: true });
    fs.writeFileSync(path.join(root, "fields", "dist", "TextField.js"), "");
    fs.writeFileSync(path.join(root, "fields", "TextField.tsx"), "");

    expect(collectFiles(root)).toEqual(["fields/TextField.tsx", "index.ts"]);
  });
});
