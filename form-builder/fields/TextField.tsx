"use client";

import { useId, useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { CircleX, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FieldComponentProps } from "../core/registry";
import { getPasswordChecks } from "../core/password";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type TextFieldConfig = Extract<
  FieldConfig,
  { type: "text" | "email" | "password" | "textarea" } | { type: "number" }
>;

export function TextField({ field }: FieldComponentProps) {
  const config = field as TextFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const { messages } = useFieldRuntime();
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = config.type === "password";
  const complexityChecks =
    config.type === "password" && config.complexity
      ? getPasswordChecks(config.complexity, messages)
      : null;
  // rules.allow blocks disallowed characters at input time (typing and paste).
  const allow = "rules" in config ? config.rules?.allow : undefined;
  const blockedChars = useMemo(() => {
    if (!allow) return null;
    try {
      return new RegExp(`[^${allow}]`, "g");
    } catch {
      return null; // invalid class body: filtering off, zod pattern still validates
    }
  }, [allow]);
  const sanitize = (value: string) => (blockedChars ? value.replace(blockedChars, "") : value);

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => {
        // Live checklist (reference behavior): only failing rules render, in
        // red, while the user types; the checklist replaces the error text so
        // the same rule is not reported twice.
        const failing = complexityChecks
          ? complexityChecks.filter((check) => !check.test((rhf.value as string) ?? ""))
          : [];
        const showChecklist =
          failing.length > 0 && (fieldState.isDirty || fieldState.isTouched);
        // The checklist replaces the error element, so describedby must point
        // at whichever is actually rendered — never at a missing -error id.
        const wrapperError = showChecklist ? undefined : fieldState.error;
        const describedBy =
          [
            fieldAriaDescribedBy(id, { description: config.description, error: wrapperError }),
            showChecklist ? `${id}-rules` : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined;

        // trim rule also normalizes the visible value on blur, not only the
        // parsed payload.
        const handleBlur = () => {
          if ("rules" in config && config.rules?.trim && typeof rhf.value === "string") {
            const trimmed = rhf.value.trim();
            if (trimmed !== rhf.value) rhf.onChange(trimmed);
          }
          rhf.onBlur();
        };

        return (
        <FieldWrapper
          id={id}
          label={config.label}
          description={config.description}
          required={config.required}
          disabled={disabled}
          error={wrapperError}
        >
          {config.type === "textarea" ? (
            <Textarea
              placeholder={config.placeholder}
              {...rhf}
              onChange={(event) => rhf.onChange(sanitize(event.target.value))}
              onBlur={handleBlur}
              id={id}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
              aria-describedby={describedBy}
              value={(rhf.value as string) ?? ""}
            />
          ) : (
            <div className="relative">
              <Input
                type={isPassword && showPassword ? "text" : config.type}
                inputMode={config.type === "email" ? "email" : config.type === "number" ? "decimal" : undefined}
                placeholder={config.placeholder}
                min={config.type === "number" ? config.min : undefined}
                max={config.type === "number" ? config.max : undefined}
                step={config.type === "number" ? config.step : undefined}
                className={isPassword ? "pe-[40px] tablet:pe-[40px] desktop:pe-[40px]" : undefined}
                {...rhf}
                onBlur={handleBlur}
                id={id}
                disabled={disabled}
                aria-invalid={!!fieldState.error}
                aria-describedby={describedBy}
                value={(rhf.value as string | number) ?? ""}
                onChange={(event) =>
                  config.type === "number"
                    ? rhf.onChange(Number.isNaN(event.target.valueAsNumber) ? undefined : event.target.valueAsNumber)
                    : rhf.onChange(sanitize(event.target.value))
                }
              />
              {isPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  aria-label={showPassword ? messages.hidePassword : messages.showPassword}
                  className="absolute end-0 top-0 h-full px-[12px] tablet:px-[12px] desktop:px-[12px]"
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              )}
            </div>
          )}
          {showChecklist && (
            <div id={`${id}-rules`} aria-live="polite" className="grid grid-cols-2 gap-x-[16px] tablet:gap-x-[16px] desktop:gap-x-[16px] gap-y-[4px] tablet:gap-y-[4px] desktop:gap-y-[4px]">
              {failing.map((check) => (
                <span key={check.key} className="flex items-center gap-[4px] tablet:gap-[4px] desktop:gap-[4px] text-[12px] tablet:text-[12px] desktop:text-[12px] text-destructive">
                  <CircleX aria-hidden className="size-[14px] tablet:size-[14px] desktop:size-[14px] shrink-0" />
                  {check.label}
                </span>
              ))}
            </div>
          )}
        </FieldWrapper>
        );
      }}
    />
  );
}
