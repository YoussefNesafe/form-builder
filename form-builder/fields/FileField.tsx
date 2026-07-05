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
  const { control, setError, clearErrors } = useFormContext();
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

        const acceptFiles = (incoming: File[]) => {
          if (config.maxSizeMB !== undefined) {
            const maxBytes = config.maxSizeMB * 1024 * 1024;
            if (incoming.some((file) => file.size > maxBytes)) {
              setError(config.name, { type: "fileSize", message: messages.fileSize(config.maxSizeMB) });
              return;
            }
          }
          clearErrors(config.name);
          rhf.onChange(config.multiple ? [...files, ...incoming] : (incoming[0] ?? undefined));
        };

        const removeFile = (index: number) => {
          if (config.multiple) {
            rhf.onChange(files.filter((_, i) => i !== index));
          } else {
            rhf.onChange(undefined);
          }
          if (inputRef.current) inputRef.current.value = "";
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
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="w-fit"
            >
              <Upload className="me-2 size-4" />
              {config.placeholder ?? config.label}
            </Button>
            {files.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center gap-2">
                    <span className="truncate">{file.name}</span>
                    <span className="text-muted-foreground">{formatSize(file.size)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      aria-label={messages.removeFile(file.name)}
                      onClick={() => removeFile(index)}
                    >
                      <X className="size-3" />
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
