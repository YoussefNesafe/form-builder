"use client";

import { createContext, useContext } from "react";

export const FieldRuntimeContext = createContext<{ disabled: boolean }>({ disabled: false });

export function useFieldRuntime() {
  return useContext(FieldRuntimeContext);
}
