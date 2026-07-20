"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useStore } from "zustand";
import { Button } from "@/components/ui/button";
import { cn } from "../internal/cn";
import { conditionFieldNames, conditionSpecMatches } from "../core/conditions";
import type { FormConfig } from "../core/types";
import { createStepperStore } from "../store/stepper";
import { FLAT_GRID_CLASS } from "../ui/layout";
import { useFieldRuntime } from "./FieldRuntime";
import { renderField } from "./renderField";
import { ReviewStep } from "./ReviewStep";

function nearestVisible(step: number, visibleIndices: number[]): number | undefined {
  return (
    visibleIndices.find((index) => index > step) ??
    [...visibleIndices].reverse().find((index) => index < step)
  );
}

export function FormStepper({
  config,
  stepJumpRef,
  initialStep,
  onStepChange,
}: {
  config: FormConfig;
  stepJumpRef?: React.MutableRefObject<((fieldName: string) => void) | null>;
  initialStep?: number;
  onStepChange?: (step: number) => void;
}) {
  const steps = useMemo(() => config.steps ?? [], [config.steps]);
  const form = useFormContext();
  const { messages } = useFieldRuntime();
  const [store] = useState(() => createStepperStore(steps.length));
  const step = useStore(store, (state) => state.step);

  const stepConditionNames = useMemo(
    () => [...new Set(steps.flatMap((s) => conditionFieldNames(s.visibleWhen)))],
    [steps],
  );
  const stepConditionValues = useWatch({
    control: form.control,
    name: stepConditionNames,
    disabled: stepConditionNames.length === 0,
  });
  const stepValueOf = (name: string) => stepConditionValues?.[stepConditionNames.indexOf(name)];
  const visibleIndices = steps
    .map((s, index) => (conditionSpecMatches(s.visibleWhen, stepValueOf) ? index : -1))
    .filter((index) => index >= 0);

  const currentHidden = steps.length > 0 && !visibleIndices.includes(step);
  useEffect(() => {
    if (!currentHidden || visibleIndices.length === 0) return;
    const fallback = nearestVisible(step, visibleIndices);
    if (fallback !== undefined) store.getState().goTo(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHidden, step, store]);

  useEffect(() => {
    if (initialStep !== undefined) store.getState().goTo(initialStep);
  }, [initialStep, store]);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (!stepJumpRef) return;
    stepJumpRef.current = (fieldName) => {
      const root = fieldName.split(".")[0];
      const index = steps.findIndex((s) => (s.fieldNames ?? []).includes(root));
      if (index >= 0) store.getState().goTo(index);
    };
    return () => {
      stepJumpRef.current = null;
    };
  }, [stepJumpRef, steps, store]);

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
  if (visibleIndices.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("form-builder: every wizard step is hidden by its visibleWhen — nothing to render");
    }
    return null;
  }
  const effectiveStep = visibleIndices.includes(step)
    ? step
    : (nearestVisible(step, visibleIndices) ?? visibleIndices[0]);

  const currentStep = steps[effectiveStep];
  const currentFieldNames = currentStep.fieldNames ?? [];
  const currentFields = currentFieldNames
    .map((name) => fieldsByName.get(name))
    .filter((field) => field !== undefined);
  const hiddenFields = config.fields.filter((field) => field.type === "hidden");
  const submitField = config.fields.find((field) => field.type === "submit");
  const position = visibleIndices.indexOf(effectiveStep);
  const isLast = position === visibleIndices.length - 1;

  const handleNext = async () => {
    const valid = currentFieldNames.length === 0 ? true : await form.trigger(currentFieldNames);
    if (valid) {
      const next = visibleIndices[position + 1];
      if (next !== undefined) store.getState().goTo(next);
      return;
    }
    const firstInvalid = currentFieldNames.find((name) => form.getFieldState(name).invalid);
    if (firstInvalid) form.setFocus(firstInvalid);
  };

  const handleBack = () => {
    const prev = visibleIndices[position - 1];
    if (prev !== undefined) store.getState().goTo(prev);
  };

  return (
    <div className="flex flex-col gap-[var(--fb-space-12,6.408vw)] tablet:gap-[var(--fb-space-12-tablet,3vw)] desktop:gap-[var(--fb-space-12-desktop,1.248vw)]">
      <ol
        ref={stepListRef}
        tabIndex={-1}
        aria-label={messages.steps}
        className="flex items-center gap-[var(--fb-space-8,4.272vw)] tablet:gap-[var(--fb-space-8-tablet,2vw)] desktop:gap-[var(--fb-space-8-desktop,0.832vw)] outline-none"
      >
        {visibleIndices.map((index, displayIndex) => (
          <li
            key={index}
            aria-current={index === effectiveStep ? "step" : undefined}
            className={cn(
              "flex items-center gap-[var(--fb-space-4,2.136vw)] tablet:gap-[var(--fb-space-4-tablet,1vw)] desktop:gap-[var(--fb-space-4-desktop,0.416vw)] text-[var(--fb-space-7,3.738vw)] tablet:text-[var(--fb-space-7-tablet,1.75vw)] desktop:text-[var(--fb-space-7-desktop,0.728vw)]",
              index === effectiveStep ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-[var(--fb-space-12,6.408vw)] tablet:size-[var(--fb-space-12-tablet,3vw)] desktop:size-[var(--fb-space-12-desktop,1.248vw)] items-center justify-center rounded-full border text-[var(--fb-space-6,3.204vw)] tablet:text-[var(--fb-space-6-tablet,1.5vw)] desktop:text-[var(--fb-space-6-desktop,0.624vw)]",
                index === effectiveStep && "border-primary bg-primary text-primary-foreground",
                displayIndex < position && "border-primary text-primary",
              )}
            >
              {displayIndex + 1}
            </span>
            {steps[index].title}
          </li>
        ))}
      </ol>

      {currentStep.review ? (
        <>
          <ReviewStep
            config={config}
            currentIndex={effectiveStep}
            visibleIndices={visibleIndices}
            goTo={(index) => store.getState().goTo(index)}
          />
          <div className={FLAT_GRID_CLASS}>{hiddenFields.map(renderField)}</div>
        </>
      ) : (
        <div className={FLAT_GRID_CLASS}>
          {currentFields.map(renderField)}
          {hiddenFields.map(renderField)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" disabled={position === 0} onClick={handleBack}>
          {messages.back}
        </Button>
        {isLast ? (
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
