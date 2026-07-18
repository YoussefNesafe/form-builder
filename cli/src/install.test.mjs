import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildRegistryModel } from "../../scripts/build-registry.mjs";
import { collectNpmDeps, installFormBuilder, resolveItemFiles } from "./install.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC_DIRS = {
  formBuilderSrcDir: path.join(REPO_ROOT, "form-builder"),
  uiSrcDir: path.join(REPO_ROOT, "components", "ui"),
};

describe("resolveItemFiles", () => {
  const model = buildRegistryModel();

  it("resolves a field item to its source files with paths relative to form-builder/", () => {
    const files = resolveItemFiles("field-text", model, SRC_DIRS);
    expect(files).toEqual([expect.objectContaining({ rel: "fields/TextField.tsx" })]);
  });

  it("resolves a primitive item to components/ui/<name>.tsx, landing at components/ui/<name>.tsx", () => {
    const files = resolveItemFiles("fb-ui-button", model, SRC_DIRS);
    expect(files).toEqual([expect.objectContaining({ rel: "components/ui/button.tsx" })]);
  });

  it("resolves the form-builder aggregate to fields/index.ts", () => {
    const files = resolveItemFiles("form-builder", model, SRC_DIRS);
    expect(files).toEqual([expect.objectContaining({ rel: "fields/index.ts" })]);
  });

  it("resolves fb-theme to no files (cssVars only)", () => {
    expect(resolveItemFiles("fb-theme", model, SRC_DIRS)).toEqual([]);
  });
});

describe("collectNpmDeps", () => {
  const model = buildRegistryModel();

  it("includes tw-animate-css as a devDependency only when fb-theme is in the plan", () => {
    const withTheme = collectNpmDeps(["fb-theme"], model);
    const withoutTheme = collectNpmDeps(["field-text"], model);
    expect(withTheme.devDeps).toEqual(["tw-animate-css"]);
    expect(withoutTheme.devDeps).toEqual([]);
  });
});

describe("installFormBuilder clobber protection", () => {
  let cwd;

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), "form-builder-install-"));
    fs.mkdirSync(path.join(cwd, "src"));
  });

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it("writes every file on the first install (nothing pre-existing to skip)", async () => {
    const summary = await installFormBuilder({ mode: "add", fields: ["hidden"], cwd, install: false, theme: false });
    expect(summary.skipped).toEqual([]);
    expect(summary.written.length).toBeGreaterThan(0);
    expect(summary.fileCount).toBe(summary.written.length);
  });

  it("MAJOR fix: a second install SKIPS files that already exist, preserving a user's edit — unless --force", async () => {
    await installFormBuilder({ mode: "add", fields: ["hidden"], cwd, install: false, theme: false });

    const targetFile = path.join(cwd, "src", "form-builder", "fields", "HiddenField.tsx");
    const original = fs.readFileSync(targetFile, "utf8");
    const edited = `${original}\n// USER EDIT — must survive a re-install\n`;
    fs.writeFileSync(targetFile, edited);

    const second = await installFormBuilder({ mode: "add", fields: ["hidden"], cwd, install: false, theme: false });
    expect(second.skipped.length).toBeGreaterThan(0);
    expect(second.written).toEqual([]);
    expect(fs.readFileSync(targetFile, "utf8")).toBe(edited); // preserved, not clobbered

    const forced = await installFormBuilder({
      mode: "add",
      fields: ["hidden"],
      cwd,
      install: false,
      theme: false,
      force: true,
    });
    expect(forced.written.length).toBeGreaterThan(0);
    expect(fs.readFileSync(targetFile, "utf8")).not.toContain("USER EDIT"); // overwritten
  });
});
