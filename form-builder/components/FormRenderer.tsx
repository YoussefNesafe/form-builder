"use client";

import { useCallback, useMemo } from "react";
import { FormProvider } from "react-hook-form";
import type { Messages } from "../core/messages";
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
  onSubmit: (values: FormValues) => void | Promise<void>;
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

  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={runtime}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={className} noValidate>
          {config.steps?.length ? (
            <FormStepper config={config} />
          ) : (
            <div className={FLAT_GRID_CLASS}>{config.fields.map(renderField)}</div>
          )}
        </form>
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}
