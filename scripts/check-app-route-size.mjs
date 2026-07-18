#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

/**
 * SOFT/WARN-ONLY companion to scripts/check-bundle-size.mjs: estimates the
 * landing route's ("/") client JS payload from a completed `next build` and
 * warns (never fails) if it exceeds a generous soft budget. This is the
 * app-side half of ADR-0003 Phase 3's bundle-size ask; the engine dist
 * budget in check-bundle-size.mjs is the must-have hard gate, this is best-
 * effort.
 *
 * Why this can't be a hard gate: Next 16's Turbopack `next build` output no
 * longer prints a per-route "Size / First Load JS" table (verified against
 * this repo's actual build log — the "Route (app)" section is route names
 * only), so there is no simple text-parse path anymore. This script instead
 * reads the App Router's internal RSC client-reference-manifest for the
 * root route and sums the gzip size of every referenced chunk file under
 * `.next/static/`. That manifest's shape is a Next.js build implementation
 * detail, not a public API — it can change across Next versions without
 * notice. Every failure mode below (manifest not found, unexpected shape,
 * missing chunk file) is caught and treated as "skip with a notice," never
 * as a build failure. Always exits 0.
 *
 * Run after `yarn build` (from the repo root): `node
 * scripts/check-app-route-size.mjs`
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const NEXT_DIR = path.join(ROOT, ".next");
const APP_SERVER_DIR = path.join(NEXT_DIR, "server", "app");

// Soft budget only — a warning, not a failure. Set with generous (~28%)
// headroom over the measured value at the time this script was written
// (2026-07-18: ~335 KB gzip across the root route's referenced chunks).
// Free to retune; this number has no contractual weight the way
// check-bundle-size.mjs's BUDGET_BYTES does.
const SOFT_BUDGET_BYTES = 420 * 1024; // 420 KiB gzip, warn only

function warn(message) {
  console.warn(`[bundle-budget:app-route] ${message}`);
}

function info(message) {
  console.log(`[bundle-budget:app-route] ${message}`);
}

/** Recursively find every `page_client-reference-manifest.js` under `.next/server/app`. */
function findManifestFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findManifestFiles(abs));
    } else if (entry.name === "page_client-reference-manifest.js") {
      out.push(abs);
    }
  }
  return out;
}

/** "/(site)/page" -> "/", "/(site)/docs/page" -> "/docs" (route groups stripped). */
function normalizeRouteKey(key) {
  const withoutPageSuffix = key.replace(/\/page$/, "");
  const segments = withoutPageSuffix.split("/").filter((seg) => seg && !/^\(.*\)$/.test(seg));
  return "/" + segments.join("/");
}

function findRootRouteManifest() {
  for (const file of findManifestFiles(APP_SERVER_DIR)) {
    const text = fs.readFileSync(file, "utf8");
    const keyMatch = text.match(/__RSC_MANIFEST\[["']([^"']+)["']\]/);
    if (!keyMatch) continue;
    if (normalizeRouteKey(keyMatch[1]) === "/") {
      return { file, text };
    }
  }
  return null;
}

function extractManifestJson(text) {
  const match = text.match(/__RSC_MANIFEST\[[^\]]+\]\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

function run() {
  if (!fs.existsSync(NEXT_DIR)) {
    info(`Skipped — no .next/ build output found. Run "yarn build" first if you want this check.`);
    return;
  }

  const found = findRootRouteManifest();
  if (!found) {
    info(
      "Skipped — could not locate the root route's client-reference-manifest under " +
        ".next/server/app/ (Next.js internal build output shape may have changed). This is " +
        "advisory-only and never blocks CI.",
    );
    return;
  }
  info(`Found root route manifest: ${path.relative(ROOT, found.file).split(path.sep).join("/")}`);

  let manifest;
  try {
    manifest = extractManifestJson(found.text);
  } catch (err) {
    info(`Skipped — could not parse manifest JSON (${err.message}). Advisory-only, not a failure.`);
    return;
  }
  if (!manifest || typeof manifest.clientModules !== "object") {
    info("Skipped — manifest did not have the expected shape. Advisory-only, not a failure.");
    return;
  }

  const chunkPaths = new Set();
  for (const mod of Object.values(manifest.clientModules)) {
    for (const chunk of mod.chunks ?? []) {
      chunkPaths.add(chunk);
    }
  }

  if (chunkPaths.size === 0) {
    info("Skipped — no client chunks found in the manifest. Advisory-only, not a failure.");
    return;
  }

  let totalGzip = 0;
  let measuredCount = 0;
  for (const chunkPath of chunkPaths) {
    // Manifest paths look like "/_next/static/chunks/xxx.js" — map to the
    // real file under .next/static/chunks/xxx.js.
    const rel = chunkPath.replace(/^\/_next\//, "");
    const abs = path.join(NEXT_DIR, rel);
    if (!fs.existsSync(abs)) continue;
    const buf = fs.readFileSync(abs);
    totalGzip += zlib.gzipSync(buf, { level: 9 }).length;
    measuredCount++;
  }

  if (measuredCount === 0) {
    info("Skipped — none of the manifest's referenced chunk files were found on disk.");
    return;
  }

  const pct = ((totalGzip / SOFT_BUDGET_BYTES) * 100).toFixed(1);
  info(
    `landing route ("/") client JS (gzip, ${measuredCount} chunks): ${totalGzip} B / ${SOFT_BUDGET_BYTES} B soft budget (${pct}%)`,
  );

  if (totalGzip > SOFT_BUDGET_BYTES) {
    warn(
      `landing route gzip size ${totalGzip} B exceeds the soft budget ${SOFT_BUDGET_BYTES} B. ` +
        `This is a WARNING only (see components/home/* scoped-registration convention in AGENTS.md) ` +
        `— it does not fail the build.`,
    );
  } else {
    info("OK — within soft budget.");
  }
}

try {
  run();
} catch (err) {
  info(`Skipped due to an unexpected error (${err.message}). Advisory-only, never fails CI.`);
}

// Always exit 0 — soft/warn only, per design.
process.exitCode = 0;
