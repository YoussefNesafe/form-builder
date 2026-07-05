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
          error={showChecklist ? undefined : fieldState.error}
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
              aria-describedby={fieldAriaDescribedBy(id, {
                description: config.description,
                error: fieldState.error,
              })}
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
                className={isPassword ? "pe-10" : undefined}
                {...rhf}
                onBlur={handleBlur}
                id={id}
                disabled={disabled}
                aria-invalid={!!fieldState.error}
                aria-describedby={fieldAriaDescribedBy(id, {
                  description: config.description,
                  error: fieldState.error,
                })}
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
                  className="absolute end-0 top-0 h-full px-3"
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              )}
            </div>
          )}
          {showChecklist && (
            <div aria-live="polite" className="grid grid-cols-2 gap-x-4 gap-y-1">
              {failing.map((check) => (
                <span key={check.key} className="flex items-center gap-1 text-xs text-destructive">
                  <CircleX aria-hidden className="size-3.5 shrink-0" />
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
