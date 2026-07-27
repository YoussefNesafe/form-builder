import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The barrel split, asserted over the two barrels' SOURCE.
 *
 * `barrels.test-d.ts` is the consumer-shaped check and is the better one for
 * values — it resolves `@/form-builder` the way an installed app does. But it
 * cannot see types at all: `keyof typeof import(...)` lists only value
 * exports, and naming a type to prove it is *missing* is a compile error, not
 * a failing assertion. That leaves this task's headline decision — the UI
 * types (`StepperOrientation`, `DraftRestoreInfo`, `FileDropzoneProps`) stay
 * out of `headless.ts`, because the npm package ships no renderer to use them
 * on — with no guard at all.
 *
 * Reading the source closes that. It is a weaker notion of "exported" than the
 * built `.d.ts` a consumer actually receives, but it needs no build step, so
 * it runs in `yarn test` on every change rather than only at release. The
 * built artifact was verified by hand once (`dist/headless.d.ts` declares
 * `DraftStorage`, `DraftStorageOption`, `acceptedFormatsLabel` and names none
 * of the three UI types); this keeps it that way.
 */

const BARREL_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Both barrels are written exclusively as `export [type] { ... } from "...";`
 * — no `export *`, no inline declarations. `exportedNames` relies on that, and
 * `assertFullyParsed` below proves it per-file rather than trusting it, so a
 * future barrel entry in some other form fails loudly instead of being
 * silently skipped by the regex and read as an absence.
 */
const RE_EXPORT = /export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["'][^"']+["']\s*;/g;
const COMMENTS = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;

function readBarrel(file: string): string {
  return fs.readFileSync(path.join(BARREL_DIR, file), "utf8").replace(COMMENTS, "");
}

function exportedNames(source: string): Set<string> {
  const names = new Set<string>();
  for (const [, body] of source.matchAll(RE_EXPORT)) {
    for (const raw of body.split(",")) {
      const entry = raw.trim().replace(/^type\s+/, "");
      if (entry === "") continue;
      // `x as y` publishes `y`; neither barrel aliases today, but reading the
      // wrong half of a future alias would be a silent misreport.
      const asMatch = /\s+as\s+(\S+)$/.exec(entry);
      names.add(asMatch ? asMatch[1] : entry);
    }
  }
  return names;
}

function assertFullyParsed(file: string, source: string): void {
  const remainder = source.replace(RE_EXPORT, "");
  expect(
    /\bexport\b/.test(remainder),
    `${file} contains an export this test's parser does not understand, so its names are invisible here and would read as deliberately absent. Extend RE_EXPORT.`,
  ).toBe(false);
}

describe("the barrel split, over source (types included)", () => {
  const indexSrc = readBarrel("index.ts");
  const headlessSrc = readBarrel("headless.ts");
  const index = exportedNames(indexSrc);
  const headless = exportedNames(headlessSrc);

  it("parses every export statement in both barrels", () => {
    assertFullyParsed("index.ts", indexSrc);
    assertFullyParsed("headless.ts", headlessSrc);
    // Sanity: a parser returning nothing would make every check below pass.
    expect(index.size).toBeGreaterThan(40);
    expect(headless.size).toBeGreaterThan(40);
  });

  it("gives index.ts every name headless.ts exports", () => {
    const missing = [...headless].filter((name) => !index.has(name));
    expect(
      missing,
      `${missing[0]} is exported from headless.ts but not index.ts — the app barrel must be a superset, or an npm consumer can name something the app cannot.`,
    ).toEqual([]);
  });

  it("keeps exactly the rendered layer, and only it, out of headless.ts", () => {
    // Enumerated, not counted. The three types are the point of this file:
    // they are invisible to barrels.test-d.ts, so without this list nothing
    // would notice them drifting into headless.ts — which would commit the
    // npm package to naming props for a renderer it does not ship.
    const indexOnly = [...index].filter((name) => !headless.has(name)).sort();
    expect(indexOnly).toEqual(
      [
        "DraftRestoreInfo",
        "FieldWrapper",
        "FileDropzone",
        "FileDropzoneProps",
        "FormRenderer",
        "FormSection",
        "StepperOrientation",
        "fieldAriaDescribedBy",
        "registerBuiltInFields",
        "useFieldDisabled",
        "useFieldRuntime",
      ].sort(),
    );
  });
});
