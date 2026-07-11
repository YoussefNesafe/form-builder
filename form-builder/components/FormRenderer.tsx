"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import type { Messages } from "../core/messages";
import { applyServerErrors, type ServerErrorResult } from "../core/serverErrors";
import { isBuiltInField, type FormConfig, type FormValues } from "../core/types";
import { toZodSchema } from "../core/validation";
import { useDynamicForm } from "../hooks/useDynamicForm";
import { useOtpController, type OtpController } from "../hooks/useOtpController";
import { FieldRuntimeContext, type FormLocale } from "./FieldRuntime";
import { FormStepper } from "./FormStepper";
import { renderField } from "./renderField";
import { FLAT_GRID_CLASS } from "../ui/layout";

type FormRendererProps = {
  config: FormConfig;
  // Returning (or resolving) a ServerErrorResult maps API errors onto fields:
  // fieldErrors → setError per field (unknown names fold into the form-level
  // error), formError → the root error slot at the end of the form.
  onSubmit: (values: FormValues) => void | ServerErrorResult | Promise<void | ServerErrorResult>;
  // Convenience wiring: one pair of handlers for every otp field, branched by
  // fieldName. Throwing from send signals failure to the field.
  onSendOtp?: (fieldName: string, values: FormValues) => Promise<void>;
  onVerifyOtp?: (fieldName: string, code: string) => Promise<boolean>;
  // Advanced wiring: bring your own controller (per-field handler map via
  // useOtpController). Takes precedence over onSendOtp/onVerifyOtp.
  otp?: OtpController;
  messages?: Partial<Messages>;
  locale?: FormLocale;
  className?: string;
};

export function FormRenderer({
  config,
  onSubmit,
  onSendOtp,
  onVerifyOtp,
  otp: otpProp,
  messages,
  locale,
  className,
}: FormRendererProps) {
  const legacyFallback = useMemo(
    () => (onSendOtp || onVerifyOtp ? { send: onSendOtp, verify: onVerifyOtp } : undefined),
    [onSendOtp, onVerifyOtp],
  );
  // Called unconditionally (rules of hooks); inert when an external
  // controller is supplied or no legacy handlers exist.
  const internalController = useOtpController({ fallback: legacyFallback });
  const controller = otpProp ?? internalController;
  if (otpProp && legacyFallback && process.env.NODE_ENV !== "production") {
    console.warn(
      "FormRenderer: both an otp controller and onSendOtp/onVerifyOtp were supplied — the controller wins. Choose one wiring per mount; switching mid-session drops verified state.",
    );
  }

  const { form, messages: mergedMessages } = useDynamicForm(config, {
    messages,
    // Without a verify capability the checker would block every otp field.
    otpVerified: controller.hasVerify ? controller.otpVerified : undefined,
  });

  // Standalone per-field validity, independent of form error state — lets a
  // field gate its own behavior on a sibling (otp dependsOn).
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
    }),
    [mergedMessages, controller.otp, controller.verifiedFields, isFieldValid, locale],
  );

  const [formError, setFormError] = useState<string | null>(null);
  // FormStepper registers a fieldName → step jump here, so a server error on
  // another step's field can bring its step into view.
  const stepJumpRef = useRef<((fieldName: string) => void) | null>(null);

  // handleSubmit is invoked inside the event (not during render) so the
  // step-jump ref is only read post-render.
  const submitHandler = (event: React.FormEvent<HTMLFormElement>) =>
    form.handleSubmit(async (values) => {
      setFormError(null);
      const result = await onSubmit(values);
      if (!result || (!result.fieldErrors && !result.formError)) return;
      const outcome = applyServerErrors(form.setError, result, config.fields);
      if (outcome.formError) setFormError(outcome.formError);
      const first = outcome.applied[0];
      if (first !== undefined) {
        stepJumpRef.current?.(first);
        // After a step jump the field mounts on the next paint; setFocus on
        // an unmounted field is a no-op, so defer one tick either way.
        setTimeout(() => form.setFocus(first), 0);
      }
    })(event);

  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={runtime}>
        <form onSubmit={submitHandler} className={className} noValidate>
          {config.steps?.length ? (
            <FormStepper config={config} stepJumpRef={stepJumpRef} />
          ) : (
            <div className={FLAT_GRID_CLASS}>{config.fields.map(renderField)}</div>
          )}
          {formError && (
            <p
              role="alert"
              className="mt-[16px] tablet:mt-[16px] desktop:mt-[16px] text-[14px] tablet:text-[14px] desktop:text-[14px] font-normal text-destructive"
            >
              {formError}
            </p>
          )}
        </form>
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}
