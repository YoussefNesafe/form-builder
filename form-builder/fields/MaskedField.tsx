"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";
import { extractRaw, formatMasked } from "./maskedValue";

type MaskedFieldConfig = Extract<FieldConfig, { type: "masked" }>;

export function MaskedField({ field }: FieldComponentProps) {
  const config = field as MaskedFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const id = useId();

  // Digit-only masks get the numeric keyboard on touch devices.
  const numericOnly = ![...config.mask].some((char) => char === "A" || char === "*");

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
          {/* RHF stores the RAW value; the input shows the formatted one.
              Known v1 limitation: re-formatting on change can move the caret
              to the end on mid-string edits — typing/deleting at the end is
              fully correct. A caret-preserving mask needs selection tracking
              (or a mask lib); revisit if mid-string editing matters. */}
          <Input
            type="text"
            inputMode={numericOnly ? "numeric" : undefined}
            placeholder={config.placeholder ?? config.mask}
            maxLength={config.mask.length}
            {...rhf}
            id={id}
            disabled={disabled}
            aria-invalid={!!fieldState.error}
            aria-describedby={fieldAriaDescribedBy(id, {
              description: config.description,
              error: fieldState.error,
            })}
            value={formatMasked((rhf.value as string) ?? "", config.mask)}
            onChange={(event) => rhf.onChange(extractRaw(event.target.value, config.mask))}
          />
        </FieldWrapper>
      )}
    />
  );
}
