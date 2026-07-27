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
import { useFieldRuntime } from "../components/FieldRuntime";
import { cn } from "../internal/cn";
import { fieldWrapperVariants, type FieldWrapperSize } from "./variants";
import { RequiredMark } from "./RequiredMark";

/**
 * Flat pill: border only, no shadow or fill, one step down from the label's
 * text size. Sits inside the label, so it must not read as a control.
 */
const BADGE_CLASS =
  "inline-flex items-center self-center ms-[var(--fb-space-2,1.068vw)] tablet:ms-[var(--fb-space-2-tablet,0.5vw)] desktop:ms-[var(--fb-space-2-desktop,0.208vw)] rounded-[var(--fb-space-1,0.534vw)] tablet:rounded-[var(--fb-space-1-tablet,0.25vw)] desktop:rounded-[var(--fb-space-1-desktop,0.104vw)] border px-[var(--fb-space-2,1.068vw)] tablet:px-[var(--fb-space-2-tablet,0.5vw)] desktop:px-[var(--fb-space-2-desktop,0.208vw)] text-[var(--fb-space-6,3.204vw)] tablet:text-[var(--fb-space-6-tablet,1.5vw)] desktop:text-[var(--fb-space-6-desktop,0.624vw)] font-normal text-muted-foreground";

type FieldWrapperProps = {
  id?: string;
  label?: string;
  description?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  size?: FieldWrapperSize;
  error?: { message?: string };
  className?: string;
  asGroup?: boolean;
  children: ReactNode;
};

export function fieldAriaDescribedBy(
  id: string | undefined,
  { description, error }: { description?: ReactNode; error?: { message?: string } },
): string | undefined {
  if (!id) return undefined;
  // Same truthiness test the wrapper renders on, so a control can never point
  // at a description id that was never put in the DOM.
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
  // `badge` is the one piece of field config this wrapper reads for itself.
  // Every rendered field is wrapped in a `FieldGate`, which publishes its
  // config here — so a declarative annotation reaches all 24 built-in field
  // types (and any custom one) without a prop threaded through each of them.
  const badge = useFieldRuntime().field?.badge;
  const sharedClassName = cn(fieldWrapperVariants({ size }), className);

  // Built once so the <label> and <legend> branches can never drift apart.
  const labelContent = (
    <>
      {label}
      {required && <RequiredMark />}
      {badge && (
        <>
          {/*
           * The space is load-bearing. The accessible-name algorithm inserts a
           * separator between children only when their computed display is not
           * `inline`, so without it the announced name runs together
           * ("...numberRequired in Germany") anywhere the badge's own styles
           * have not loaded. Whitespace-only text between flex items is not
           * rendered, so it costs nothing visually.
           */}
          {" "}
          <span className={BADGE_CLASS}>{badge}</span>
        </>
      )}
    </>
  );

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
        {label && <FieldLegend variant="label">{labelContent}</FieldLegend>}
        {body}
      </FieldSet>
    );
  }

  return (
    <Field data-disabled={disabled || undefined} className={sharedClassName}>
      {label && <FieldLabel htmlFor={id}>{labelContent}</FieldLabel>}
      {body}
    </Field>
  );
}
