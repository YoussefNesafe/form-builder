"use client";

import { FormProvider } from "react-hook-form";
import { cn } from "@/lib/utils";
import { getField } from "../core/registry";
import type { Messages } from "../core/messages";
import type { FieldConfig, FormConfig, FormValues } from "../core/types";
import { useDynamicForm } from "../hooks/useDynamicForm";
import { FieldGate, FieldRuntimeContext } from "./FieldRuntime";

type FormRendererProps = {
  config: FormConfig;
  onSubmit: (values: FormValues) => void | Promise<void>;
  messages?: Partial<Messages>;
  className?: string;
};

// Static strings — Tailwind cannot see dynamically built class names.
const colSpanClass: Record<NonNullable<FieldConfig["colSpan"]>, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
};

export function renderField(field: FieldConfig) {
  const Component = getField(field.type);

  if (!Component) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div key={field.name} className="col-span-4 border border-destructive p-2 text-destructive">
        Unknown field type &quot;{field.type}&quot;
      </div>
    );
  }

  return (
    <div key={field.name} className={colSpanClass[field.colSpan ?? 4]}>
      <FieldGate field={field}>
        <Component field={field} />
      </FieldGate>
    </div>
  );
}

export function FormRenderer({ config, onSubmit, messages, className }: FormRendererProps) {
  const { form, messages: mergedMessages } = useDynamicForm(config, { messages });

  // config.steps delegates to FormStepper in phase 7; single-page until then.
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: mergedMessages }}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={className} noValidate>
          <div className="grid grid-cols-4 gap-4">{config.fields.map(renderField)}</div>
        </form>
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}
