"use client";

import type { ReactNode } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { fieldWrapperVariants, type FieldWrapperSize } from "./variants";

type FieldWrapperProps = {
  id?: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  size?: FieldWrapperSize;
  error?: { message?: string };
  className?: string;
  children: ReactNode;
};

export function FieldWrapper({
  id,
  label,
  description,
  required,
  disabled,
  size,
  error,
  className,
  children,
}: FieldWrapperProps) {
  return (
    <Field
      data-invalid={!!error || undefined}
      data-disabled={disabled || undefined}
      className={cn(fieldWrapperVariants({ size, state: error ? "error" : "default" }), className)}
    >
      {label && (
        <FieldLabel htmlFor={id}>
          {label}
          {required && (
            <span aria-hidden className="text-destructive ms-1">
              *
            </span>
          )}
        </FieldLabel>
      )}
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}
