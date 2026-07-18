import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildThemeItem } from "../../scripts/build-registry.mjs";
import { buildThemeCssBlock, findGlobalsCss, hasManagedThemeBlock, injectThemeCss, mergeThemeBlock } from "./theme.mjs";

// theme.mjs takes themeItem as data (no reach outside cli/ — see its module
// doc comment), so tests supply it from the live derivation. In production
// this comes from cli/src/source.mjs's loadSource() (vendored JSON or a
// live buildThemeItem() call, depending on mode) — either way it's the same
// shape, so testing against the live value here is representative.
const themeItem = buildThemeItem();

describe("theme.mjs", () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "form-builder-theme-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("buildThemeCssBlock produces a sentinel-wrapped @theme block with the repo's real breakpoint values", () => {
    const block = buildThemeCssBlock(themeItem);
    expect(block).toContain("/* form-builder theme (managed) */");
    expect(block).toContain("/* end form-builder theme */");
    expect(block).toContain("@theme {");
    expect(block).toContain("--breakpoint-tablet: 481px;");
    expect(block).toContain("--breakpoint-desktop: 1025px;");
    expect(block).toContain(":root {");
    expect(block).toContain(".dark {");
  });

  it("mergeThemeBlock appends when no managed block exists yet", () => {
    const existing = "@import \"tailwindcss\";\n\n:root {\n  --background: #fff;\n}\n";
    const merged = mergeThemeBlock(existing, "/* form-builder theme (managed) */\nX\n/* end form-builder theme */");
    expect(merged).toContain("--background: #fff;");
    expect(merged).toContain("/* form-builder theme (managed) */\nX\n/* end form-builder theme */");
    expect(hasManagedThemeBlock(merged)).toBe(true);
  });

  it("mergeThemeBlock REPLACES an existing managed block in place instead of duplicating it", () => {
    const block1 = "/* form-builder theme (managed) */\nOLD\n/* end form-builder theme */";
    const withBlock = mergeThemeBlock("@import \"tailwindcss\";\n", block1);
    const block2 = "/* form-builder theme (managed) */\nNEW\n/* end form-builder theme */";
    const merged = mergeThemeBlock(withBlock, block2);

    expect(merged).toContain("NEW");
    expect(merged).not.toContain("OLD");
    // Exactly one managed block, not two.
    expect(merged.match(/form-builder theme \(managed\)/g)?.length).toBe(1);
  });

  it("findGlobalsCss prefers <base>/app/globals.css over <base>/styles/globals.css", () => {
    fs.mkdirSync(path.join(dir, "src", "app"), { recursive: true });
    fs.mkdirSync(path.join(dir, "src", "styles"), { recursive: true });
    fs.writeFileSync(path.join(dir, "src", "app", "globals.css"), "/* app */");
    fs.writeFileSync(path.join(dir, "src", "styles", "globals.css"), "/* styles */");

    expect(findGlobalsCss(dir, "src")).toBe(path.join(dir, "src", "app", "globals.css"));
  });

  it("findGlobalsCss falls back to styles/globals.css when app/globals.css doesn't exist", () => {
    fs.mkdirSync(path.join(dir, "src", "styles"), { recursive: true });
    fs.writeFileSync(path.join(dir, "src", "styles", "globals.css"), "/* styles */");

    expect(findGlobalsCss(dir, "src")).toBe(path.join(dir, "src", "styles", "globals.css"));
  });

  it("findGlobalsCss falls back to a bounded search for any globals.css under base", () => {
    fs.mkdirSync(path.join(dir, "src", "some-other-folder"), { recursive: true });
    fs.writeFileSync(path.join(dir, "src", "some-other-folder", "globals.css"), "/* nested */");

    expect(findGlobalsCss(dir, "src")).toBe(path.join(dir, "src", "some-other-folder", "globals.css"));
  });

  it("findGlobalsCss returns null when nothing is found (non-fatal — caller prints instead)", () => {
    fs.mkdirSync(path.join(dir, "src"), { recursive: true });
    expect(findGlobalsCss(dir, "src")).toBeNull();
  });

  it("injectThemeCss reports not-found (and never throws) when there's no globals.css", () => {
    fs.mkdirSync(path.join(dir, "src"), { recursive: true });
    const result = injectThemeCss(dir, "src", themeItem);
    expect(result.status).toBe("not-found");
    expect(result.block).toContain("--breakpoint-tablet: 481px;");
  });

  it("injectThemeCss writes the block on first run, then SKIPS on a second run without --force (edit preserved)", () => {
    fs.mkdirSync(path.join(dir, "src", "app"), { recursive: true });
    const cssPath = path.join(dir, "src", "app", "globals.css");
    fs.writeFileSync(cssPath, "@import \"tailwindcss\";\n");

    const first = injectThemeCss(dir, "src", themeItem);
    expect(first.status).toBe("written");
    const afterFirst = fs.readFileSync(cssPath, "utf8");
    expect(afterFirst).toContain("--breakpoint-tablet: 481px;");

    // Simulate a manual edit inside the managed block.
    const edited = afterFirst.replace("--breakpoint-tablet: 481px;", "--breakpoint-tablet: 481px; /* my edit */");
    fs.writeFileSync(cssPath, edited);

    const second = injectThemeCss(dir, "src", themeItem);
    expect(second.status).toBe("skipped");
    expect(fs.readFileSync(cssPath, "utf8")).toContain("/* my edit */"); // untouched
  });

  it("injectThemeCss with force:true refreshes an existing managed block without duplicating it", () => {
    fs.mkdirSync(path.join(dir, "src", "app"), { recursive: true });
    const cssPath = path.join(dir, "src", "app", "globals.css");
    fs.writeFileSync(cssPath, "@import \"tailwindcss\";\n");

    injectThemeCss(dir, "src", themeItem);
    const result = injectThemeCss(dir, "src", themeItem, { force: true });

    expect(result.status).toBe("written");
    const content = fs.readFileSync(cssPath, "utf8");
    expect(content.match(/form-builder theme \(managed\)/g)?.length).toBe(1);
  });
});
