"use client";

import { useFieldArray, useFormContext, useFormState } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { FieldComponentProps } from "../core/registry";
import type { AnyFieldConfig, ConditionSpec, FieldConfig } from "../core/types";
import { toConditionGroups } from "../core/conditions";
import { renderField } from "../components/renderField";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper } from "../ui/FieldWrapper";
import { buildDefaultValues } from "../hooks/useDynamicForm";

type GroupFieldConfig = Extract<FieldConfig, { type: "group" }>;

// Normalized to anyOf-groups on the way through — evaluation treats all
// spec shapes alike, so the shape change is invisible downstream.
function prefixConditionSpec(spec: ConditionSpec | undefined, prefix: string): ConditionSpec | undefined {
  if (!spec) return undefined;
  return {
    anyOf: toConditionGroups(spec).map((group) =>
      group.map((condition) => ({ ...condition, field: `${prefix}.${condition.field}` })),
    ),
  };
}

/** Row-scoped names and conditions: inner "role" becomes "team.0.role". */
export function withNamePrefix(field: AnyFieldConfig, prefix: string): AnyFieldConfig {
  return {
    ...field,
    name: `${prefix}.${field.name}`,
    visibleWhen: prefixConditionSpec(field.visibleWhen, prefix),
    disabledWhen: prefixConditionSpec(field.disabledWhen, prefix),
    enabledWhen: prefixConditionSpec(field.enabledWhen, prefix),
  };
}

export function GroupField({ field }: FieldComponentProps) {
  const config = field as GroupFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const { messages } = useFieldRuntime();
  const { fields: rows, append, remove } = useFieldArray({ control, name: config.name });
  const { errors } = useFormState({ control, name: config.name });
  const rootError = errors[config.name]?.root ?? errors[config.name];
  const groupError =
    rootError && typeof rootError.message === "string" ? { message: rootError.message } : undefined;

  const min = config.min ?? 0;
  const max = config.max ?? Number.POSITIVE_INFINITY;

  return (
    <FieldWrapper
      asGroup
      label={config.label}
      description={config.description}
      required={config.required}
      disabled={disabled}
      error={groupError}
    >
      <div className="flex flex-col gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
        {rows.map((row, index) => (
          <div key={row.id} className="flex flex-col gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
            {index > 0 && <Separator />}
            <div className="grid grid-cols-4 items-start gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
              <div className="col-span-3 grid grid-cols-12 gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
                {config.fields.map((inner) => renderField(withNamePrefix(inner, `${config.name}.${index}`)))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled || rows.length <= min}
                aria-label={messages.removeRow(index + 1)}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-[16px] tablet:size-[16px] desktop:size-[16px]" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={disabled || rows.length >= max}
          onClick={() => append(buildDefaultValues(config.fields))}
          className="w-fit"
        >
          <Plus className="me-[8px] tablet:me-[8px] desktop:me-[8px] size-[16px] tablet:size-[16px] desktop:size-[16px]" />
          {config.placeholder ?? messages.addRow}
        </Button>
      </div>
    </FieldWrapper>
  );
}
