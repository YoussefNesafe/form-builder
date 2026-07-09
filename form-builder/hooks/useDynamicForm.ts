"use client";

import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getVisibleFields } from "../core/conditions";
import { mergeMessages, type Messages } from "../core/messages";
import { validateFormConfig } from "../core/schema";
import { buildFieldsSchema, buildFormSchema, type OtpVerifiedChecker } from "../core/validation";
import { isBuiltInField } from "../core/types";
import type { AnyFieldConfig, FieldConfig, FormConfig, FormValues } from "../core/types";

function defaultValueFor(field: FieldConfig): { value: unknown } | null {
  switch (field.type) {
    case "static":
    case "submit":
      return null;
    case "text":
    case "email":
    case "password":
    case "textarea":
    case "otp":
    case "phone":
    case "time":
      return { value: "" };
    case "checkbox":
      return { value: field.options?.length ? [] : false };
    case "switch":
      return { value: false };
    case "select":
      return { value: field.multiple ? [] : undefined };
    case "radio":
    case "segmented":
    case "number":
    case "date":
    case "file":
    case "rating":
      return { value: undefined };
    case "slider":
      return { value: field.min };
    case "hidden":
      return { value: field.value };
    case "group": {
      const rowCount = field.min ?? 0;
      const row = buildDefaultValues(field.fields);
      return { value: Array.from({ length: rowCount }, () => ({ ...row })) };
    }
  }
}

export function buildDefaultValues(fields: AnyFieldConfig[]): FormValues {
  const defaults: FormValues = {};
  for (const field of fields) {
    // Custom registered types default to undefined unless config says otherwise.
    const entry = isBuiltInField(field) ? defaultValueFor(field) : { value: field.defaultValue };
    if (entry) defaults[field.name] = entry.value;
  }
  return defaults;
}

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
    const visibleSchema = buildFieldsSchema(getVisibleFields(config.fields, values), messages, otpVerified);
    return zodResolver(visibleSchema)(values, context, options);
  };
}

export function useDynamicForm(
  config: FormConfig,
  opts?: { messages?: Partial<Messages>; otpVerified?: OtpVerifiedChecker },
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

  return { form, schema, messages };
}
