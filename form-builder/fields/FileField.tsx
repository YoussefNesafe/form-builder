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
              <Upload className="me-[2.136vw] tablet:me-[1vw] desktop:me-[0.416vw] size-[4.272vw] tablet:size-[2vw] desktop:size-[0.832vw]" />
              {config.placeholder ?? config.label}
            </Button>
            {files.length > 0 && (
              <ul className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw]">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
                    <span className="truncate">{file.name}</span>
                    <span className="text-muted-foreground">{formatSize(file.size)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-[6.408vw] tablet:size-[3vw] desktop:size-[1.248vw]"
                      aria-label={messages.removeFile(file.name)}
                      onClick={() => removeFile(index)}
                    >
                      <X className="size-[3.204vw] tablet:size-[1.5vw] desktop:size-[0.624vw]" />
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
