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

// Step conditions are value-only (the engine rejects isValid on steps).
// Reuses the shared "Visible when" copy from the props descriptor table —
// it's the same field-level concept applied to a step instead of a field.
const STEP_CONDITION_DESCRIPTOR: PropDescriptor = {
  key: "stepVisibleWhen",
  label: builder.props.fields.visibleWhen.label,
  control: "condition",
};

/** Multi-step toggle and step management (add / rename / reorder / remove). */
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
  // Pseudo node: ConditionEditor only uses ctx.node._id for self-exclusion,
  // and a step is not a field — nothing to exclude.
  const stepCtxNode: BuilderNode = { _id: "__step__", type: "static", props: {} };

  return (
    <div className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[10px] tablet:p-[10px] desktop:p-[10px]">
      <div className="flex items-center justify-between">
        <Label htmlFor="multi-step" className="text-[13px] tablet:text-[13px] desktop:text-[13px]">
          {builder.steps.multiStepLabel}
        </Label>
        <Switch id="multi-step" checked={multiStep} onCheckedChange={toggleMultiStep} />
      </div>

      {multiStep && (steps.length === 0 || !steps.some((s) => s.nodeIds.length > 0)) && (
        <Alert
          role="status"
          className="px-[8px] tablet:px-[8px] desktop:px-[8px] py-[6px] tablet:py-[6px] desktop:py-[6px] text-[11px] tablet:text-[11px] desktop:text-[11px]"
        >
          {steps.length === 0 ? builder.steps.emptyStepsWarning : builder.steps.noFieldsAssignedWarning}
        </Alert>
      )}

      {multiStep && (
        <div className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
              <div className="flex items-center gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
                <span className="w-[16px] tablet:w-[16px] desktop:w-[16px] shrink-0 text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
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
                  aria-label={fmt(builder.steps.moveDownAriaLabel, { n: i + 1 })}
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
              <div className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] ps-[20px] tablet:ps-[20px] desktop:ps-[20px]">
                <label className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
                  <Switch
                    aria-label={fmt(builder.steps.reviewAriaLabel, { n: i + 1 })}
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
