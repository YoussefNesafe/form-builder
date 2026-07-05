"use client";

import { useFieldArray, useFormContext, useFormState } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { FieldComponentProps } from "../core/registry";
import type { Condition, FieldConfig } from "../core/types";
import { renderField } from "../components/FormRenderer";
import { useFieldDisabled } from "../components/FieldRuntime";
import { FieldWrapper } from "../ui/FieldWrapper";
import { buildDefaultValues } from "../hooks/useDynamicForm";

type GroupFieldConfig = Extract<FieldConfig, { type: "group" }>;

function prefixCondition(condition: Condition | undefined, prefix: string): Condition | undefined {
  return condition && { ...condition, field: `${prefix}.${condition.field}` };
}

/** Row-scoped names and conditions: inner "role" becomes "team.0.role". */
export function withNamePrefix(field: FieldConfig, prefix: string): FieldConfig {
  return {
    ...field,
    name: `${prefix}.${field.name}`,
    visibleWhen: prefixCondition(field.visibleWhen, prefix),
    disabledWhen: prefixCondition(field.disabledWhen, prefix),
  };
}

export function GroupField({ field }: FieldComponentProps) {
  const config = field as GroupFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
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
      <div className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <div key={row.id} className="flex flex-col gap-4">
            {index > 0 && <Separator />}
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="col-span-3 grid grid-cols-4 gap-4">
                {config.fields.map((inner) => renderField(withNamePrefix(inner, `${config.name}.${index}`)))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled || rows.length <= min}
                aria-label={`Remove row ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
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
          <Plus className="me-2 size-4" />
          {config.placeholder ?? "+"}
        </Button>
      </div>
    </FieldWrapper>
  );
}
