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

const DEFAULT_DRAFT_DEBOUNCE_MS = 500;

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
  restoredStep?: number;
  clear: () => void;
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

  const form = useForm<FormValues>({ resolver, defaultValues, mode: "onTouched" });

  const crossPairs = useMemo(() => collectCrossRulePairs(config.fields), [config]);
  const crossSourceNames = useMemo(() => [...new Set(crossPairs.map((pair) => pair.source))], [crossPairs]);
  const crossSourceValues = useWatch({
    control: form.control,
    name: crossSourceNames,
    disabled: crossSourceNames.length === 0,
  });
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

  const autosave = opts?.autosave;
  const draftId = autosave ? (autosave.key ?? config.id) : null;
  const draftDebounceMs = autosave?.debounceMs ?? DEFAULT_DRAFT_DEBOUNCE_MS;
  const includeSignatures = autosave?.includeSignatures ?? false;
  const draftHash = useMemo(() => (draftId !== null ? draftConfigHash(config.fields) : ""), [draftId, config]);
  const [restoredStep, setRestoredStep] = useState<number | undefined>(undefined);
  const [restoreGeneration, setRestoreGeneration] = useState(0);
  const draftStepRef = useRef<number | undefined>(undefined);
  const draftRestoredRef = useRef(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!draftId) return;
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
