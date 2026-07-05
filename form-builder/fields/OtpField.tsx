"use client";

import { useEffect, useId, useRef, useState } from "react";
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
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type OtpFieldConfig = Extract<FieldConfig, { type: "otp" }>;

type OtpStatus = "idle" | "sending" | "sent" | "verifying" | "verified";

const RESEND_DELAY_SECONDS = 30;

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
  const { messages, otp } = useFieldRuntime();
  const { trigger } = useFormContext();
  const id = useId();

  const [status, setStatus] = useState<OtpStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  // Last code handed to verify — prevents the effect from re-verifying the
  // same rejected code on every render.
  const attempted = useRef<string | null>(null);

  const verified = status === "verified";
  const code = (rhf.value as string) ?? "";

  const counting = seconds > 0;
  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [counting]);

  useEffect(() => {
    if (!otp?.verify || status !== "sent") return;
    if (code.length !== config.length || attempted.current === code) return;
    attempted.current = code;
    setStatus("verifying");
    otp
      .verify(config.name, code)
      .then((ok) => {
        if (ok) {
          setStatus("verified");
          setActionError(null);
          // Re-run validation so a pending "verify the code first" error clears.
          void trigger(config.name);
        } else {
          setStatus("sent");
          setActionError(messages.otpVerifyFailed);
        }
      })
      .catch(() => {
        setStatus("sent");
        setActionError(messages.otpVerifyFailed);
      });
  }, [otp, status, code, config.length, config.name, messages.otpVerifyFailed, trigger]);

  const handleSend = async () => {
    if (!otp?.send) return;
    const resending = status !== "idle";
    setStatus("sending");
    setActionError(null);
    attempted.current = null;
    try {
      await otp.send(config.name);
      setStatus("sent");
      setSeconds(RESEND_DELAY_SECONDS);
    } catch {
      setStatus(resending ? "sent" : "idle");
      setActionError(messages.otpSendFailed);
    }
  };

  // Action errors (send/verify outcome) outrank the schema's generic
  // "verify first" — the user needs to know the attempt failed.
  const error = actionError
    ? ({ type: "otp", message: actionError } as FieldError)
    : fieldState.error;

  const sendLabel =
    status === "verified" ? messages.otpVerified : status === "idle" || status === "sending" ? messages.sendCode : messages.codeSent;

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
          value={code}
          onChange={(value) => {
            setActionError(null);
            rhf.onChange(value);
          }}
          onBlur={rhf.onBlur}
          disabled={disabled || verified}
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

        {otp?.send && (
          <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto">
            <Button
              type="button"
              onClick={handleSend}
              disabled={disabled || status !== "idle"}
              className={cn(
                "w-full sm:w-auto",
                verified && "border-green-600 text-green-600 dark:border-green-500 dark:text-green-500",
              )}
              variant={verified ? "outline" : "default"}
            >
              {verified && <Check className="size-4" />}
              {sendLabel}
            </Button>
            {(status === "sent" || status === "verifying") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSend}
                disabled={disabled || counting}
                className="w-full text-muted-foreground sm:w-auto"
              >
                {counting ? messages.resendIn(seconds) : messages.resend}
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
