"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import type { Messages } from "../core/messages";
import { isBuiltInField, type FormConfig, type FormValues } from "../core/types";
import { toZodSchema } from "../core/validation";
import { useDynamicForm } from "../hooks/useDynamicForm";
import { FieldRuntimeContext, type OtpRuntime } from "./FieldRuntime";
import { FormStepper } from "./FormStepper";
import { renderField } from "./renderField";

type FormRendererProps = {
  config: FormConfig;
  onSubmit: (values: FormValues) => void | Promise<void>;
  // Throwing signals send failure to the field.
  onSendOtp?: (fieldName: string, values: FormValues) => Promise<void>;
  onVerifyOtp?: (fieldName: string, code: string) => Promise<boolean>;
  messages?: Partial<Messages>;
  className?: string;
};

export function FormRenderer({
  config,
  onSubmit,
  onSendOtp,
  onVerifyOtp,
  messages,
  className,
}: FormRendererProps) {
  // Codes accepted by onVerifyOtp, keyed by field name. Validation compares
  // the current value against this, so editing a verified code re-invalidates.
  // dep snapshots what the code was verified for (stale-dependency detection
  // across unmounts).
  const verifiedCodes = useRef(new Map<string, { code: string; dep: unknown }>());
  // State mirror of the registry keys: enabledWhenVerified gating must
  // re-render when verification lands, which a ref alone cannot trigger.
  const [verifiedFields, setVerifiedFields] = useState<ReadonlySet<string>>(new Set());
  const otpVerified = useCallback(
    (fieldName: string, code: string) => verifiedCodes.current.get(fieldName)?.code === code,
    [],
  );

  const { form, messages: mergedMessages } = useDynamicForm(config, {
    messages,
    otpVerified: onVerifyOtp ? otpVerified : undefined,
  });

  const otp = useMemo<OtpRuntime | undefined>(() => {
    if (!onSendOtp && !onVerifyOtp) return undefined;
    return {
      send: onSendOtp ? (fieldName) => onSendOtp(fieldName, form.getValues()) : undefined,
      verify: onVerifyOtp
        ? async (fieldName, code, depValue) => {
            const ok = await onVerifyOtp(fieldName, code);
            if (ok) {
              verifiedCodes.current.set(fieldName, { code, dep: depValue });
              setVerifiedFields((prev) => new Set(prev).add(fieldName));
            }
            return ok;
          }
        : undefined,
      isVerifiedFor: (fieldName, depValue) => {
        const entry = verifiedCodes.current.get(fieldName);
        return !entry || Object.is(entry.dep, depValue);
      },
      invalidate: (fieldName) => {
        verifiedCodes.current.delete(fieldName);
        setVerifiedFields((prev) => {
          if (!prev.has(fieldName)) return prev;
          const next = new Set(prev);
          next.delete(fieldName);
          return next;
        });
      },
    };
  }, [onSendOtp, onVerifyOtp, form]);

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
    () => ({ disabled: false, messages: mergedMessages, otp, isFieldValid, verifiedFields }),
    [mergedMessages, otp, isFieldValid, verifiedFields],
  );

  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={runtime}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={className} noValidate>
          {config.steps?.length ? (
            <FormStepper config={config} />
          ) : (
            // Flat controls: no shadows, no ring halos — states communicate
            // via border color only. Important var override outbeats
            // focus-visible ring utilities.
            <div className="grid grid-cols-4 gap-4 [&_*]:shadow-none [&_*]:[--tw-ring-shadow:0_0_#0000]!">
              {config.fields.map(renderField)}
            </div>
          )}
        </form>
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}
