"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { conditionMatches } from "../core/conditions";
import { defaultMessages, type Messages } from "../core/messages";
import type { AnyFieldConfig } from "../core/types";

export type OtpRuntime = {
  send?: (fieldName: string) => Promise<void>;
  // Resolves true when the code is accepted; the host wrapper records it in
  // the verified registry so validation passes.
  verify?: (fieldName: string, code: string) => Promise<boolean>;
  // Drops the registry entry — call when the verified code no longer applies
  // (e.g. its source phone number changed).
  invalidate?: (fieldName: string) => void;
};

type FieldRuntime = {
  disabled: boolean;
  messages: Messages;
  otp?: OtpRuntime;
  isFieldValid?: (fieldName: string, value: unknown) => boolean;
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

  const visibleWatch = useWatch({
    control,
    name: field.visibleWhen?.field ?? "",
    disabled: !field.visibleWhen,
  });
  const disabledWatch = useWatch({
    control,
    name: field.disabledWhen?.field ?? "",
    disabled: !field.disabledWhen,
  });

  const visible = !field.visibleWhen || conditionMatches(field.visibleWhen, visibleWatch);
  // Compose parent disabled: a disabled group must disable its children.
  const disabled =
    runtime.disabled ||
    !!field.disabled ||
    (!!field.disabledWhen && conditionMatches(field.disabledWhen, disabledWatch));

  if (!visible) return null;

  return (
    <FieldRuntimeContext.Provider value={{ ...runtime, disabled }}>
      {children}
    </FieldRuntimeContext.Provider>
  );
}
