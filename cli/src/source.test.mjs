import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { loadSource, reviveModel, vendorAvailable } from "./source.mjs";

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(CLI_ROOT, "..");

/**
 * Gate (e): confirms the dual-mode resolver actually branches on a vendor
 * directory's presence — vendored data wins when it exists, the live
 * monorepo computation is the fallback otherwise.
 *
 * Deliberately does NOT touch the real cli/vendor/ (an earlier version of
 * this test renamed it away to force the "local" branch, which raced with
 * every OTHER test file that also resolves source through this module —
 * vitest runs different test files in parallel worker processes sharing
 * the same filesystem, so a shared, real, mutated directory is a flaky-test
 * generator). Instead: `loadSource()` takes an injectable `{ cliRoot }`
 * (mirrors scripts/zip-form-builder.mjs's buildZip({ sourceDir, outFile })
 * parameterize-for-tests pattern), so every test here points at its own
 * throwaway fixture directory instead of shared global state.
 */
describe("source.mjs dual-mode resolver", () => {
  const tempDirs = [];

  function makeTempDir(prefix) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("reviveModel reconstructs the exact Map/Set shape buildRegistryModel() returns", () => {
    const raw = {
      engine: { filesRel: ["core/types.ts"], npmDeps: ["clsx"], uiDeps: ["button"] },
      fields: {
        "field-text": {
          componentName: "TextField",
          filesRel: ["fields/TextField.tsx"],
          npmDeps: [],
          uiDeps: ["button"],
          needsEngine: true,
        },
      },
      primitives: { button: { npmDeps: ["radix-ui"], registryDeps: [] } },
    };
    const model = reviveModel(raw);

    expect(model.engine.filesRel).toBeInstanceOf(Set);
    expect(model.engine.filesRel.has("core/types.ts")).toBe(true);
    expect(model.fields).toBeInstanceOf(Map);
    expect(model.fields.get("field-text").filesRel).toBeInstanceOf(Set);
    expect(model.fields.get("field-text").needsEngine).toBe(true);
    expect(model.primitives.get("button").npmDeps.has("radix-ui")).toBe(true);
  });

  it("vendorAvailable is false for a directory with no vendor contents", () => {
    const dir = makeTempDir("form-builder-source-empty-");
    expect(vendorAvailable(dir)).toBe(false);
  });

  it("vendorAvailable is true once registry-model.json + form-builder/ + components-ui/ all exist", () => {
    const dir = makeTempDir("form-builder-source-vendor-");
    fs.mkdirSync(path.join(dir, "form-builder"));
    fs.mkdirSync(path.join(dir, "components-ui"));
    fs.writeFileSync(path.join(dir, "registry-model.json"), "{}");
    expect(vendorAvailable(dir)).toBe(true);
  });

  it("loadSource picks vendored mode and reads from the injected cliRoot's vendor/ when it's a valid vendor dir", async () => {
    const cliRoot = makeTempDir("form-builder-source-fixture-");
    const vendorDir = path.join(cliRoot, "vendor");
    fs.mkdirSync(path.join(vendorDir, "form-builder"), { recursive: true });
    fs.mkdirSync(path.join(vendorDir, "components-ui"), { recursive: true });
    fs.writeFileSync(
      path.join(vendorDir, "registry-model.json"),
      JSON.stringify({
        engine: { filesRel: ["core/types.ts"], npmDeps: [], uiDeps: [] },
        fields: {},
        primitives: {},
        themeItem: { cssVars: { theme: { "breakpoint-tablet": "481px" }, light: {}, dark: {} } },
      }),
    );

    const result = await loadSource({ cliRoot });

    expect(result.mode).toBe("vendored");
    expect(result.formBuilderSrcDir).toBe(path.join(vendorDir, "form-builder"));
    expect(result.uiSrcDir).toBe(path.join(vendorDir, "components-ui"));
    expect(result.model.engine.filesRel.has("core/types.ts")).toBe(true);
    expect(result.themeItem.cssVars.theme["breakpoint-tablet"]).toBe("481px");
  });

  it("loadSource falls back to local mode against the real monorepo when the injected cliRoot has no vendor/", async () => {
    // A throwaway dir created directly under the real repo root, so
    // path.resolve(cliRoot, "..") genuinely resolves to REPO_ROOT and the
    // dynamic import of the real scripts/build-registry.mjs succeeds — a
    // true exercise of the local-mode fallback without ever touching the
    // real cli/ or cli/vendor/.
    const cliRoot = fs.mkdtempSync(path.join(REPO_ROOT, ".tmp-source-test-"));
    tempDirs.push(cliRoot);

    expect(vendorAvailable(path.join(cliRoot, "vendor"))).toBe(false);

    const result = await loadSource({ cliRoot });

    expect(result.mode).toBe("local");
    expect(result.formBuilderSrcDir).toBe(path.join(REPO_ROOT, "form-builder"));
    expect(result.uiSrcDir).toBe(path.join(REPO_ROOT, "components", "ui"));
    expect(result.model.fields.has("field-text")).toBe(true);
    expect(result.themeItem.cssVars.theme["breakpoint-tablet"]).toBe("481px");
  });
});
