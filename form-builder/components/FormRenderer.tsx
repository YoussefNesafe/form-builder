"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import type { AutosaveOptions } from "../core/autosave";
import type { InferValues } from "../core/inferValues";
import type { Messages } from "../core/messages";
import { hiddenStepFieldNames } from "../core/conditions";
import { applyServerErrors, type ServerErrorResult } from "../core/serverErrors";
import { isBuiltInField, type FormConfig, type FormValues } from "../core/types";
import { toZodSchema } from "../core/validation";
import { useDynamicForm } from "../hooks/useDynamicForm";
import { useOtpController, type OtpController } from "../hooks/useOtpController";
import { FieldRuntimeContext, type FormLocale } from "./FieldRuntime";
import type { ReviewFormatters } from "./reviewValue";
import { FormStepper, type StepperOrientation } from "./FormStepper";
import { renderField } from "./renderField";
import { FLAT_GRID_CLASS } from "../ui/layout";

type FormRendererProps<C extends FormConfig = FormConfig> = {
  config: C;
  onSubmit: (values: InferValues<C>) => void | ServerErrorResult | Promise<void | ServerErrorResult>;
  onSendOtp?: (fieldName: string, values: FormValues) => Promise<void>;
  onVerifyOtp?: (fieldName: string, code: string) => Promise<boolean>;
  otp?: OtpController;
  messages?: Partial<Messages>;
  locale?: FormLocale;
  className?: string;
  autosave?: AutosaveOptions;
  reviewFormatters?: ReviewFormatters;
  /**
   * The wizard step to show, by index into `config.steps`. Ignored when the
   * config has no `steps`.
   *
   * **This shares the step, it does not own it.** Unlike a controlled `<input
   * value>`, the wizard still moves on its own: Next advances after its own
   * validation gate passes, a step hiding under the user bounces to the nearest
   * visible one, and a server field error jumps to that field's step. Setting
   * `step` asks the wizard to go somewhere; the wizard goes there and then
   * reports through `onStepChange` wherever it actually ended up. A host that
   * ignores `onStepChange` still gets a working wizard — its own `step` value
   * just goes stale.
   *
   * The request is not honoured literally in two cases, and `onStepChange`
   * fires with the real index in both: an out-of-range index is clamped into
   * `[0, steps.length - 1]`, and an index whose step is hidden by `visibleWhen`
   * redirects to the nearest visible step (the next one, else the previous).
   *
   * If autosave restores a draft that recorded a different step, the restored
   * step wins on mount and is reported — so a router-backed host navigates to
   * where the visitor left off rather than fighting it.
   */
  step?: number;
  /**
   * Called with the step index whenever the wizard lands on a step the caller
   * is not already on. It deliberately does NOT fire for the step the wizard
   * mounts on, nor for a step reached because you passed it as `step` — so
   * `onStepChange={(s) => router.push(routes[s])}` is safe to write literally,
   * with no redundant navigation on load and no echo of your own `step` back.
   *
   * It DOES fire for a step the wizard chose itself: Next/Back, a review-step
   * Edit button, a server-error jump, a hidden-step bounce, and the clamping
   * and redirect cases described on `step`.
   */
  onStepChange?: (step: number) => void;
  /**
   * Lays the step list out along the top (`"horizontal"`, the default) or down
   * the side as a left rail (`"vertical"`). The rail only sits beside the
   * fields from the tablet breakpoint up; narrower than that it stacks, as
   * horizontal does. The list markup — `<ol>`/`<li>`, its accessible name,
   * `aria-current="step"`, and the focus move on step change — is identical in
   * both; only layout classes and a `data-orientation` styling hook differ.
   * Ignored when the config has no `steps`.
   */
  stepperOrientation?: StepperOrientation;
  /**
   * Called once each time autosave restores a draft into the form, after the
   * values have been applied. Use it to tell the visitor their progress came
   * back.
   *
   * Fires only when `autosave` is configured AND a stored draft was found AND
   * its config hash still matches the current `config.fields`. It therefore
   * does NOT fire on a fresh form, when nothing is stored, when the stored
   * draft is discarded as stale after a config change, or when storage is
   * unavailable (SSR, or a throwing store). Within one mount it fires again
   * only if the draft key changes (`autosave.key`, or `config.id` when no key
   * is given) and a draft exists under the new key.
   *
   * `step` is the step index recorded in the draft just restored, or
   * `undefined` if that draft recorded none — a non-wizard form, or a wizard
   * the visitor never advanced past the first step of.
   */
  onDraftRestore?: (info: { step?: number }) => void;
};

export function FormRenderer<C extends FormConfig = FormConfig>({
  config,
  onSubmit,
  onSendOtp,
  onVerifyOtp,
  otp: otpProp,
  messages,
  locale,
  className,
  autosave,
  reviewFormatters,
  step,
  onStepChange,
  stepperOrientation,
  onDraftRestore,
}: FormRendererProps<C>) {
  const legacyFallback = useMemo(
    () => (onSendOtp || onVerifyOtp ? { send: onSendOtp, verify: onVerifyOtp } : undefined),
    [onSendOtp, onVerifyOtp],
  );
  const internalController = useOtpController({ fallback: legacyFallback });
  const controller = otpProp ?? internalController;
  if (otpProp && legacyFallback && process.env.NODE_ENV !== "production") {
    console.warn(
      "FormRenderer: both an otp controller and onSendOtp/onVerifyOtp were supplied — the controller wins. Choose one wiring per mount; switching mid-session drops verified state.",
    );
  }

  const { form, messages: mergedMessages, draft, restoreGeneration } = useDynamicForm(config, {
    messages,
    otpVerified: controller.hasVerify ? controller.otpVerified : undefined,
    autosave,
  });

  const fieldSchemas = useMemo(() => {
    const schemas = new Map<string, ReturnType<typeof toZodSchema>>();
    for (const field of config.fields) {
      if (isBuiltInField(field)) schemas.set(field.name, toZodSchema(field, mergedMessages));
    }
    return schemas;
  }, [config, mergedMessages]);
  const isFieldValid = useCallback(
    (fieldName: string, value: unknown) => {
      const schema = fieldSchemas.get(fieldName);
      return schema ? schema.safeParse(value).success : true;
    },
    [fieldSchemas],
  );

  const runtime = useMemo(
    () => ({
      disabled: false,
      messages: mergedMessages,
      otp: controller.otp,
      isFieldValid,
      verifiedFields: controller.verifiedFields,
      locale,
      restoreGeneration,
      reviewFormatters,
    }),
    [mergedMessages, controller.otp, controller.verifiedFields, isFieldValid, locale, restoreGeneration, reviewFormatters],
  );

  const [formError, setFormError] = useState<string | null>(null);
  const stepJumpRef = useRef<((fieldName: string) => void) | null>(null);

  // Autosave's own step bookkeeping runs first and unconditionally: a consumer
  // supplying onStepChange must not cost the draft its resume point.
  const noteStep = draft?.noteStep;
  const handleStepChange = useCallback(
    (next: number) => {
      noteStep?.(next);
      onStepChange?.(next);
    },
    [noteStep, onStepChange],
  );

  // restoreGeneration only ever increments, and only on a draft that was
  // actually loaded — so comparing against the last one we announced fires the
  // callback exactly once per restore and never on a fresh form (both start 0).
  // restoredStep is set in the same batched update, so it is already the newly
  // restored draft's step by the time this runs.
  const restoredStep = draft?.restoredStep;
  const announcedRestoreRef = useRef(restoreGeneration);
  useEffect(() => {
    if (announcedRestoreRef.current === restoreGeneration) return;
    announcedRestoreRef.current = restoreGeneration;
    onDraftRestore?.({ step: restoredStep });
  }, [restoreGeneration, restoredStep, onDraftRestore]);

  const submitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    setFormError(null);
    return form.handleSubmit(async (values) => {
      const result = await onSubmit(values as InferValues<C>);
      if (!result || (!result.fieldErrors && !result.formError)) {
        draft?.clear();
        return;
      }
      const outcome = applyServerErrors(form.setError, result, config.fields);
      if (outcome.formError) setFormError(outcome.formError);
      const first = outcome.applied[0];
      const stepHidden = hiddenStepFieldNames(config, values).has(first?.split(".")[0] ?? "");
      if (first !== undefined && !stepHidden) {
        stepJumpRef.current?.(first);
        setTimeout(() => form.setFocus(first), 0);
      }
    })(event);
  };

  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={runtime}>
        <form onSubmit={submitHandler} className={className} noValidate>
          {config.steps?.length ? (
            <FormStepper
              config={config}
              stepJumpRef={stepJumpRef}
              initialStep={restoredStep}
              controlledStep={step}
              orientation={stepperOrientation}
              onStepChange={handleStepChange}
            />
          ) : (
            <div className={FLAT_GRID_CLASS}>{config.fields.map(renderField)}</div>
          )}
          {formError && (
            <p
              role="alert"
              className="mt-[var(--fb-space-8,4.272vw)] tablet:mt-[var(--fb-space-8-tablet,2vw)] desktop:mt-[var(--fb-space-8-desktop,0.832vw)] text-[var(--fb-space-7,3.738vw)] tablet:text-[var(--fb-space-7-tablet,1.75vw)] desktop:text-[var(--fb-space-7-desktop,0.728vw)] font-normal text-destructive"
            >
              {formError}
            </p>
          )}
        </form>
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}
