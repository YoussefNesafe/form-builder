import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectBaseDir } from "./detect.mjs";

describe("detectBaseDir", () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "form-builder-detect-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('prefers "src" when both src/ and app/ exist', () => {
    fs.mkdirSync(path.join(dir, "src"));
    fs.mkdirSync(path.join(dir, "app"));
    expect(detectBaseDir(dir)).toEqual({ base: "src", warned: false });
  });

  it('falls back to "app" when only app/ exists', () => {
    fs.mkdirSync(path.join(dir, "app"));
    expect(detectBaseDir(dir)).toEqual({ base: "app", warned: false });
  });

  it("falls back to the project root and warns when neither exists", () => {
    expect(detectBaseDir(dir)).toEqual({ base: ".", warned: true });
  });

  it("does not mistake a stray FILE named src/app for the real directory", () => {
    fs.writeFileSync(path.join(dir, "src"), "not a directory");
    fs.writeFileSync(path.join(dir, "app"), "not a directory either");
    expect(detectBaseDir(dir)).toEqual({ base: ".", warned: true });
  });
});
