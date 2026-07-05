"use client";

import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useStore } from "zustand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FormConfig } from "../core/types";
import { createStepperStore } from "../store/stepper";
import { useFieldRuntime } from "./FieldRuntime";
import { renderField } from "./renderField";

export function FormStepper({ config }: { config: FormConfig }) {
  const steps = config.steps ?? [];
  const form = useFormContext();
  const { messages } = useFieldRuntime();
  const [store] = useState(() => createStepperStore(steps.length));
  const step = useStore(store, (state) => state.step);

  const fieldsByName = useMemo(
    () => new Map(config.fields.map((field) => [field.name, field])),
    [config],
  );

  if (!steps.length) return null;

  const currentFields = steps[step].fieldNames
    .map((name) => fieldsByName.get(name))
    .filter((field) => field !== undefined);
  // Hidden fields carry values via defaults regardless of step; render them
  // always so nothing depends on which step lists them.
  const hiddenFields = config.fields.filter((field) => field.type === "hidden");
  const submitField = config.fields.find((field) => field.type === "submit");
  const isLast = step === steps.length - 1;

  const handleNext = async () => {
    // Gate on trigger(), never formState.isValid — the condition-aware
    // resolver computes isValid across ALL steps.
    const valid = await form.trigger(steps[step].fieldNames);
    if (valid) store.getState().next();
  };

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex items-center gap-4">
        {steps.map((s, index) => (
          <li
            key={index}
            aria-current={index === step ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-sm",
              index === step ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border text-xs",
                index === step && "border-primary bg-primary text-primary-foreground",
                index < step && "border-primary text-primary",
              )}
            >
              {index + 1}
            </span>
            {s.title}
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-4 gap-4 [&_*]:shadow-none [&_*]:[--tw-ring-shadow:0_0_#0000]!">
        {currentFields.map(renderField)}
        {hiddenFields.map(renderField)}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => store.getState().prev()}>
          {messages.back}
        </Button>
        {isLast ? (
          submitField ? (
            renderField(submitField)
          ) : (
            <Button type="submit">{messages.submit}</Button>
          )
        ) : (
          <Button type="button" onClick={handleNext}>
            {messages.next}
          </Button>
        )}
      </div>
    </div>
  );
}
