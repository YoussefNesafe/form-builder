"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { conditionFieldNames, conditionSpecMatches } from "../core/conditions";
import { useCopyFromSync } from "../hooks/useSourceSync";
import { defaultMessages, type Messages } from "../core/messages";
import type { AnyFieldConfig, FormValues } from "../core/types";

export type OtpRuntime = {
  send?: (fieldName: string, values: FormValues) => Promise<void>;
  verify?: (fieldName: string, code: string, depValue?: unknown) => Promise<boolean>;
  invalidate?: (fieldName: string) => void;
  isVerifiedFor?: (fieldName: string, depValue: unknown) => boolean;
};

export type FormLocale = {
  dateFns?: import("date-fns").Locale;
  countryLabels?: Record<string, string>;
};

type FieldRuntime = {
  disabled: boolean;
  messages: Messages;
  otp?: OtpRuntime;
  isFieldValid?: (fieldName: string, value: unknown) => boolean;
  verifiedFields?: ReadonlySet<string>;
  locale?: FormLocale;
  restoreGeneration?: number;
  reviewFormatters?: import("./reviewValue").ReviewFormatters;
};

export const FieldRuntimeContext = createContext<FieldRuntime>({
  disabled: false,
  messages: defaultMessages,
});

export function useFieldRuntime() {
  return useContext(FieldRuntimeContext);
}

export function useFieldDisabled(config: AnyFieldConfig): boolean {
  const runtime = useFieldRuntime();
  return !!config.disabled || runtime.disabled;
}

export function FieldGate({ field, children }: { field: AnyFieldConfig; children: ReactNode }) {
  const { control } = useFormContext();
  const runtime = useFieldRuntime();
  useCopyFromSync(field);

  const watchNames = useMemo(
    () => [
      ...new Set([
        ...conditionFieldNames(field.visibleWhen),
        ...conditionFieldNames(field.disabledWhen),
        ...conditionFieldNames(field.enabledWhen),
      ]),
    ],
    [field.visibleWhen, field.disabledWhen, field.enabledWhen],
  );
  const watched = useWatch({ control, name: watchNames, disabled: watchNames.length === 0 });
  const valueOf = (name: string) => watched?.[watchNames.indexOf(name)];

  const visible = conditionSpecMatches(field.visibleWhen, valueOf);
  const disabled =
    runtime.disabled ||
    !!field.disabled ||
    (!!field.disabledWhen && conditionSpecMatches(field.disabledWhen, valueOf, runtime.isFieldValid)) ||
    (!!field.enabledWhen && !conditionSpecMatches(field.enabledWhen, valueOf, runtime.isFieldValid)) ||
    (!!field.enabledWhenVerified && !runtime.verifiedFields?.has(field.enabledWhenVerified));

  if (!visible) return null;

  return (
    <FieldRuntimeContext.Provider value={{ ...runtime, disabled }}>
      {children}
    </FieldRuntimeContext.Provider>
  );
}
