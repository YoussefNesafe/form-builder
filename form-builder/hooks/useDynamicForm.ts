"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  clearDraft,
  draftConfigHash,
  hasDraft,
  loadDraft,
  sanitizeDraftValues,
  saveDraft,
  type AutosaveOptions,
} from "../core/autosave";
import { buildDefaultValues } from "../core/defaults";
import { mergeMessages, type Messages } from "../core/messages";
import { validateFormConfig } from "../core/schema";
import {
  buildFormSchema,
  buildResolverSchema,
  collectCrossRulePairs,
  type OtpVerifiedChecker,
} from "../core/validation";
import type { FormConfig, FormValues } from "../core/types";

/**
 * Validates only currently visible fields: values persist in RHF state when a
 * field is condition-hidden or on another wizard step (shouldUnregister stays
 * false), but hidden-by-condition fields never block submission.
 *
 * Consequences (verified against RHF 7.80 + resolvers 5.4):
 * - handleSubmit passes the zod-PARSED payload to onSubmit — strip-mode drops
 *   condition-hidden values and keys unknown to the visible schema.
 * - formState.isValid reflects the whole visible schema across all wizard
 *   steps; steppers must gate on trigger(stepFieldNames), not isValid.
 */
function conditionAwareResolver(
  config: FormConfig,
  messages: Messages,
  otpVerified?: OtpVerifiedChecker,
): Resolver<FormValues> {
  return (values, context, options) => {
    const visibleSchema = buildResolverSchema(config, messages, otpVerified, values);
    return zodResolver(visibleSchema)(values, context, options);
  };
}

export type FormDraft = {
  /** Wizard step persisted with the draft — undefined until restored. */
  restoredStep?: number;
  clear: () => void;
  /** Persist the current wizard step (kept with subsequent value saves). */
  noteStep: (step: number) => void;
};

export function useDynamicForm(
  config: FormConfig,
  opts?: {
    messages?: Partial<Messages>;
    otpVerified?: OtpVerifiedChecker;
    autosave?: AutosaveOptions;
  },
) {
  const messages = useMemo(() => mergeMessages(opts?.messages), [opts?.messages]);
  const otpVerified = opts?.otpVerified;
  const schema = useMemo(() => {
    validateFormConfig(config);
    return buildFormSchema(config, messages, otpVerified);
  }, [config, messages, otpVerified]);
  const resolver = useMemo(
    () => conditionAwareResolver(config, messages, otpVerified),
    [config, messages, otpVerified],
  );
  const defaultValues = useMemo(() => buildDefaultValues(config.fields), [config]);

  // onTouched: errors surface on first blur, then revalidate per keystroke.
  const form = useForm<FormValues>({ resolver, defaultValues, mode: "onTouched" });

  // RHF applies resolver output only to the field that changed, so editing a
  // cross-rule SOURCE (the password under a confirm field) would leave the
  // declaring field's error stale — or never show one — until that field
  // revalidates itself. Watch the sources and re-trigger declaring fields
  // that are touched or already errored (untouched fields stay silent,
  // preserving onTouched semantics).
  const crossPairs = useMemo(() => collectCrossRulePairs(config.fields), [config]);
  const crossSourceNames = useMemo(() => [...new Set(crossPairs.map((pair) => pair.source))], [crossPairs]);
  const crossSourceValues = useWatch({
    control: form.control,
    name: crossSourceNames,
    disabled: crossSourceNames.length === 0,
  });
  // Cross-rule sources are text/date/time fields — plain string values.
  const crossSourceKey = crossSourceNames.length === 0 ? "" : JSON.stringify(crossSourceValues);
  const skippedInitialTrigger = useRef(false);
  useEffect(() => {
    if (!skippedInitialTrigger.current) {
      skippedInitialTrigger.current = true;
      return;
    }
    const staleDeclaring = [
      ...new Set(
        crossPairs
          .map((pair) => pair.field)
          .filter((name) => {
            const state = form.getFieldState(name);
            return state.isTouched || state.invalid;
          }),
      ),
    ];
    if (staleDeclaring.length > 0) void form.trigger(staleDeclaring);
  }, [crossSourceKey, crossPairs, form]);

  // --- Draft autosave (opt-in) ---
  const autosave = opts?.autosave;
  const draftId = autosave ? (autosave.key ?? config.id) : null;
  // Primitives, not the options object: hosts write autosave={{...}} inline,
  // and an object dep would tear down the save effect (dropping a pending
  // debounced save) on every host re-render.
  const draftDebounceMs = autosave?.debounceMs ?? 500;
  const includeSignatures = autosave?.includeSignatures ?? false;
  const draftHash = useMemo(() => (draftId !== null ? draftConfigHash(config.fields) : ""), [draftId, config]);
  const [restoredStep, setRestoredStep] = useState<number | undefined>(undefined);
  // Signals source-sync hooks (copyFrom, phone countryFrom) that a wholesale
  // value rewrite happened — they re-baseline instead of mirroring it.
  const [restoreGeneration, setRestoreGeneration] = useState(0);
  const draftStepRef = useRef<number | undefined>(undefined);
  // Child effects run before parent effects: the stepper announces its mount
  // step BEFORE this hook restores — writes before restore would clobber the
  // draft with pristine values.
  const draftRestoredRef = useRef(false);

  // Restore via reset in a mount effect, not in defaultValues — SSR renders
  // defaults, so seeding drafts at init would cause a hydration mismatch.
  useEffect(() => {
    if (!draftId) return;
    const draft = loadDraft(draftId, draftHash);
    draftRestoredRef.current = true;
    if (!draft) return;
    const sanitized = sanitizeDraftValues(config.fields, draft.values, includeSignatures);
    form.reset({ ...buildDefaultValues(config.fields), ...sanitized });
    setRestoreGeneration((generation) => generation + 1);
    if (draft.step !== undefined) {
      draftStepRef.current = draft.step;
      setRestoredStep(draft.step);
    }
    // Restore-once semantics: only a new storage identity re-restores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  // Timer lives in a ref so clear() can cancel a pending save — otherwise a
  // type-then-submit within the debounce window resurrects the draft right
  // after the clean submit cleared it.
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!draftId) return;
    // watch(callback) inside an effect is the documented subscription form —
    // nothing memoizable flows to the UI from here, the compiler skip is fine.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = form.watch((values) => {
      clearTimeout(draftSaveTimerRef.current);
      draftSaveTimerRef.current = setTimeout(() => {
        draftSaveTimerRef.current = undefined;
        saveDraft(
          draftId,
          draftHash,
          sanitizeDraftValues(config.fields, values as FormValues, includeSignatures),
          draftStepRef.current,
        );
      }, draftDebounceMs);
    });
    return () => {
      subscription.unsubscribe();
      // Flush instead of drop: if a teardown catches a pending save (dep
      // change or unmount), persist now rather than lose the last change.
      if (draftSaveTimerRef.current !== undefined) {
        clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = undefined;
        saveDraft(
          draftId,
          draftHash,
          sanitizeDraftValues(config.fields, form.getValues(), includeSignatures),
          draftStepRef.current,
        );
      }
    };
  }, [draftId, draftHash, config, form, draftDebounceMs, includeSignatures]);

  const noteStep = useCallback(
    (step: number) => {
      if (!draftId || !draftRestoredRef.current) return;
      draftStepRef.current = step;
      // Step-only navigation is only worth persisting once a draft exists —
      // otherwise every pristine visit writes a pointless entry.
      if (hasDraft(draftId)) {
        saveDraft(
          draftId,
          draftHash,
          sanitizeDraftValues(config.fields, form.getValues(), includeSignatures),
          step,
        );
      }
    },
    [draftId, draftHash, config, form, includeSignatures],
  );

  const clearDraftAndPending = useCallback(() => {
    if (!draftId) return;
    // Cancel any armed save first — clearing then saving would resurrect it.
    clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = undefined;
    clearDraft(draftId);
  }, [draftId]);

  const draft = useMemo<FormDraft | undefined>(
    () => (draftId ? { restoredStep, clear: clearDraftAndPending, noteStep } : undefined),
    [draftId, restoredStep, clearDraftAndPending, noteStep],
  );

  return { form, schema, messages, draft, restoreGeneration };
}
