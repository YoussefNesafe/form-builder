"use client";

import { getField } from "../core/registry";
import type { AnyFieldConfig } from "../core/types";
import { fieldWidthClass } from "../ui/variants";
import { FieldGate } from "./FieldRuntime";

export function renderField(field: AnyFieldConfig) {
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
        <div className={fieldWidthClass(field.width)}>
          <Component field={field} />
        </div>
      )}
    </FieldGate>
  );
}
