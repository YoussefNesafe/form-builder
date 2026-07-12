"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_PACKAGE_MANAGER, PACKAGE_MANAGERS, type PackageManager } from "./command";

const STORAGE_KEY = "docs:package-manager";

let packageManager: PackageManager = DEFAULT_PACKAGE_MANAGER;
let hasHydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function isPackageManager(value: string): value is PackageManager {
  return (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

/** Updates the shared selection and writes it through to localStorage (best-effort — same guarded pattern as form-builder/core/autosave.ts). */
export function setPackageManager(next: PackageManager): void {
  if (next === packageManager) return;
  packageManager = next;
  emit();
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Quota or disabled storage — selection still syncs in-memory for this page view.
  }
}

/**
 * Reads the persisted choice and adopts it. Call once, from a mounted client
 * component's effect — NEVER during render. Keeps first paint deterministic
 * (`DEFAULT_PACKAGE_MANAGER` on both server and client, see
 * `getServerSnapshot` below) so there's no hydration mismatch; the stored
 * preference, if any, takes over a frame later. Idempotent via `hasHydrated`
 * so mounting several CommandBlocks at once only reads storage once.
 */
export function hydratePackageManagerFromStorage(): void {
  if (hasHydrated || typeof window === "undefined") return;
  hasHydrated = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isPackageManager(stored)) {
      packageManager = stored;
      emit();
    }
  } catch {
    // Disabled storage — fall back to the deterministic default.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return packageManager;
}

/**
 * Exported (not just passed inline to `useSyncExternalStore`) so the SSR
 * contract — first paint is always the deterministic default, never
 * whatever a previous test/render left `packageManager` at — has its own
 * direct unit test instead of relying on jsdom `window` presence/absence
 * gymnastics.
 */
export function getServerSnapshot(): PackageManager {
  return DEFAULT_PACKAGE_MANAGER;
}

/**
 * Cross-CommandBlock package-manager selection. Module-scope singleton (this
 * docs site is single-locale/single-instance — no per-form isolation like
 * form-builder/store/stepper.ts's factory needs) built on
 * `useSyncExternalStore` rather than zustand: it's one primitive value with
 * no selectors/middleware/devtools payoff, and hand-rolling it makes the
 * SSR-safe hydration contract (deterministic default at first paint, adopt
 * storage after mount) explicit and auditable instead of threading through
 * zustand persist's `skipHydration`/rehydrate flow for a single string —
 * same tradeoff shadcn's own docs site makes with a localStorage-backed
 * jotai `atomWithStorage` (apps/v4/hooks/use-config.ts).
 */
export function usePackageManager(): [PackageManager, (next: PackageManager) => void] {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [value, setPackageManager];
}

/** Test-only reset — module state is a singleton and otherwise persists for the process lifetime across tests in the same file. */
export function __resetPackageManagerStoreForTests(): void {
  packageManager = DEFAULT_PACKAGE_MANAGER;
  hasHydrated = false;
  listeners.clear();
}
