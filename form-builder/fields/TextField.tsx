"use client";

import { useId, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper } from "../ui/FieldWrapper";

type TextFieldConfig = Extract<
  FieldConfig,
  { type: "text" | "email" | "password" | "textarea" } | { type: "number" }
>;

const inputTypeByFieldType = {
  text: "text",
  email: "email",
  password: "password",
  number: "number",
} as const;

export function TextField({ field }: FieldComponentProps) {
  const config = field as TextFieldConfig;
  const { control } = useFormContext();
  const runtime = useFieldRuntime();
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  const disabled = !!config.disabled || runtime.disabled;
  const isPassword = config.type === "password";
  const inputType = isPassword && showPassword ? "text" : inputTypeByFieldType[config.type as keyof typeof inputTypeByFieldType];

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
          {config.type === "textarea" ? (
            <Textarea
              id={id}
              placeholder={config.placeholder}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
              {...rhf}
              value={(rhf.value as string) ?? ""}
            />
          ) : (
            <div className="relative">
              <Input
                id={id}
                type={inputType}
                inputMode={config.type === "email" ? "email" : config.type === "number" ? "decimal" : undefined}
                placeholder={config.placeholder}
                disabled={disabled}
                aria-invalid={!!fieldState.error}
                min={config.type === "number" ? config.min : undefined}
                max={config.type === "number" ? config.max : undefined}
                step={config.type === "number" ? config.step : undefined}
                className={isPassword ? "pe-10" : undefined}
                {...rhf}
                value={(rhf.value as string | number) ?? ""}
                onChange={(event) =>
                  config.type === "number"
                    ? rhf.onChange(Number.isNaN(event.target.valueAsNumber) ? undefined : event.target.valueAsNumber)
                    : rhf.onChange(event.target.value)
                }
              />
              {isPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute end-0 top-0 h-full px-3"
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              )}
            </div>
          )}
        </FieldWrapper>
      )}
    />
  );
}
