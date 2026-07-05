"use client";

import { useId } from "react";
import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldError,
  type FieldValues,
} from "react-hook-form";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { useOtpFlow } from "../hooks/useOtpFlow";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type OtpFieldConfig = Extract<FieldConfig, { type: "otp" }>;

function OtpControl({
  config,
  rhf,
  fieldState,
  disabled,
}: {
  config: OtpFieldConfig;
  rhf: ControllerRenderProps<FieldValues, string>;
  fieldState: ControllerFieldState;
  disabled: boolean;
}) {
  const { messages } = useFieldRuntime();
  const flow = useOtpFlow(config);
  const id = useId();

  const verified = flow.status === "verified";

  // Action errors (send/verify outcome) outrank the schema's generic
  // "verify first" — the user needs to know the attempt failed.
  const error = flow.error
    ? ({ type: "otp", message: flow.error } as FieldError)
    : fieldState.error;

  const sendLabel = verified
    ? messages.otpVerified
    : flow.status === "idle" || flow.status === "sending"
      ? messages.sendCode
      : messages.codeSent;

  return (
    <FieldWrapper
      id={id}
      label={config.label}
      description={config.description}
      required={config.required}
      disabled={disabled}
      error={error}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <InputOTP
          id={id}
          maxLength={config.length}
          value={(rhf.value as string) ?? ""}
          onChange={(value) => {
            flow.clearError();
            rhf.onChange(value);
          }}
          onBlur={rhf.onBlur}
          disabled={disabled || flow.inputsDisabled}
          aria-invalid={!!fieldState.error}
          aria-describedby={fieldAriaDescribedBy(id, {
            description: config.description,
            error,
          })}
        >
          <InputOTPGroup>
            {Array.from({ length: config.length }, (_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                aria-invalid={!!fieldState.error}
                className={cn(verified && "border-green-600 dark:border-green-500")}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {flow.showSend && (
          <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto">
            <Button
              type="button"
              onClick={flow.send}
              disabled={disabled || !flow.canSend || flow.status !== "idle"}
              className={cn(
                "w-full sm:w-auto",
                verified && "border-green-600 text-green-600 dark:border-green-500 dark:text-green-500",
              )}
              variant={verified ? "outline" : "default"}
            >
              {verified && <Check className="size-4" />}
              {sendLabel}
            </Button>
            {flow.showResend && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={flow.send}
                disabled={disabled || flow.seconds > 0}
                className="w-full text-muted-foreground sm:w-auto"
              >
                {flow.seconds > 0 ? messages.resendIn(flow.seconds) : messages.resend}
              </Button>
            )}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

export function OtpField({ field }: FieldComponentProps) {
  const config = field as OtpFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => (
        <OtpControl config={config} rhf={rhf} fieldState={fieldState} disabled={disabled} />
      )}
    />
  );
}
