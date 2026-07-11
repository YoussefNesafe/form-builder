"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useStore } from "zustand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FormConfig } from "../core/types";
import { createStepperStore } from "../store/stepper";
import { FLAT_GRID_CLASS } from "../ui/layout";
import { useFieldRuntime } from "./FieldRuntime";
import { renderField } from "./renderField";

export function FormStepper({
  config,
  stepJumpRef,
}: {
  config: FormConfig;
  // FormRenderer-owned slot: jump to the step containing a field (server
  // errors land on fields the current step may not show).
  stepJumpRef?: React.MutableRefObject<((fieldName: string) => void) | null>;
}) {
  const steps = useMemo(() => config.steps ?? [], [config.steps]);
  const form = useFormContext();
  const { messages } = useFieldRuntime();
  const [store] = useState(() => createStepperStore(steps.length));
  const step = useStore(store, (state) => state.step);

  useEffect(() => {
    if (!stepJumpRef) return;
    stepJumpRef.current = (fieldName) => {
      // Group rows come in as "team.0.role"; steps list root names only.
      const root = fieldName.split(".")[0];
      const index = steps.findIndex((s) => s.fieldNames.includes(root));
      if (index >= 0) store.getState().goTo(index);
    };
    return () => {
      stepJumpRef.current = null;
    };
  }, [stepJumpRef, steps, store]);

  // Focus the step list on navigation so keyboard/SR users land at the new
  // step instead of staying on the Next/Back button.
  const stepListRef = useRef<HTMLOListElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    stepListRef.current?.focus();
  }, [step]);

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
    if (valid) {
      store.getState().next();
      return;
    }
    // Move focus to the first field that failed so the error is announced.
    // getFieldState reads live state — formState from render is a stale
    // snapshot inside this handler.
    const firstInvalid = steps[step].fieldNames.find((name) => form.getFieldState(name).invalid);
    if (firstInvalid) form.setFocus(firstInvalid);
  };

  return (
    <div className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px]">
      <ol
        ref={stepListRef}
        tabIndex={-1}
        aria-label={messages.steps}
        className="flex items-center gap-[16px] tablet:gap-[16px] desktop:gap-[16px] outline-none"
      >
        {steps.map((s, index) => (
          <li
            key={index}
            aria-current={index === step ? "step" : undefined}
            className={cn(
              "flex items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] text-[14px] tablet:text-[14px] desktop:text-[14px]",
              index === step ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-[24px] tablet:size-[24px] desktop:size-[24px] items-center justify-center rounded-full border text-[12px] tablet:text-[12px] desktop:text-[12px]",
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

      <div className={FLAT_GRID_CLASS}>
        {currentFields.map(renderField)}
        {hiddenFields.map(renderField)}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => store.getState().prev()}>
          {messages.back}
        </Button>
        {isLast ? (
          // Fallback submit reuses SubmitField so validity gating never
          // diverges between the two render paths.
          renderField(submitField ?? { type: "submit", name: "__submit", text: messages.submit })
        ) : (
          <Button type="button" onClick={handleNext}>
            {messages.next}
          </Button>
        )}
      </div>
    </div>
  );
}
