"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper } from "../ui/FieldWrapper";

type RadioFieldConfig = Extract<FieldConfig, { type: "radio" }>;

export function RadioField({ field }: FieldComponentProps) {
  const config = field as RadioFieldConfig;
  const { control } = useFormContext();
  const runtime = useFieldRuntime();
  const id = useId();

  const disabled = !!config.disabled || runtime.disabled;

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => (
        <FieldWrapper
          label={config.label}
          description={config.description}
          required={config.required}
          disabled={disabled}
          error={fieldState.error}
        >
          <RadioGroup
            value={String(rhf.value ?? "")}
            onValueChange={rhf.onChange}
            disabled={disabled}
            aria-invalid={!!fieldState.error}
          >
            {config.options.map((option) => {
              const optionId = `${id}-${option.value}`;
              return (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem id={optionId} value={String(option.value)} disabled={option.disabled} />
                  <Label htmlFor={optionId}>{option.label}</Label>
                </div>
              );
            })}
          </RadioGroup>
        </FieldWrapper>
      )}
    />
  );
}
