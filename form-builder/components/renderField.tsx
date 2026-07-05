"use client";

import { getField } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { FieldGate } from "./FieldRuntime";

// Static strings — Tailwind cannot see dynamically built class names.
const colSpanClass: Record<NonNullable<FieldConfig["colSpan"]>, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
};

export function renderField(field: FieldConfig) {
  const Component = getField(field.type);

  if (!Component) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div key={field.name} className="col-span-4 border border-destructive p-2 text-destructive">
        Unknown field type &quot;{field.type}&quot;
      </div>
    );
  }

  // FieldGate outermost: a condition-hidden field must not leave an empty
  // grid cell behind; hidden fields render no cell at all.
  return (
    <FieldGate key={field.name} field={field}>
      {field.type === "hidden" ? (
        <Component field={field} />
      ) : (
        <div className={colSpanClass[field.colSpan ?? 4]}>
          <Component field={field} />
        </div>
      )}
    </FieldGate>
  );
}
