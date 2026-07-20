"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type TimeFieldConfig = Extract<FieldConfig, { type: "time" }>;

export function TimeField({ field }: FieldComponentProps) {
  const config = field as TimeFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const id = useId();

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => (
        <FieldWrapper
          id={id}
          label={config.label}
          description={config.description}
          required={config.required}
          disabled={disabled}
          error={fieldState.error}
        >
          <Input
            type="time"
            min={config.minTime}
            max={config.maxTime}
            step={config.stepMinutes !== undefined ? config.stepMinutes * 60 : undefined}
            {...rhf}
            id={id}
            disabled={disabled}
            aria-invalid={!!fieldState.error}
            aria-describedby={fieldAriaDescribedBy(id, {
              description: config.description,
              error: fieldState.error,
            })}
            value={(rhf.value as string) ?? ""}
          />
        </FieldWrapper>
      )}
    />
  );
}
