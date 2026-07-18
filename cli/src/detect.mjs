import fs from "node:fs";
import path from "node:path";

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Base-dir detection for the single-folder install: `src/` wins over `app/`
 * (a `src/app/` project has both — the App Router lives INSIDE `src/`, so
 * `src` is the correct base), falling back to the project root with a
 * warning if neither convention is present. Uses `statSync(...).isDirectory()`
 * rather than a bare `existsSync` check so a stray FILE named `src` or `app`
 * (no extension) doesn't get mistaken for the real directory.
 */
export function detectBaseDir(consumerRoot) {
  if (isDir(path.join(consumerRoot, "src"))) return { base: "src", warned: false };
  if (isDir(path.join(consumerRoot, "app"))) return { base: "app", warned: false };
  return { base: ".", warned: true };
}
