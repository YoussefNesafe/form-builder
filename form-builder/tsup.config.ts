import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "tsup";

const pkg = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf-8"),
) as {
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
};

export default defineConfig({
  entry: ["headless.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: {
    compilerOptions: {
      incremental: false,
      ignoreDeprecations: "6.0",
      baseUrl: path.resolve(import.meta.dirname, ".."),
      paths: { "@/*": ["./*"] },
      types: ["node"],
      skipLibCheck: true,
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  tsconfig: path.resolve(import.meta.dirname, "../tsconfig.json"),
  external: [
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.dependencies ?? {}),
  ],
});
