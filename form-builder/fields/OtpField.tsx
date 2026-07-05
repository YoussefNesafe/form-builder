"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type OtpFieldConfig = Extract<FieldConfig, { type: "otp" }>;

export function OtpField({ field }: FieldComponentProps) {
  const config = field as OtpFieldConfig;
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
          <InputOTP
            id={id}
            maxLength={config.length}
            value={(rhf.value as string) ?? ""}
            onChange={rhf.onChange}
            onBlur={rhf.onBlur}
            disabled={disabled}
            aria-invalid={!!fieldState.error}
            aria-describedby={fieldAriaDescribedBy(id, {
              description: config.description,
              error: fieldState.error,
            })}
          >
            <InputOTPGroup>
              {Array.from({ length: config.length }, (_, index) => (
                <InputOTPSlot key={index} index={index} aria-invalid={!!fieldState.error} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </FieldWrapper>
      )}
    />
  );
}
