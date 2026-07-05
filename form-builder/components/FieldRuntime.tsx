"use client";

import { createContext, useContext } from "react";
import type { FieldConfig } from "../core/types";

export const FieldRuntimeContext = createContext<{ disabled: boolean }>({ disabled: false });

export function useFieldRuntime() {
  return useContext(FieldRuntimeContext);
}

export function useFieldDisabled(config: FieldConfig): boolean {
  const runtime = useFieldRuntime();
  return !!config.disabled || runtime.disabled;
}
