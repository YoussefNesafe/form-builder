"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { conditionFieldNames, conditionSpecMatches } from "../core/conditions";
import { defaultMessages, type Messages } from "../core/messages";
import type { AnyFieldConfig, FormValues } from "../core/types";

export type OtpRuntime = {
  // values = current form values at send time, supplied by the field flow —
  // keeps the controller free of any form dependency.
  send?: (fieldName: string, values: FormValues) => Promise<void>;
  // Resolves true when the code is accepted; the host wrapper records it in
  // the verified registry so validation passes. depValue snapshots what the
  // code was verified FOR (e.g. the phone number) so a remounting field can
  // detect that its dependency changed while it was unmounted.
  verify?: (fieldName: string, code: string, depValue?: unknown) => Promise<boolean>;
  // Drops the registry entry — call when the verified code no longer applies
  // (e.g. its source phone number changed).
  invalidate?: (fieldName: string) => void;
  // False when the registry entry was verified against a different depValue.
  isVerifiedFor?: (fieldName: string, depValue: unknown) => boolean;
};

export type FormLocale = {
  // date-fns Locale object — drives calendar month names and date display.
  dateFns?: import("date-fns").Locale;
  // Country display names for the phone field ({ AE: "الإمارات", ... }).
  countryLabels?: Record<string, string>;
};

type FieldRuntime = {
  disabled: boolean;
  messages: Messages;
  otp?: OtpRuntime;
  isFieldValid?: (fieldName: string, value: unknown) => boolean;
  // Names of otp fields whose current code passed verification.
  verifiedFields?: ReadonlySet<string>;
  locale?: FormLocale;
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

  // One subscription for every source field across all three specs; specs
  // read values back out of it by name.
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
  // Compose parent disabled: a disabled group must disable its children.
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
