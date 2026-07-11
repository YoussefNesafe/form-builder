"use client";

import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useFieldRuntime } from "../components/FieldRuntime";
import type { AnyFieldConfig } from "../core/types";

/** Handler return meaning "leave the field untouched". */
export const SKIP_SYNC: unique symbol = Symbol("form-builder.skip-sync");

type SyncCompute = (sourceValue: unknown, currentValue: unknown) => unknown;

/**
 * Skeleton for source→field sync (phone countryFrom, copyFrom): watches the
 * source field and applies its changes to this field. The first render after
 * (re)mount is baseline, not a change — drafts are not clobbered, and source
 * edits made while this field was unmounted (other wizard step) are
 * deliberately skipped. Seeding writes no flags (the field stays pristine);
 * change writes set dirty and revalidate only already-touched fields (mode
 * is onTouched — untouched fields must not get premature errors).
 */
export function useSourceSync(
  name: string,
  source: string | undefined,
  handlers: { seed: SyncCompute; change: SyncCompute },
) {
  const { control, getValues, setValue, getFieldState } = useFormContext();
  const { restoreGeneration } = useFieldRuntime();
  // useWatch needs a name even when the feature is off; watching this field
  // itself with disabled: true is a no-op placeholder.
  const watched = useWatch({ control, name: source ?? name, disabled: !source });
  const prev = useRef<unknown>(undefined);
  const mounted = useRef(false);
  // Initialized to the CURRENT generation: a field mounting after a restore
  // (later wizard step) must not re-baseline spuriously.
  const seenGeneration = useRef(restoreGeneration);
  // Handlers are per-render closures; the ref keeps the sync effect's dep
  // list stable without running stale logic. Updated in an effect (not
  // during render) and declared first so it settles before the sync effect
  // reads it in the same flush.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!source) return;
    if (!mounted.current) {
      mounted.current = true;
      prev.current = watched;
      const seeded = handlersRef.current.seed(watched, getValues(name));
      // Seed is initialization, not an edit — no flags on purpose (the field
      // stays pristine: not dirty, not touched, not validated).
      if (seeded !== SKIP_SYNC) setValue(name, seeded);
      return;
    }
    if (restoreGeneration !== seenGeneration.current) {
      // A draft restore rewrote form values wholesale. That is not a source
      // EDIT: applying it would clobber the restored target value (possibly
      // a drafted manual override). Re-baseline and stand down.
      seenGeneration.current = restoreGeneration;
      prev.current = watched;
      return;
    }
    if (watched === prev.current) return;
    prev.current = watched;
    const current = getValues(name);
    const next = handlersRef.current.change(watched, current);
    if (next === SKIP_SYNC || next === current) return;
    // Mode is onTouched: a touched field already shows validation state, so
    // the rewrite must re-validate or a stale green/error border survives
    // until the next blur. Untouched fields skip it — no premature errors.
    const { isTouched } = getFieldState(name);
    setValue(name, next, { shouldDirty: true, shouldValidate: isTouched });
  }, [watched, source, name, restoreGeneration, getValues, setValue, getFieldState]);
}

const isEmptyValue = (value: unknown): boolean =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

// Mirrored arrays/objects (multi-select, date range) must not share identity
// with the source value — RHF mutates in place for some field types.
const cloneValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === "object") return { ...value };
  return value;
};

/**
 * copyFrom: mirror a same-type sibling until the user edits this field; the
 * source wins again on its next change (same override semantics as phone
 * countryFrom). Copies verbatim including clears — a mirror, not a one-shot
 * prefill. Inert when the field has no copyFrom.
 */
export function useCopyFromSync(field: AnyFieldConfig): void {
  const source = (field as { copyFrom?: string }).copyFrom;
  useSourceSync(field.name, source, {
    seed: (sourceValue, currentValue) =>
      isEmptyValue(currentValue) && !isEmptyValue(sourceValue) ? cloneValue(sourceValue) : SKIP_SYNC,
    change: (sourceValue, currentValue) =>
      // Primitive no-op guard; clones always differ by identity, and a
      // same-content array write is harmless.
      sourceValue === currentValue ? SKIP_SYNC : cloneValue(sourceValue),
  });
}
