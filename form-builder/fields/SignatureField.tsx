"use client";

import { useEffect, useId, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  // The pad lives outside React's render cycle; keep the latest callbacks
  // reachable from its stable event listener (synced post-render — writing
  // refs during render is forbidden).
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  });
  // Mount-time value only — used to restore a signed value after remount.
  const initialValueRef = useRef(value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = new SignaturePad(canvas, penColor ? { penColor } : undefined);
    padRef.current = pad;

    const handleEndStroke = () => {
      onChangeRef.current(pad.toDataURL("image/png"));
      // A stroke is the field's interaction — mark touched like a blur would.
      onBlurRef.current();
    };
    pad.addEventListener("endStroke", handleEndStroke);

    // devicePixelRatio-aware sizing; strokes are kept as point data and
    // redrawn so a container resize does not wipe the drawing.
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = pad.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.fromData(data);
    };
    resize();
    // Wizard steps unmount fields; restore a previously signed value.
    if (initialValueRef.current) void pad.fromDataURL(initialValueRef.current);
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

  // External reset (form.reset(), setValue("")) must wipe the ink too.
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
    <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
      <canvas
        ref={canvasRef}
        id={id}
        role="img"
        aria-label={label}
        aria-describedby={describedBy}
        // aria-invalid is not valid on role="img" — the error state is
        // conveyed by the destructive border and the described-by error text.
        className={cn(
          "w-full touch-none rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border bg-transparent",
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
