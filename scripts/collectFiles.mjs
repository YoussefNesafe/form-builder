import fs from "node:fs";
import path from "node:path";

/**
 * Recursively list every file under `rootDir`, as POSIX-style paths
 * relative to `rootDir`, sorted for deterministic zip output. No filtering
 * of any kind — the caller (scripts/zip-form-builder.mjs) needs an exact
 * mirror of the folder, tests included, so this walks and returns
 * everything it finds rather than guessing at what should be excluded.
 */
export function collectFiles(rootDir) {
  const out = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
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
