"use client";

import { useMemo } from "react";
import { FormProvider } from "react-hook-form";
import type { Messages } from "../core/messages";
import type { FormConfig, FormValues } from "../core/types";
import { useDynamicForm } from "../hooks/useDynamicForm";
import { FieldRuntimeContext } from "./FieldRuntime";
import { FormStepper } from "./FormStepper";
import { renderField } from "./renderField";

type FormRendererProps = {
  config: FormConfig;
  onSubmit: (values: FormValues) => void | Promise<void>;
  messages?: Partial<Messages>;
  className?: string;
};

export function FormRenderer({ config, onSubmit, messages, className }: FormRendererProps) {
  const { form, messages: mergedMessages } = useDynamicForm(config, { messages });
  const runtime = useMemo(() => ({ disabled: false, messages: mergedMessages }), [mergedMessages]);

  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={runtime}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={className} noValidate>
          {config.steps?.length ? (
            <FormStepper config={config} />
          ) : (
            // shadow-none on descendants: flat bordered controls; rings
            // (focus/error/valid) use separate ring vars and survive.
            <div className="grid grid-cols-4 gap-4 [&_*]:shadow-none">{config.fields.map(renderField)}</div>
          )}
        </form>
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}
