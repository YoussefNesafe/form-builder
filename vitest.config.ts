import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: [
      "form-builder/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      "app/**/*.test.{ts,tsx}",
      "lib/**/*.test.{ts,tsx}",
      "locales/**/*.test.{ts,tsx}",
      "scripts/**/*.test.{ts,tsx,mjs}",
    ],
    passWithNoTests: true,
  },
  resolve: {
    alias: [
      // Exact match, checked first — mirrors tsconfig.json's "@/form-builder"
      // entry. form-builder/ now ships its own package.json with an
      // "exports" map pointing at built dist/ output (for real npm
      // consumption). Without this, Vite's directory resolution for a bare
      // `@/form-builder` import picks up that package.json instead of
      // index.ts, pulling in stale/bundled dist (and its still-external
      // `@/components/ui/*` requires) into the test run. Deep imports
      // (`@/form-builder/fields/...`) don't match this and keep resolving
      // via the generic "@" alias below, straight to source.
      { find: /^@\/form-builder$/, replacement: path.resolve(__dirname, "form-builder/index.ts") },
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
});
