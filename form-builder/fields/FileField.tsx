"use client";

import { useId, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper } from "../ui/FieldWrapper";

type FileFieldConfig = Extract<FieldConfig, { type: "file" }>;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function FileField({ field }: FieldComponentProps) {
  const config = field as FileFieldConfig;
  const { control, trigger } = useFormContext();
  const disabled = useFieldDisabled(config);
  const { messages } = useFieldRuntime();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // File values are not JSON-serializable — consumers handle upload in onSubmit.
  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => {
        const files: File[] = config.multiple
          ? Array.isArray(rhf.value)
            ? (rhf.value as File[])
            : []
          : rhf.value instanceof File
            ? [rhf.value]
            : [];

        // Oversize files go INTO form state and the schema reports them — a
        // manual setError would be wiped by the next resolver run.
        const acceptFiles = (incoming: File[]) => {
          rhf.onChange(config.multiple ? [...files, ...incoming] : (incoming[0] ?? undefined));
          void trigger(config.name);
        };

        const removeFile = (index: number) => {
          if (config.multiple) {
            rhf.onChange(files.filter((_, i) => i !== index));
          } else {
            rhf.onChange(undefined);
          }
          if (inputRef.current) inputRef.current.value = "";
          // Clears a stale size error immediately — onTouched only
          // revalidates on change after the field was blurred once.
          void trigger(config.name);
        };

        return (
          <FieldWrapper
            id={id}
            label={config.label}
            description={config.description}
            required={config.required}
            disabled={disabled}
            error={fieldState.error}
          >
            <input
              ref={inputRef}
              id={id}
              type="file"
              accept={config.accept}
              multiple={config.multiple}
              disabled={disabled}
              className="sr-only"
              onChange={(event) => {
                const incoming = Array.from(event.target.files ?? []);
                if (incoming.length) acceptFiles(incoming);
                // Reset so re-selecting the same file fires change again.
                event.target.value = "";
              }}
              onBlur={rhf.onBlur}
            />
            <Button
              ref={rhf.ref}
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="w-fit"
            >
              <Upload className="me-[var(--fb-space-4,2.136vw)] tablet:me-[var(--fb-space-4-tablet,1vw)] desktop:me-[var(--fb-space-4-desktop,0.416vw)] size-[var(--fb-space-8,4.272vw)] tablet:size-[var(--fb-space-8-tablet,2vw)] desktop:size-[var(--fb-space-8-desktop,0.832vw)]" />
              {config.placeholder ?? config.label}
            </Button>
            {files.length > 0 && (
              <ul className="flex flex-col gap-[var(--fb-space-2,1.068vw)] tablet:gap-[var(--fb-space-2-tablet,0.5vw)] desktop:gap-[var(--fb-space-2-desktop,0.208vw)] text-[var(--fb-space-7,3.738vw)] tablet:text-[var(--fb-space-7-tablet,1.75vw)] desktop:text-[var(--fb-space-7-desktop,0.728vw)]">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center gap-[var(--fb-space-4,2.136vw)] tablet:gap-[var(--fb-space-4-tablet,1vw)] desktop:gap-[var(--fb-space-4-desktop,0.416vw)]">
                    <span className="truncate">{file.name}</span>
                    <span className="text-muted-foreground">{formatSize(file.size)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-[var(--fb-space-12,6.408vw)] tablet:size-[var(--fb-space-12-tablet,3vw)] desktop:size-[var(--fb-space-12-desktop,1.248vw)]"
                      aria-label={messages.removeFile(file.name)}
                      onClick={() => removeFile(index)}
                    >
                      <X className="size-[var(--fb-space-6,3.204vw)] tablet:size-[var(--fb-space-6-tablet,1.5vw)] desktop:size-[var(--fb-space-6-desktop,0.624vw)]" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </FieldWrapper>
        );
      }}
    />
  );
}
