"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { evaluateCondition, hiddenStepFieldNames } from "../core/conditions";
import type { AnyFieldConfig, FormConfig, FormValues } from "../core/types";
import { useFieldRuntime } from "./FieldRuntime";
import { formatReviewValue } from "./reviewValue";

function ReviewRow({ field, value }: { field: AnyFieldConfig; value: unknown }) {
  const runtime = useFieldRuntime();
  const label = field.label || field.name;

  if (field.type === "signature" && typeof value === "string" && value.startsWith("data:image/")) {
    return (
      <div className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
        <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">{label}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt={label}
          className="h-[48px] tablet:h-[48px] desktop:h-[48px] w-fit max-w-full rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border border-border bg-background"
        />
      </div>
    );
  }

  if (field.type === "group" && Array.isArray(value)) {
    const inner = (field as { fields: AnyFieldConfig[] }).fields;
    return (
      <div className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
        <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">{label}</span>
        {value.length === 0 && (
          <span className="text-[14px] tablet:text-[14px] desktop:text-[14px]">{runtime.messages.notAnswered}</span>
        )}
        {value.map((row, index) => (
          <div
            key={index}
            className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border border-border p-[8px] tablet:p-[8px] desktop:p-[8px]"
          >
            {inner
              .filter((innerField) => innerField.type !== "static" && innerField.type !== "submit")
              .map((innerField) => (
                <div key={innerField.name} className="flex items-baseline justify-between gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
                  <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
                    {innerField.label || innerField.name}
                  </span>
                  <span className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-end break-words">
                    {formatReviewValue(
                      // The verified-otp registry keys on runtime row-prefixed
                      // names — the formatter must see the prefixed name.
                      { ...innerField, name: `${field.name}.${index}.${innerField.name}` },
                      (row as FormValues)?.[innerField.name],
                      runtime,
                    )}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-baseline justify-between gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
      <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-end break-words">
        {formatReviewValue(field, value, runtime)}
      </span>
    </div>
  );
}

/**
 * Read-only summary of every visible field from earlier visible steps,
 * grouped by step with per-step edit links. Values read live from form
 * state — arriving back here always reflects current values.
 */
export function ReviewStep({
  config,
  currentIndex,
  visibleIndices,
  goTo,
}: {
  config: FormConfig;
  currentIndex: number;
  visibleIndices: number[];
  goTo: (index: number) => void;
}) {
  const { control } = useFormContext();
  const { messages } = useFieldRuntime();
  // Whole-form subscription: the summary must reflect every value and every
  // visibility condition — acceptable on a read-only step.
  useWatch({ control });
  const values = useFormContext().getValues();

  const steps = config.steps ?? [];
  const fieldsByName = new Map(config.fields.map((field) => [field.name, field]));
  const stepHidden = hiddenStepFieldNames(config, values);

  const sections = visibleIndices
    .filter((index) => index < currentIndex && steps[index].review !== true)
    .map((index) => {
      const step = steps[index];
      const fields = (step.fieldNames ?? [])
        .map((name) => fieldsByName.get(name))
        .filter((field): field is AnyFieldConfig => field !== undefined)
        // Effective visibility: own condition AND owning step visible —
        // same source the resolver validates against.
        .filter((field) => !stepHidden.has(field.name) && evaluateCondition(field.visibleWhen, values))
        .filter((field) => field.type !== "static" && field.type !== "submit");
      return { index, step, fields };
    })
    .filter((section) => section.fields.length > 0);

  return (
    <div className="flex flex-col gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
      {sections.map((section, order) => (
        <section key={section.index} className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
          {order > 0 && <Separator />}
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] tablet:text-[14px] desktop:text-[14px] font-medium">{section.step.title}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              aria-label={`${messages.edit}: ${section.step.title}`}
              onClick={() => goTo(section.index)}
            >
              {messages.edit}
            </Button>
          </div>
          {section.fields.map((field) => (
            <ReviewRow key={field.name} field={field} value={values[field.name]} />
          ))}
        </section>
      ))}
    </div>
  );
}
