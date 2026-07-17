import fs from "node:fs";
import path from "node:path";

/**
 * Recursively list every file under `rootDir`, as POSIX-style paths
 * relative to `rootDir`, sorted for deterministic zip output. No filtering
 * of *source* content — the caller (scripts/zip-form-builder.mjs) needs an
 * exact mirror of the folder, tests included, so this walks and returns
 * everything it finds rather than guessing at what should be excluded.
 * The one exception: any directory literally named `dist` is skipped —
 * that's tsup's generated build output (see form-builder/tsup.config.ts),
 * not source, already .gitignored, and not part of the copy-in flow this
 * zip exists for.
 */
export function collectFiles(rootDir) {
  const out = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name === "dist") continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile()) {
        out.push(path.relative(rootDir, abs).split(path.sep).join("/"));
      }
    }
  };

  walk(rootDir);
  return out.sort();
}
