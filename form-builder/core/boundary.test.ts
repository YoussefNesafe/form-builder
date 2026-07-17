import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cn as fbCn } from "../internal/cn";
import { cn as appCn } from "../../lib/utils";

/**
 * Boundary guard: `core/`, `hooks/`, and `store/` are the headless layers of
 * the package — they must stay decoupled from the shadcn/cn/Tailwind
 * rendering stack (react and react-hook-form imports are fine and expected
 * here). This scans their source files for import specifiers that would
 * pull in the rendering layer (shadcn `@/components/ui/*`, either `cn`
 * helper, or raw Tailwind/CSS) and fails if it finds one. It's a regex over
 * import specifiers, not a type-checker — cheap and fast by design.
 */

const HEADLESS_DIRS = ["core", "hooks", "store"];

const FORBIDDEN_SPECIFIER_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /^@\/components\/ui\//, reason: "shadcn UI primitive" },
  { pattern: /^@\/lib\/utils$/, reason: "app-owned cn helper" },
  { pattern: /(^|\/)internal\/cn$/, reason: "vendored cn helper" },
  { pattern: /^clsx$/, reason: "cn helper ingredient" },
  { pattern: /^tailwind-merge$/, reason: "cn helper ingredient" },
  { pattern: /^tailwindcss/, reason: "Tailwind" },
  { pattern: /\.css$/, reason: "stylesheet import" },
];

// Whole-file-text scan (not line-anchored) so multi-line imports — where the
// specifier lands on the closing `} from "..."` line — are still caught.
const FROM_CLAUSE = /\bfrom\s*["']([^"']+)["']/g;
// Side-effect imports, e.g. `import "./x.css"` (no `from` clause).
const SIDE_EFFECT_IMPORT = /\bimport\s+["']([^"']+)["']/g;
const REQUIRE_CALL = /require\(\s*["']([^"']+)["']\s*\)/g;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(abs));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes(".test.")) {
      out.push(abs);
    }
  }
  return out;
}

function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  // `\bfrom\s*["']...["']` matches both `import … from "x"` and
  // `export … from "x"` (re-exports), and is not line-anchored so it also
  // catches multi-line imports whose specifier sits on the `} from "..."`
  // line.
  for (const match of source.matchAll(FROM_CLAUSE)) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(SIDE_EFFECT_IMPORT)) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(REQUIRE_CALL)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

describe("headless layer boundary (core/hooks/store)", () => {
  const root = join(__dirname, "..");
  const files = HEADLESS_DIRS.flatMap((dir) => walk(join(root, dir)));

  it("scans a non-empty set of source files", () => {
    // Guards the guard: if the dirs move/empty out, this test would
    // otherwise pass vacuously.
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const relative = file.slice(root.length + 1).split("\\").join("/");

    it(`${relative} has no rendering-layer imports`, () => {
      const source = readFileSync(file, "utf8");
      const violations = importSpecifiers(source).flatMap((specifier) => {
        const hit = FORBIDDEN_SPECIFIER_PATTERNS.find(({ pattern }) => pattern.test(specifier));
        return hit ? [`"${specifier}" (${hit.reason})`] : [];
      });
      expect(violations).toEqual([]);
    });
  }
});

describe("vendored cn parity with app cn", () => {
  // The vendored `internal/cn` is an intentional duplicate of the app's
  // `lib/utils` `cn` (see internal/cn.ts) so the package stays self-
  // contained. Pin behavioral parity so a silent drift between the two
  // implementations is caught by CI instead of shipping unnoticed.
  it("merges classes identically to the app cn helper", () => {
    expect(fbCn("p-2", "p-4")).toBe(appCn("p-2", "p-4"));
  });

  it("handles falsy/conditional inputs identically", () => {
    expect(fbCn("a", false && "b", "c")).toBe(appCn("a", false && "b", "c"));
  });

  it("dedupes conflicting Tailwind classes identically", () => {
    expect(fbCn("text-sm", "text-lg")).toBe(appCn("text-sm", "text-lg"));
  });
});
