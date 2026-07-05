"use client";

import type { ReactNode } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { fieldWrapperVariants, type FieldWrapperSize } from "./variants";
import { RequiredMark } from "./RequiredMark";

type FieldWrapperProps = {
  id?: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  size?: FieldWrapperSize;
  error?: { message?: string };
  className?: string;
  /** fieldset/legend semantics for option groups (radio, checkbox group) */
  asGroup?: boolean;
  children: ReactNode;
};

export function fieldAriaDescribedBy(
  id: string | undefined,
  { description, error }: { description?: string; error?: { message?: string } },
): string | undefined {
  if (!id) return undefined;
  const ids = [description && `${id}-description`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function FieldWrapper({
  id,
  label,
  description,
  required,
  disabled,
  size,
  error,
  className,
  asGroup,
  children,
}: FieldWrapperProps) {
  const sharedClassName = cn(fieldWrapperVariants({ size }), className);

  const body = (
    <>
      {children}
      {description && <FieldDescription id={id ? `${id}-description` : undefined}>{description}</FieldDescription>}
      <FieldError id={id ? `${id}-error` : undefined} errors={error ? [error] : undefined} />
    </>
  );

  if (asGroup) {
    return (
      <FieldSet data-disabled={disabled || undefined} className={sharedClassName}>
        {label && (
          <FieldLegend variant="label">
            {label}
            {required && <RequiredMark />}
          </FieldLegend>
        )}
        {body}
      </FieldSet>
    );
  }

  return (
    <Field data-disabled={disabled || undefined} className={sharedClassName}>
      {label && (
        <FieldLabel htmlFor={id}>
          {label}
          {required && <RequiredMark />}
        </FieldLabel>
      )}
      {body}
    </Field>
  );
}
