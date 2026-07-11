import type { AnyFieldConfig } from "./types";

/**
 * What onSubmit may return (or resolve to) to report API-side failures.
 * fieldErrors keys are field names — group rows use the RHF path form
 * ("team.0.role"). Unknown names fold into the form-level error.
 */
export type ServerErrorResult = {
  fieldErrors?: Record<string, string>;
  formError?: string;
};

export type AppliedServerErrors = {
  /** Field names that received an error, in field-config order. */
  applied: string[];
  /** formError plus any unknown-name entries, undefined when neither exists. */
  formError?: string;
};

type SetServerError = (name: string, error: { type: string; message: string }) => void;

/**
 * Map an API error payload onto RHF field errors. Standalone so headless
 * useDynamicForm hosts can call it with form.setError directly; FormRenderer
 * wires it into its submit handling.
 *
 * Errors are set with type "server"; the resolver clears them the next time
 * the field revalidates (change/blur/submit).
 */
export function applyServerErrors(
  setError: SetServerError,
  result: ServerErrorResult,
  fields: AnyFieldConfig[],
): AppliedServerErrors {
  const indexByRoot = new Map(fields.map((field, index) => [field.name, index]));
  const applied: [number, string][] = [];
  const unknown: string[] = [];

  for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
    // Group rows arrive as "team.0.role" — known when the ROOT is a field.
    const root = name.split(".")[0];
    const index = indexByRoot.get(root);
    if (index === undefined) {
      unknown.push(message);
      continue;
    }
    setError(name, { type: "server", message });
    applied.push([index, name]);
  }

  applied.sort(([a], [b]) => a - b);
  const formErrorParts = [result.formError, ...unknown].filter(
    (part): part is string => part !== undefined && part !== "",
  );
  return {
    applied: applied.map(([, name]) => name),
    formError: formErrorParts.length > 0 ? formErrorParts.join("; ") : undefined,
  };
}
