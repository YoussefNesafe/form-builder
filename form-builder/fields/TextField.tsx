"use client";

import { useId, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type TextFieldConfig = Extract<
  FieldConfig,
  { type: "text" | "email" | "password" | "textarea" } | { type: "number" }
>;

export function TextField({ field }: FieldComponentProps) {
  const config = field as TextFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = config.type === "password";

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
              placeholder={config.placeholder}
              {...rhf}
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
