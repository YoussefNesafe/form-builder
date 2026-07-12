"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type SliderFieldConfig = Extract<FieldConfig, { type: "slider" }>;

export function SliderField({ field }: FieldComponentProps) {
  const config = field as SliderFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const id = useId();

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => {
        const value = typeof rhf.value === "number" ? rhf.value : config.min;
        return (
          <FieldWrapper
            id={id}
            label={config.label}
            description={config.description}
            required={config.required}
            disabled={disabled}
            error={fieldState.error}
          >
            <div className="flex items-center gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
              <Slider
                ref={rhf.ref}
                id={id}
                min={config.min}
                max={config.max}
                step={config.step}
                value={[value]}
                onValueChange={([next]) => rhf.onChange(next)}
                onBlur={rhf.onBlur}
                disabled={disabled}
                aria-invalid={!!fieldState.error}
                aria-describedby={fieldAriaDescribedBy(id, {
                  description: config.description,
                  error: fieldState.error,
                })}
              />
              <span className="w-[10.68vw] tablet:w-[5vw] desktop:w-[2.08vw] text-end text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] text-muted-foreground">{value}</span>
            </div>
          </FieldWrapper>
        );
      }}
    />
  );
}
