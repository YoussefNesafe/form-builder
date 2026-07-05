"use client";

import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getVisibleFields } from "../core/conditions";
import { mergeMessages, type Messages } from "../core/messages";
import { validateFormConfig } from "../core/schema";
import { buildFieldsSchema, buildFormSchema } from "../core/validation";
import type { FieldConfig, FormConfig, FormValues } from "../core/types";

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
      return { value: "" };
    case "checkbox":
      return { value: field.options?.length ? [] : false };
    case "switch":
      return { value: false };
    case "select":
      return { value: field.multiple ? [] : undefined };
    case "radio":
    case "number":
    case "date":
    case "file":
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

export function buildDefaultValues(fields: FieldConfig[]): FormValues {
  const defaults: FormValues = {};
  for (const field of fields) {
    const entry = defaultValueFor(field);
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
function conditionAwareResolver(config: FormConfig, messages: Messages): Resolver<FormValues> {
  return (values, context, options) => {
    const visibleSchema = buildFieldsSchema(getVisibleFields(config.fields, values), messages);
    return zodResolver(visibleSchema)(values, context, options);
  };
}

export function useDynamicForm(config: FormConfig, opts?: { messages?: Partial<Messages> }) {
  const messages = useMemo(() => mergeMessages(opts?.messages), [opts?.messages]);
  const schema = useMemo(() => {
    validateFormConfig(config);
    return buildFormSchema(config, messages);
  }, [config, messages]);
  const resolver = useMemo(() => conditionAwareResolver(config, messages), [config, messages]);
  const defaultValues = useMemo(() => buildDefaultValues(config.fields), [config]);

  const form = useForm<FormValues>({ resolver, defaultValues });

  return { form, schema, messages };
}
