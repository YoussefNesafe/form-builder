"use client";

import { useState } from "react";
import { FormRenderer, registerBuiltInFields, type FormConfig, type FormValues } from "@/form-builder";

registerBuiltInFields();

export function AccountFormClient({ config }: { config: FormConfig }) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  return (
    <div className="mx-auto max-w-xl space-y-8 p-8">
      <FormRenderer config={config} onSubmit={setSubmitted} />
      {submitted && (
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm" dir="ltr">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      )}
    </div>
  );
}
