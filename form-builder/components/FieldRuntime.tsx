"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { conditionMatches } from "../core/conditions";
import { defaultMessages, type Messages } from "../core/messages";
import type { FieldConfig } from "../core/types";

type FieldRuntime = { disabled: boolean; messages: Messages };

export const FieldRuntimeContext = createContext<FieldRuntime>({
  disabled: false,
  messages: defaultMessages,
});

export function useFieldRuntime() {
  return useContext(FieldRuntimeContext);
}

export function useFieldDisabled(config: FieldConfig): boolean {
  const runtime = useFieldRuntime();
  return !!config.disabled || runtime.disabled;
}

export function FieldGate({ field, children }: { field: FieldConfig; children: ReactNode }) {
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
    <FieldRuntimeContext.Provider value={{ disabled, messages: runtime.messages }}>
      {children}
    </FieldRuntimeContext.Provider>
  );
}
