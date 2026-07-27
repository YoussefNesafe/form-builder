"use client";

import { useId, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { acceptedFormatsLabel } from "../core/fileAccept";
import { BYTES_PER_KB, BYTES_PER_MB } from "../core/units";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";
import { FileDropzone } from "../ui/FileDropzone";

type FileFieldConfig = Extract<FieldConfig, { type: "file" }>;

const MIN_DISPLAYED_KB = 1;

function formatSize(bytes: number): string {
  if (bytes >= BYTES_PER_MB) return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
  return `${Math.max(MIN_DISPLAYED_KB, Math.round(bytes / BYTES_PER_KB))} KB`;
}

/** What react-hook-form actually hands back for a file field. See `readFileErrors`. */
type RawFileError = { message?: string } & ArrayLike<{ message?: string } | undefined>;

type FileErrors = {
  /** Why the file at `index` was rejected, or undefined when nothing is wrong with it. */
  reasonAt: (index: number) => string | undefined;
  /** What the field-level error region should show, in `FieldWrapper`'s shape. */
  fieldError: { message: string } | undefined;
};

const NO_FILE_ERRORS: FileErrors = { reasonAt: () => undefined, fieldError: undefined };

/**
 * The one place this component reads react-hook-form's error for a file field,
 * and the one place the cast that makes that possible lives.
 *
 * RHF types `fieldState.error` as a `FieldError` — an object with a `message`.
 * A multi-file field does not produce that. `core/validation.ts` reports one
 * issue per index, and RHF maps those onto a *sparse array* keyed by index
 * (measured: `Object.keys` returns only the failing indices, and the array's
 * own `message` is `undefined`). Reading `.message` off it — which is what this
 * component used to pass straight to `FieldWrapper` — therefore rendered
 * nothing at all for every multi-file rejection.
 *
 * Three shapes reach here, and each has a test that renders it:
 * - a sparse array, from per-index issues on a multi-file field;
 * - a plain `FieldError`, from a single-file field, whose one message is that
 *   one file's reason (its issues are reported at the field's own path);
 * - a plain `FieldError`, from a list-level rule on a multi-file field, which
 *   today means only `min(1)` — emptying a required list.
 *
 * `multiple` is what tells the last two apart. Note what it is and is not: with
 * `min(1)` as the only list-level rule, a list-level message and a rendered row
 * cannot coexist — the rule fails only on an empty list — so nothing observable
 * changes if the check is dropped, and no test can defend it. It is here for
 * the next list-level rule (a cap on how many files, say), which would
 * otherwise surface as the first file's own rejection reason. Add one, and
 * write the test this check has no way to earn today.
 *
 * Only the *first* issue per path survives RHF's default `criteriaMode:
 * "firstError"`, which is why a file that is both the wrong type and too large
 * reports the type — `fileIssueReporter` emits type first deliberately.
 */
function readFileErrors(error: unknown, multiple: boolean | undefined): FileErrors {
  const raw = error as RawFileError | undefined;
  if (!raw) return NO_FILE_ERRORS;

  if (!Array.isArray(raw)) {
    const { message } = raw;
    if (!message) return NO_FILE_ERRORS;
    return {
      reasonAt: (index) => (multiple || index !== 0 ? undefined : message),
      fieldError: { message },
    };
  }

  const perFile = raw as ArrayLike<{ message?: string } | undefined>;
  const reasonAt = (index: number) => perFile[index]?.message;
  // The field-level region repeats the first rejection rather than summarising
  // the set. It is the only part of the field with `role="alert"`, so it is what
  // announces that something went wrong, and a concrete sentence says more than
  // a count; every reason is still on its own row for the rest.
  //
  // Accepted cost: with one file rejected, that sentence is on screen twice and
  // spoken twice — once by the alert, once by the row it also sits in. The
  // alternative is a count ("1 file can't be uploaded"), which announces without
  // saying anything and sends the user hunting for the row. Repetition is the
  // cheaper of the two, but it is a real cost, not an oversight: if this field
  // ever grows a summary line, that is the thing to reach for instead.
  let first: string | undefined;
  for (let index = 0; index < perFile.length && first === undefined; index += 1) {
    first = reasonAt(index);
  }
  return { reasonAt, fieldError: first ? { message: first } : undefined };
}

/**
 * ## Rejected files are kept, not refused
 *
 * A file that fails `accept` or `maxSizeMB` still enters the value and renders
 * as a rejected row carrying its own reason. Dropping it on the floor would be
 * easier, but the schema only has something to say about files that are *in*
 * the value — refuse them at the door and the user gets silence where the
 * reason should be, plus a field that looks empty for no stated cause.
 *
 * Nothing is read from the file to decide this. A `File` is a handle, and the
 * engine never opens it: uploading is the host's job, in `onSubmit`, which a
 * rejected file never reaches because the field is invalid. So an oversized
 * file is turned away before anything processes it, and is still able to
 * explain itself.
 */
export function FileField({ field }: FieldComponentProps) {
  const config = field as FileFieldConfig;
  const { control, trigger } = useFormContext();
  const disabled = useFieldDisabled(config);
  const { messages } = useFieldRuntime();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const hint = messages.fileHint(acceptedFormatsLabel(config.accept), config.maxSizeMB);

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
        const errors = readFileErrors(fieldState.error, config.multiple);

        // Both refs want the same node: react-hook-form's, so it can focus the
        // field when a submit fails, and ours, so removing a row can put focus
        // back somewhere that exists. Declared per render, so React detaches and
        // reattaches it every time — which costs nothing here: RHF's own ref
        // ignores a null argument, and `inputRef` is only ever read from an
        // event handler, long after the commit has settled it on the node.
        const setInputRef = (node: HTMLInputElement | null) => {
          inputRef.current = node;
          rhf.ref(node);
        };

        const acceptFiles = (incoming: File[]) => {
          rhf.onChange(config.multiple ? [...files, ...incoming] : (incoming[0] ?? undefined));
          void trigger(config.name);
        };

        const removeFile = (index: number) => {
          rhf.onChange(config.multiple ? files.filter((_, i) => i !== index) : undefined);
          // The removed row held the focus, so without this it lands on <body>
          // and a keyboard user restarts from the top of the page.
          inputRef.current?.focus();
          void trigger(config.name);
        };

        return (
          <FieldWrapper
            id={id}
            label={config.label}
            description={config.description}
            required={config.required}
            disabled={disabled}
            error={errors.fieldError}
          >
            <FileDropzone
              ref={setInputRef}
              id={id}
              prompt={config.placeholder ?? messages.dropFiles}
              hint={hint}
              accept={config.accept}
              multiple={config.multiple}
              disabled={disabled}
              invalid={!!errors.fieldError}
              describedBy={fieldAriaDescribedBy(id, {
                description: config.description,
                error: errors.fieldError,
              })}
              onFiles={acceptFiles}
              onBlur={rhf.onBlur}
            />
            {/*
             * Rendered whether or not there are files, because a live region
             * has to be in the document *before* its content changes for the
             * change to be announced — created and populated in the same commit,
             * the first selection would go unspoken.
             */}
            <p
              role="status"
              className="text-[var(--fb-space-7,3.738vw)] tablet:text-[var(--fb-space-7-tablet,1.75vw)] desktop:text-[var(--fb-space-7-desktop,0.728vw)] text-muted-foreground"
            >
              {files.length > 0 ? messages.filesSelected(files.length) : ""}
            </p>
            {files.length > 0 && (
              <ul className="flex flex-col gap-[var(--fb-space-3,1.602vw)] tablet:gap-[var(--fb-space-3-tablet,0.75vw)] desktop:gap-[var(--fb-space-3-desktop,0.312vw)] text-[var(--fb-space-7,3.738vw)] tablet:text-[var(--fb-space-7-tablet,1.75vw)] desktop:text-[var(--fb-space-7-desktop,0.728vw)]">
                {files.map((file, index) => (
                  <FileRow
                    key={`${file.name}-${file.size}-${index}`}
                    file={file}
                    reason={errors.reasonAt(index)}
                    disabled={disabled}
                    removeLabel={messages.removeFile(file.name)}
                    rejectedText={messages.fileRejected}
                    onRemove={() => removeFile(index)}
                  />
                ))}
              </ul>
            )}
          </FieldWrapper>
        );
      }}
    />
  );
}

type FileRowProps = {
  file: File;
  /** Present exactly when this file is the reason the field is invalid. */
  reason: string | undefined;
  disabled: boolean;
  removeLabel: string;
  rejectedText: (reason: string) => string;
  onRemove: () => void;
};

function FileRow({ file, reason, disabled, removeLabel, rejectedText, onRemove }: FileRowProps) {
  return (
    <li
      data-slot="file-row"
      data-rejected={reason ? "" : undefined}
      className="flex flex-col gap-[var(--fb-space-1,0.534vw)] tablet:gap-[var(--fb-space-1-tablet,0.25vw)] desktop:gap-[var(--fb-space-1-desktop,0.104vw)]"
    >
      <div className="flex items-center gap-[var(--fb-space-4,2.136vw)] tablet:gap-[var(--fb-space-4-tablet,1vw)] desktop:gap-[var(--fb-space-4-desktop,0.416vw)]">
        <span className="truncate">{file.name}</span>
        {/* Mono, like every other machine-generated value in this codebase. */}
        <span className="font-mono text-muted-foreground">{formatSize(file.size)}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="ms-auto size-[var(--fb-space-12,6.408vw)] tablet:size-[var(--fb-space-12-tablet,3vw)] desktop:size-[var(--fb-space-12-desktop,1.248vw)]"
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <X className="size-[var(--fb-space-6,3.204vw)] tablet:size-[var(--fb-space-6-tablet,1.5vw)] desktop:size-[var(--fb-space-6-desktop,0.624vw)]" />
        </Button>
      </div>
      {/*
       * The verdict is a sentence in the row, not a red border on it: read
       * aloud, the row is "scan.tiff, 1 KB, Rejected: scan.tiff isn't in a
       * format we accept (TIFF) — please upload PDF". The colour is the
       * duplicate channel here, not the only one.
       */}
      {reason && <span className="text-destructive">{rejectedText(reason)}</span>}
    </li>
  );
}
