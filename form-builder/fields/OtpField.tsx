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
  inputRef,
  fieldState,
  disabled,
}: {
  config: OtpFieldConfig;
  rhf: ControllerRenderProps<FieldValues, string>;
  inputRef: React.Ref<HTMLInputElement>;
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
      {/* Reference layout: send button leads (fills the start half), detached
          rounded code boxes follow. Mobile stacks button above the boxes. */}
      <div className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw] tablet:flex-row desktop:flex-row tablet:items-start desktop:items-start">
        {flow.showSend && (
          <div className="flex w-full flex-col items-stretch gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] tablet:flex-1 desktop:flex-1">
            <Button
              type="button"
              variant="outline"
              onClick={flow.send}
              disabled={disabled || !flow.canSend || flow.status !== "idle"}
              className={cn(
                "w-full font-normal",
                verified && "border-green-600 text-green-600 dark:border-green-500 dark:text-green-500",
              )}
            >
              {verified && <Check className="size-[4.272vw] tablet:size-[2vw] desktop:size-[0.832vw]" />}
              {sendLabel}
            </Button>
            {flow.showResend && (
              <p className="text-center text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
                {messages.otpDidntReceive}{" "}
                {flow.seconds > 0 ? (
                  <>
                    {messages.resendIn}{" "}
                    <span className="text-blue-600 dark:text-blue-400">{flow.seconds}</span>{" "}
                    {messages.seconds}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={flow.send}
                    disabled={disabled}
                    className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {messages.resend}
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        <InputOTP
          ref={inputRef}
          id={id}
          maxLength={config.length}
          value={(rhf.value as string) ?? ""}
          onChange={(value) => {
            flow.clearError();
            rhf.onChange(value);
          }}
          onBlur={rhf.onBlur}
          disabled={disabled || flow.inputsDisabled}
          aria-invalid={!!error}
          aria-describedby={fieldAriaDescribedBy(id, {
            description: config.description,
            error,
          })}
        >
          <InputOTPGroup className="w-full justify-between gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw] tablet:w-auto desktop:w-auto tablet:justify-start desktop:justify-start">
            {Array.from({ length: config.length }, (_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                aria-invalid={!!error}
                className={cn(
                  "rounded-[2.136vw] tablet:rounded-[1vw] desktop:rounded-[0.416vw] border dark:bg-input/30",
                  verified && "border-green-600 dark:border-green-500",
                )}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
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
        <OtpControl config={config} rhf={rhf} inputRef={rhf.ref} fieldState={fieldState} disabled={disabled} />
      )}
    />
  );
}
