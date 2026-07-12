"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useStore } from "zustand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { conditionFieldNames, conditionSpecMatches } from "../core/conditions";
import type { FormConfig } from "../core/types";
import { createStepperStore } from "../store/stepper";
import { FLAT_GRID_CLASS } from "../ui/layout";
import { useFieldRuntime } from "./FieldRuntime";
import { renderField } from "./renderField";
import { ReviewStep } from "./ReviewStep";

// Where to land when `step` is not visible: next visible preferred, else
// previous. Shared by the render guard and the fallback effect so the
// transient painted frame shows the SAME step the effect commits to.
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
  // FormRenderer-owned slot: jump to the step containing a field (server
  // errors land on fields the current step may not show).
  stepJumpRef?: React.MutableRefObject<((fieldName: string) => void) | null>;
  // Draft-restored step — arrives once, after the restore effect runs.
  initialStep?: number;
  onStepChange?: (step: number) => void;
}) {
  const steps = useMemo(() => config.steps ?? [], [config.steps]);
  const form = useFormContext();
  const { messages } = useFieldRuntime();
  const [store] = useState(() => createStepperStore(steps.length));
  const step = useStore(store, (state) => state.step);

  // Conditional steps: one subscription over every step-condition source.
  // Store indices stay CONFIG indices; visibility filters display/navigation.
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

  // The current step can become hidden under the user (its condition source
  // changed) — move to the nearest visible step (next preferred, else prev).
  const currentHidden = steps.length > 0 && !visibleIndices.includes(step);
  useEffect(() => {
    if (!currentHidden || visibleIndices.length === 0) return;
    const fallback = nearestVisible(step, visibleIndices);
    if (fallback !== undefined) store.getState().goTo(fallback);
    // visibleIndices is re-derived per render; step/currentHidden carry the signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHidden, step, store]);

  // Draft-restored step: fires when the value arrives (undefined → number);
  // goTo clamps, and the hidden-step effect above resolves an invisible target.
  useEffect(() => {
    if (initialStep !== undefined) store.getState().goTo(initialStep);
  }, [initialStep, store]);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (!stepJumpRef) return;
    stepJumpRef.current = (fieldName) => {
      // Group rows come in as "team.0.role"; steps list root names only.
      const root = fieldName.split(".")[0];
      const index = steps.findIndex((s) => (s.fieldNames ?? []).includes(root));
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
  if (visibleIndices.length === 0) {
    // Every step hidden — nothing to render; almost certainly a config bug.
    if (process.env.NODE_ENV !== "production") {
      console.warn("form-builder: every wizard step is hidden by its visibleWhen — nothing to render");
    }
    return null;
  }
  // Transient frame between a step turning hidden and the fallback effect —
  // same destination as the effect, so no flash of a different step (and no
  // spurious mount/baseline pass for its fields).
  const effectiveStep = visibleIndices.includes(step)
    ? step
    : (nearestVisible(step, visibleIndices) ?? visibleIndices[0]);

  const currentStep = steps[effectiveStep];
  const currentFieldNames = currentStep.fieldNames ?? [];
  const currentFields = currentFieldNames
    .map((name) => fieldsByName.get(name))
    .filter((field) => field !== undefined);
  // Hidden fields carry values via defaults regardless of step; render them
  // always so nothing depends on which step lists them.
  const hiddenFields = config.fields.filter((field) => field.type === "hidden");
  const submitField = config.fields.find((field) => field.type === "submit");
  const position = visibleIndices.indexOf(effectiveStep);
  const isLast = position === visibleIndices.length - 1;

  const handleNext = async () => {
    // Gate on trigger(), never formState.isValid — the condition-aware
    // resolver computes isValid across ALL steps. A review step owns no
    // fields: RHF's trigger([]) runs the full resolver but applies errors to
    // ZERO fields (vacuously true) — skip the wasted run and be explicit.
    const valid = currentFieldNames.length === 0 ? true : await form.trigger(currentFieldNames);
    if (valid) {
      const next = visibleIndices[position + 1];
      if (next !== undefined) store.getState().goTo(next);
      return;
    }
    // Move focus to the first field that failed so the error is announced.
    // getFieldState reads live state — formState from render is a stale
    // snapshot inside this handler.
    const firstInvalid = currentFieldNames.find((name) => form.getFieldState(name).invalid);
    if (firstInvalid) form.setFocus(firstInvalid);
  };

  const handleBack = () => {
    const prev = visibleIndices[position - 1];
    if (prev !== undefined) store.getState().goTo(prev);
  };

  return (
    <div className="flex flex-col gap-[6.408vw] tablet:gap-[3vw] desktop:gap-[1.248vw]">
      <ol
        ref={stepListRef}
        tabIndex={-1}
        aria-label={messages.steps}
        className="flex items-center gap-[4.272vw] tablet:gap-[2vw] desktop:gap-[0.832vw] outline-none"
      >
        {visibleIndices.map((index, displayIndex) => (
          <li
            key={index}
            aria-current={index === effectiveStep ? "step" : undefined}
            className={cn(
              "flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw] text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw]",
              index === effectiveStep ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-[6.408vw] tablet:size-[3vw] desktop:size-[1.248vw] items-center justify-center rounded-full border text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw]",
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
          {/* Hidden fields still carry values on the review step. */}
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
