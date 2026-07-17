import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "tsup";

// Derived from package.json rather than hand-typed: every peerDependency and
// dependency must stay external (resolved from the consumer's own install,
// never bundled) and a hand-maintained list drifts silently when a dep is
// added/removed. Read once at config-eval time.
const pkg = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf-8"),
) as {
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
};

// Run from within `form-builder/` (see package.json "build" script) so entry
// globs below are relative to this directory, not the repo root.
export default defineConfig({
  // Phase 1 ships the headless engine only (config types, core, hooks,
  // registry, conditions, autosave, OTP, value helpers — see
  // docs/plans/2026-07-17-packaging-analysis.md §5.1 "Unit A"). The rendered
  // layer (FormRenderer, fields, FieldWrapper) transitively imports
  // host-owned `@/components/ui/*` shadcn primitives and per-file "use
  // client" directives don't survive a tsup bundle — it stays copy-in
  // (Phase 2), never built from here.
  entry: ["headless.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: {
    // Root tsconfig sets `incremental` (for the Next.js app build) and
    // relies on implicit `baseUrl` for the `@/*` paths mapping — both are
    // fine for `next build`/`tsc --noEmit` but the standalone dts worker
    // here treats them as fatal (TS5074/TS5101). Override just for this
    // isolated declaration build; root tsconfig is unchanged.
    compilerOptions: {
      incremental: false,
      ignoreDeprecations: "6.0",
      // Force `@/*` explicitly (root tsconfig relies on implicit baseUrl-at-
      // tsconfig-location, which this isolated dts worker does not honor).
      // headless.ts itself has no `@/*` imports, but this keeps the dts
      // worker resolvable if a future headless-safe module ever gains one.
      baseUrl: path.resolve(import.meta.dirname, ".."),
      paths: { "@/*": ["./*"] },
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  // Resolve `@/*` against the repo-root tsconfig — this package has no
  // tsconfig of its own.
  tsconfig: path.resolve(import.meta.dirname, "../tsconfig.json"),
  external: [
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.dependencies ?? {}),
  ],
});
