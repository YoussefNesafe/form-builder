"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
import { FormStepper } from "./FormStepper";
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
              initialStep={draft?.restoredStep}
              onStepChange={draft?.noteStep}
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
