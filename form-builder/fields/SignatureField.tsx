"use client";

import { useEffect, useId, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";
import { cn } from "../internal/cn";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type SignatureFieldConfig = Extract<FieldConfig, { type: "signature" }>;

const DEFAULT_HEIGHT_PX = 160;

type SignatureCanvasProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  penColor?: string;
  heightPx?: number;
  clearLabel: string;
};

function SignatureCanvas({
  id,
  label,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  describedBy,
  penColor,
  heightPx,
  clearLabel,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
    disabledRef.current = disabled;
  });
  const initialValueRef = useRef(value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = new SignaturePad(canvas, penColor ? { penColor } : undefined);
    padRef.current = pad;

    const handleEndStroke = () => {
      onChangeRef.current(pad.toDataURL("image/png"));
      onBlurRef.current();
    };
    pad.addEventListener("endStroke", handleEndStroke);

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.redraw();
    };
    resize();
    if (initialValueRef.current) void pad.fromDataURL(initialValueRef.current);
    if (disabledRef.current) pad.off();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      pad.removeEventListener("endStroke", handleEndStroke);
      pad.off();
      padRef.current = null;
    };
  }, [penColor]);

  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;
    if (disabled) pad.off();
    else pad.on();
  }, [disabled]);

  useEffect(() => {
    const pad = padRef.current;
    if (!value && pad && !pad.isEmpty()) pad.clear();
  }, [value]);

  const clear = () => {
    padRef.current?.clear();
    onChange("");
    onBlur();
  };

  return (
    <div className="flex flex-col gap-[var(--fb-space-4,2.136vw)] tablet:gap-[var(--fb-space-4-tablet,1vw)] desktop:gap-[var(--fb-space-4-desktop,0.416vw)]">
      <canvas
        ref={canvasRef}
        id={id}
        role="img"
        aria-label={label}
        aria-describedby={describedBy}
        className={cn(
          "w-full touch-none rounded-[var(--fb-space-5,2.67vw)] tablet:rounded-[var(--fb-space-5-tablet,1.25vw)] desktop:rounded-[var(--fb-space-5-desktop,0.52vw)] border bg-transparent",
          invalid ? "border-destructive" : "border-input",
          disabled && "opacity-50",
        )}
        style={{ height: heightPx ?? DEFAULT_HEIGHT_PX }}
      />
      <div>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={clear}>
          {clearLabel}
        </Button>
      </div>
    </div>
  );
}

export function SignatureField({ field }: FieldComponentProps) {
  const config = field as SignatureFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const { messages } = useFieldRuntime();
  const id = useId();

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
          <SignatureCanvas
            id={id}
            label={config.label}
            value={typeof rhf.value === "string" ? rhf.value : ""}
            onChange={rhf.onChange}
            onBlur={rhf.onBlur}
            disabled={disabled}
            invalid={!!fieldState.error}
            describedBy={fieldAriaDescribedBy(id, {
              description: config.description,
              error: fieldState.error,
            })}
            penColor={config.penColor}
            heightPx={config.heightPx}
            clearLabel={messages.clearSignature}
          />
        </FieldWrapper>
      )}
    />
  );
}
