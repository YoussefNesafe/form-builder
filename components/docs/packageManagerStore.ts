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

export function setPackageManager(next: PackageManager): void {
  if (next === packageManager) return;
  packageManager = next;
  emit();
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
  }
}

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
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return packageManager;
}

export function getServerSnapshot(): PackageManager {
  return DEFAULT_PACKAGE_MANAGER;
}

export function usePackageManager(): [PackageManager, (next: PackageManager) => void] {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [value, setPackageManager];
}

export function __resetPackageManagerStoreForTests(): void {
  packageManager = DEFAULT_PACKAGE_MANAGER;
  hasHydrated = false;
  listeners.clear();
}
