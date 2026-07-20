import type { AnyFieldConfig, FormValues } from "./types";

export type AutosaveOptions = {
  key?: string;
  debounceMs?: number;
  includeSignatures?: boolean;
};

type DraftPayload = {
  hash: string;
  values: FormValues;
  step?: number;
};

export function draftStorageKey(idOrKey: string): string {
  return `form-builder:draft:${idOrKey}`;
}

export function draftConfigHash(fields: AnyFieldConfig[]): string {
  const json = JSON.stringify(fields);
  let hash = 5381;
  for (let i = 0; i < json.length; i += 1) {
    hash = ((hash << 5) + hash + json.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

const hasFile = (value: unknown): boolean =>
  (typeof File !== "undefined" && value instanceof File) ||
  (Array.isArray(value) && value.some((item) => typeof File !== "undefined" && item instanceof File));

export function sanitizeDraftValues(
  fields: AnyFieldConfig[],
  values: FormValues,
  includeSignatures = false,
): FormValues {
  const byName = new Map(fields.map((field) => [field.name, field]));
  const out: FormValues = {};
  for (const [name, value] of Object.entries(values)) {
    const field = byName.get(name);
    if (field?.type === "file" || field?.type === "password" || field?.type === "otp") continue;
    if (field?.type === "signature" && !includeSignatures) continue;
    if (field?.type === "group" && Array.isArray(value)) {
      const inner = (field as { fields: AnyFieldConfig[] }).fields;
      out[name] = value.map((row) =>
        row && typeof row === "object" && !Array.isArray(row)
          ? sanitizeDraftValues(inner, row as FormValues, includeSignatures)
          : row,
      );
      continue;
    }
    if (hasFile(value)) continue;
    out[name] = value;
  }
  return out;
}

export function loadDraft(idOrKey: string, hash: string): { values: FormValues; step?: number } | null {
  if (typeof window === "undefined") return null;
  const storageKey = draftStorageKey(idOrKey);
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return null;
    const payload = JSON.parse(raw) as DraftPayload;
    if (payload.hash !== hash || typeof payload.values !== "object" || payload.values === null) {
      window.localStorage.removeItem(storageKey);
      return null;
    }
    return { values: payload.values, step: payload.step };
  } catch {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
    }
    return null;
  }
}

export function saveDraft(idOrKey: string, hash: string, values: FormValues, step?: number): void {
  if (typeof window === "undefined") return;
  try {
    const payload: DraftPayload = { hash, values, ...(step !== undefined ? { step } : {}) };
    window.localStorage.setItem(draftStorageKey(idOrKey), JSON.stringify(payload));
  } catch {
  }
}

export function hasDraft(idOrKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(draftStorageKey(idOrKey)) !== null;
  } catch {
    return false;
  }
}

export function clearDraft(idOrKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftStorageKey(idOrKey));
  } catch {
  }
}
