"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig, Option } from "../core/types";
import { useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper } from "../ui/FieldWrapper";

type CheckboxFieldConfig = Extract<FieldConfig, { type: "checkbox" | "switch" }>;

function toggleValue(current: unknown, value: Option["value"]): Option["value"][] {
  const list = Array.isArray(current) ? (current as Option["value"][]) : [];
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export function CheckboxField({ field }: FieldComponentProps) {
  const config = field as CheckboxFieldConfig;
  const { control } = useFormContext();
  const runtime = useFieldRuntime();
  const id = useId();

  const disabled = !!config.disabled || runtime.disabled;
  const isGroup = config.type === "checkbox" && !!config.options?.length;

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => {
        if (isGroup) {
          return (
            <FieldWrapper
              label={config.label}
              description={config.description}
              required={config.required}
              disabled={disabled}
              error={fieldState.error}
            >
              <div className="flex flex-col gap-2" role="group" aria-invalid={!!fieldState.error}>
                {config.options?.map((option) => {
                  const optionId = `${id}-${option.value}`;
                  const checked = Array.isArray(rhf.value) && (rhf.value as Option["value"][]).includes(option.value);
                  return (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={optionId}
                        checked={checked}
                        disabled={disabled || option.disabled}
                        onCheckedChange={() => rhf.onChange(toggleValue(rhf.value, option.value))}
                      />
                      <Label htmlFor={optionId}>{option.label}</Label>
                    </div>
                  );
                })}
              </div>
            </FieldWrapper>
          );
        }

        const ToggleControl = config.type === "switch" ? Switch : Checkbox;
        return (
          <Field data-invalid={!!fieldState.error || undefined} data-disabled={disabled || undefined}>
            <Field orientation="horizontal">
              <ToggleControl
                id={id}
                checked={!!rhf.value}
                disabled={disabled}
                aria-invalid={!!fieldState.error}
                onCheckedChange={(checked) => rhf.onChange(checked === true)}
                onBlur={rhf.onBlur}
              />
              {config.label && (
                <FieldLabel htmlFor={id}>
                  {config.label}
                  {config.required && (
                    <span aria-hidden className="text-destructive ms-1">
                      *
                    </span>
                  )}
                </FieldLabel>
              )}
            </Field>
            {config.description && <FieldDescription>{config.description}</FieldDescription>}
            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
          </Field>
        );
      }}
    />
  );
}
