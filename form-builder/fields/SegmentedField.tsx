"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type SegmentedFieldConfig = Extract<FieldConfig, { type: "segmented" }>;

export function SegmentedField({ field }: FieldComponentProps) {
  const config = field as SegmentedFieldConfig;
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
          asGroup
          label={config.label}
          description={config.description}
          required={config.required}
          disabled={disabled}
          error={fieldState.error}
        >
          {/* Radio semantics (not toggle-group): single-select with roving
              focus and arrow keys handled by the primitive. Option values keep
              their configured type — the string the primitive reports is
              mapped back to the matching option value. */}
          <RadioGroupPrimitive.Root
            value={rhf.value === undefined || rhf.value === null ? "" : String(rhf.value)}
            onValueChange={(next) => {
              const option = config.options.find((entry) => String(entry.value) === next);
              if (option) rhf.onChange(option.value);
            }}
            disabled={disabled}
            orientation="horizontal"
            aria-describedby={fieldAriaDescribedBy(id, {
              description: config.description,
              error: fieldState.error,
            })}
            aria-invalid={!!fieldState.error}
            onBlur={rhf.onBlur}
            className={cn(
              "flex h-[8.544vw] tablet:h-[4vw] desktop:h-[1.664vw] w-full overflow-hidden",
              "rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border",
              fieldState.error ? "border-destructive" : "border-input",
            )}
          >
            {config.options.map((option, index) => (
              <RadioGroupPrimitive.Item
                key={String(option.value)}
                ref={index === 0 ? rhf.ref : undefined}
                value={String(option.value)}
                disabled={disabled || option.disabled}
                className={cn(
                  "flex-1 min-w-0 truncate px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw]",
                  "text-[4.272vw] tablet:text-[1.75vw] desktop:text-[0.728vw] transition-colors outline-none",
                  "border-s border-input first:border-s-0",
                  // Flat mandate: selected + focus states via color only.
                  "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                  "focus-visible:border-ring focus-visible:bg-accent data-[state=checked]:focus-visible:bg-primary/90",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {option.label}
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroupPrimitive.Root>
        </FieldWrapper>
      )}
    />
  );
}
