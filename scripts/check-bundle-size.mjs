#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

/**
 * CI gate for ADR-0003 Phase 3 ("Publish & harden"): protects the headless
 * engine's tree-shaking win from silently regressing. Three checks:
 *
 *   1. Gzip size budget on the built headless entry (`form-builder/dist/
 *      headless.js`, the ESM output — what a tree-shaking bundler actually
 *      consumes). Budget is set with ~25% headroom over the measured size at
 *      the time this gate was written (see BUDGET_BYTES below) so routine
 *      growth doesn't require touching this file on every dependency bump,
 *      while a real regression (e.g. an accidental non-external import
 *      pulling a whole library in) still fails CI.
 *   2. PRIMARY rendering-layer-coupling guard: reads the emitted
 *      sourcemap(s) (`headless.js.map` / `headless.cjs.map`) and inspects
 *      the `sources` array — the original file paths tsup/esbuild bundled
 *      from, e.g. "../ui/FieldWrapper.tsx" or "../components/FormStepper.tsx"
 *      — and FAILs if any source is the rendering layer (form-builder's own
 *      `ui/`, the vendored `internal/cn`, root-level shadcn primitives under
 *      `components/ui/`, or any `components/`/`fields/` source not on the
 *      small allowlist of files headless.ts legitimately re-exports). This
 *      is the check that actually catches inlined coupling: tsup only
 *      externalizes packages listed in peerDependencies/dependencies, so a
 *      bad `@/components/ui/*` or same-package relative import would be
 *      INLINED (its source text rewritten/minified into headless.js), not
 *      left as a literal specifier string — a plain grep over the bundled
 *      JS can miss it entirely. The sourcemap doesn't have that blind spot:
 *      every file esbuild actually pulled into the bundle is named in
 *      `sources`, regardless of how its code was transformed. If a `.map`
 *      file is missing (sourcemaps disabled, e.g.), this check is skipped
 *      with a warning rather than failing the build — see checkSourcemapCoupling.
 *   3. DEFENSE-IN-DEPTH: a plain string grep over the built dist text for
 *      `@/components/ui` / `internal/cn`. This catches an import specifier
 *      that survived un-inlined (e.g. a dynamic `import()` esbuild couldn't
 *      resolve statically) but is NOT the primary guard — check 2 above is.
 *      The actual primary guards against this whole class of regression are
 *      (a) the source-level boundary test, `form-builder/core/
 *      boundary.test.ts`, which scans core/hooks/store's own import
 *      specifiers before anything is even bundled, and (b) the gzip budget
 *      in check 1, which would balloon if a whole shadcn/Tailwind-adjacent
 *      dependency graph got pulled in. This script's checks are the build-
 *      output-level backstop for both.
 *
 * Run standalone: `node scripts/check-bundle-size.mjs` (after `cd
 * form-builder && yarn build`). Exit code is non-zero on any budget/coupling
 * failure — wired into CI as a fast, independent job (see
 * .github/workflows/ci.yml `bundle-budget` job) that does not depend on the
 * app's lint/test/build.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "form-builder", "dist");
const ESM_FILE = path.join(DIST_DIR, "headless.js");
const CJS_FILE = path.join(DIST_DIR, "headless.cjs");
const ESM_MAP_FILE = path.join(DIST_DIR, "headless.js.map");
const CJS_MAP_FILE = path.join(DIST_DIR, "headless.cjs.map");

// Measured gzip size at the time this gate was authored (2026-07-18): 16234
// bytes. Budget below gives ~26% headroom (20-30% band requested) — enough
// slack for normal dependency/feature growth without being so loose a real
// regression slips through unnoticed.
const BUDGET_BYTES = 20 * 1024; // 20 KiB gzip

const FORBIDDEN_STRINGS = ["@/components/ui", "internal/cn"];

// Sourcemap `sources` entries that legitimately live under form-builder's
// `components/` or `fields/` directories despite those directories
// otherwise being rendering-layer territory — see headless.ts's own header
// comment for the authoritative list of what it exports and why each is
// safe:
//   - components/FieldRuntime.tsx: only `export type { FormLocale,
//     OtpRuntime }` is re-exported (type-only — erased before JS emission);
//     headless.ts explicitly warns against importing any *value* from this
//     module. It still appears in `sources` because esbuild registers every
//     file it parsed while resolving the type-only re-export, even though
//     none of its runtime code contributes output.
//   - components/reviewValue.ts: a pure value-formatting helper
//     (formatReviewValue et al.), deliberately re-exported so headless hosts
//     building their own rendering can reuse it. No shadcn/cn import.
//   - fields/maskedValue.ts: a pure value helper (formatMasked/extractRaw),
//     deliberately re-exported for the same reason. No shadcn/cn import.
// Anything else under components/ or fields/ (FormRenderer, FormStepper,
// ReviewStep, any fields/*Field.tsx renderer, ...) reaching the bundle is a
// genuine regression.
const ALLOWED_RELATIVE_SOURCES = new Set([
  "components/FieldRuntime.tsx",
  "components/reviewValue.ts",
  "fields/maskedValue.ts",
]);

function fail(message) {
  console.error(`[bundle-budget] FAIL: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`[bundle-budget] WARN: ${message}`);
}

function readDistFile(file) {
  if (!fs.existsSync(file)) {
    fail(
      `${path.relative(ROOT, file)} not found. Build the engine first: ` +
        `cd form-builder && yarn build`,
    );
    return null;
  }
  return fs.readFileSync(file);
}

function checkGzipBudget() {
  const buf = readDistFile(ESM_FILE);
  if (buf === null) return;

  // level 9 (max compression) is a deliberately conservative worst-case
  // figure, not a prediction of real-world transfer size — most CDNs/HTTP
  // servers serve gzip at a faster, less-thorough level (or brotli, which
  // this doesn't measure at all), both of which typically produce a
  // *smaller* payload than this number. Treat this as an upper bound for
  // budget-tracking purposes, not the number to quote for actual transfer
  // size.
  const gzipSize = zlib.gzipSync(buf, { level: 9 }).length;
  const pct = ((gzipSize / BUDGET_BYTES) * 100).toFixed(1);
  const relFile = path.relative(ROOT, ESM_FILE).split(path.sep).join("/");

  console.log(
    `[bundle-budget] ${relFile} (gzip): ${gzipSize} B / ${BUDGET_BYTES} B budget (${pct}%)`,
  );

  if (gzipSize > BUDGET_BYTES) {
    fail(
      `${relFile} gzip size ${gzipSize} B exceeds budget ${BUDGET_BYTES} B. ` +
        `Either this is a real regression (check for a new non-external ` +
        `import pulling a whole dependency into the bundle) or growth is ` +
        `expected — if so, bump BUDGET_BYTES in scripts/check-bundle-size.mjs ` +
        `deliberately, with a comment explaining why.`,
    );
  } else {
    console.log(`[bundle-budget] OK — within budget.`);
  }
}

/**
 * Classifies a sourcemap `sources` entry relative to `form-builder/dist/`.
 * Typical entries look like "../core/types.ts" (one level up, inside
 * form-builder/) or "../../components/ui/button.tsx" (two levels up, the
 * root-level shadcn primitives directory outside form-builder/ entirely).
 */
function classifySource(rawSrc) {
  const normalized = rawSrc.replace(/\\/g, "/");
  let rest = normalized;
  let upCount = 0;
  while (rest.startsWith("../")) {
    rest = rest.slice(3);
    upCount++;
  }
  const topSegment = rest.split("/")[0] ?? "";
  return { upCount, topSegment, rest };
}

function isForbiddenSource(rawSrc) {
  const { upCount, topSegment, rest } = classifySource(rawSrc);

  if (upCount === 1) {
    // Inside form-builder/ itself.
    if (topSegment === "ui") return true; // FieldWrapper, cva variants — rendering-only, always forbidden
    if (topSegment === "internal" && /(^|\/)cn(\.[tj]sx?)?$/.test(rest)) return true; // vendored cn helper
    if (topSegment === "components" || topSegment === "fields") {
      return !ALLOWED_RELATIVE_SOURCES.has(rest);
    }
    return false; // core/, hooks/, store/, headless.ts itself — fine
  }
  if (upCount >= 2 && rest.startsWith("components/ui/")) return true; // root-level shadcn primitives
  return false;
}

function checkSourcemapCoupling() {
  const pairs = [
    { dist: ESM_FILE, map: ESM_MAP_FILE },
    { dist: CJS_FILE, map: CJS_MAP_FILE },
  ];

  for (const { dist, map } of pairs) {
    const relMap = path.relative(ROOT, map).split(path.sep).join("/");

    if (!fs.existsSync(dist)) continue; // already reported by checkGzipBudget/readDistFile elsewhere

    if (!fs.existsSync(map)) {
      warn(
        `${relMap} not found — skipping the sourcemap-based coupling check for this output ` +
          `(sourcemap generation may be disabled). This is the PRIMARY coupling guard; ` +
          `relying on the raw-text grep (defense-in-depth only) for this output in the meantime.`,
      );
      continue;
    }

    let sources;
    try {
      const parsed = JSON.parse(fs.readFileSync(map, "utf8"));
      sources = Array.isArray(parsed.sources) ? parsed.sources : null;
    } catch (err) {
      warn(`${relMap} could not be parsed as JSON (${err.message}) — skipping this output.`);
      continue;
    }
    if (!sources) {
      warn(`${relMap} has no "sources" array — skipping this output.`);
      continue;
    }

    const violations = sources.filter((src) => isForbiddenSource(src));
    if (violations.length > 0) {
      fail(
        `${relMap} bundled rendering-layer source(s): ${violations.join(", ")}. ` +
          `The headless entry (form-builder/headless.ts) must never pull in code from ` +
          `form-builder/ui/, the vendored internal/cn, root-level shadcn primitives ` +
          `(components/ui/*), or any component/field beyond the small allowlist in this ` +
          `script — see docs/adr/0003-packaging-split-distribution.md "Why the rendered ` +
          `React entries are not npm-exported in Phase 1".`,
      );
    } else {
      console.log(`[bundle-budget] ${relMap}: no rendering-layer sources bundled — OK.`);
    }
  }
}

function checkRawStringCoupling() {
  for (const file of [ESM_FILE, CJS_FILE]) {
    const buf = readDistFile(file);
    if (buf === null) continue;

    const text = buf.toString("utf8");
    const relFile = path.relative(ROOT, file).split(path.sep).join("/");
    const hits = FORBIDDEN_STRINGS.filter((needle) => text.includes(needle));

    if (hits.length > 0) {
      fail(
        `${relFile} contains rendering-layer coupling string(s): ${hits.join(", ")}. ` +
          `The headless entry (form-builder/headless.ts) must never re-export ` +
          `anything from the rendering layer (FormRenderer, fields/*, ` +
          `ui/FieldWrapper) — see docs/adr/0003-packaging-split-distribution.md ` +
          `"Why the rendered React entries are not npm-exported in Phase 1".`,
      );
    } else {
      console.log(
        `[bundle-budget] ${relFile}: no rendering-layer coupling strings (defense-in-depth) — OK.`,
      );
    }
  }
}

checkGzipBudget();
checkSourcemapCoupling();
checkRawStringCoupling();

if (process.exitCode) {
  console.error("[bundle-budget] One or more checks failed.");
} else {
  console.log("[bundle-budget] All checks passed.");
}
