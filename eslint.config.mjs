import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // form-builder/dist/** is tsup's build output for the published headless
    // engine (ADR-0003 Unit A) — gitignored, but not previously excluded
    // here, so `yarn lint` picked it up (and failed) any time a dev had run
    // `cd form-builder && yarn build` locally. Now routine: CI's
    // bundle-budget job and release.yml both build it.
    "form-builder/dist/**",
  ]),
]);

export default eslintConfig;
