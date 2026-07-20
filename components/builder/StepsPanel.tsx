"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { builder } from "@/locales/en/builder";
import { fmt } from "@/locales/fmt";
import { useBuilderStore } from "./model/store";
import { ConditionEditor } from "./controls/ConditionEditor";
import type { PropDescriptor } from "./model/fieldProps";
import type { BuilderNode } from "./model/types";

const STEP_CONDITION_DESCRIPTOR: PropDescriptor = {
  key: "stepVisibleWhen",
  label: builder.props.fields.visibleWhen.label,
  control: "condition",
};

export function StepsPanel() {
  const multiStep = useBuilderStore((s) => s.multiStep);
  const steps = useBuilderStore((s) => s.steps);
  const nodes = useBuilderStore((s) => s.nodes);
  const toggleMultiStep = useBuilderStore((s) => s.toggleMultiStep);
  const addStep = useBuilderStore((s) => s.addStep);
  const renameStep = useBuilderStore((s) => s.renameStep);
  const removeStep = useBuilderStore((s) => s.removeStep);
  const setStepCondition = useBuilderStore((s) => s.setStepCondition);
  const setStepReview = useBuilderStore((s) => s.setStepReview);
  const moveStep = useBuilderStore((s) => s.moveStep);
  const stepCtxNode: BuilderNode = {
    _id: "__step__",
    type: "static",
    props: {},
  };

  return (
    <div className="flex flex-col gap-[2.67vw] tablet:gap-[1.25vw] desktop:gap-[0.52vw] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border p-[2.67vw] tablet:p-[1.25vw] desktop:p-[0.52vw]">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="multi-step"
          className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw]"
        >
          {builder.steps.multiStepLabel}
        </Label>
        <Switch
          id="multi-step"
          checked={multiStep}
          onCheckedChange={toggleMultiStep}
        />
      </div>

      {multiStep &&
        (steps.length === 0 || !steps.some((s) => s.nodeIds.length > 0)) && (
          <Alert
            role="status"
            className="px-[2.136vw] tablet:px-[1vw] desktop:px-[0.416vw] py-[1.602vw] tablet:py-[0.75vw] desktop:py-[0.312vw] text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw]"
          >
            {steps.length === 0
              ? builder.steps.emptyStepsWarning
              : builder.steps.noFieldsAssignedWarning}
          </Alert>
        )}

      {multiStep && (
        <div className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]"
            >
              <div className="flex items-center gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
                <span className="w-[4.272vw] tablet:w-[2vw] desktop:w-[0.832vw] shrink-0 text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
                  {i + 1}
                </span>
                <Input
                  aria-label={fmt(builder.steps.titleAriaLabel, { n: i + 1 })}
                  value={step.title}
                  onChange={(e) => renameStep(i, e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={fmt(builder.steps.moveUpAriaLabel, { n: i + 1 })}
                  onClick={() => moveStep(i, -1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={fmt(builder.steps.moveDownAriaLabel, {
                    n: i + 1,
                  })}
                  onClick={() => moveStep(i, 1)}
                >
                  <ChevronDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={fmt(builder.steps.removeAriaLabel, { n: i + 1 })}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeStep(i)}
                >
                  <X />
                </Button>
              </div>
              <div className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] ps-[5.34vw] tablet:ps-[2.5vw] desktop:ps-[1.04vw]">
                <label className="flex items-center gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
                  <Switch
                    aria-label={fmt(builder.steps.reviewAriaLabel, {
                      n: i + 1,
                    })}
                    checked={step.review === true}
                    onCheckedChange={(on) => setStepReview(i, on)}
                  />
                  {builder.steps.reviewLabel}
                </label>
                <ConditionEditor
                  id={`step-${i}-visible-when`}
                  value={step.visibleWhen}
                  onChange={(spec) => setStepCondition(i, spec)}
                  descriptor={STEP_CONDITION_DESCRIPTOR}
                  ctx={{ node: stepCtxNode, siblings: nodes, isNested: false }}
                />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addStep}>
            <Plus />
            {builder.steps.addStep}
          </Button>
        </div>
      )}
    </div>
  );
}
