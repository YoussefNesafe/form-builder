"use client";

import { useState } from "react";
import { registerBuiltInFields } from "@/form-builder/fields";
import { FormRenderer } from "@/form-builder/components/FormRenderer";
import type { FormConfig, FormValues } from "@/form-builder/core/types";

registerBuiltInFields();

export function DemoClient({ config }: { config: FormConfig }) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <FormRenderer config={config} onSubmit={setSubmitted} />
      {submitted && (
        <pre className="rounded-md bg-muted p-4 text-sm">{JSON.stringify(submitted, null, 2)}</pre>
      )}
    </div>
  );
}
