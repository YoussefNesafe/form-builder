"use client";

import { useState } from "react";
import { FormRenderer, registerBuiltInFields, type FormConfig, type FormValues } from "@/form-builder";

registerBuiltInFields();

export function DemoClient({ config }: { config: FormConfig }) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);
  const [rtl, setRtl] = useState(false);
  const [dark, setDark] = useState(false);

  return (
    <div dir={rtl ? "rtl" : "ltr"} className={dark ? "dark bg-background text-foreground" : ""}>
      <div className="mx-auto max-w-2xl space-y-8 p-8">
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={() => setRtl((previous) => !previous)}
          >
            {rtl ? "LTR" : "RTL"}
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={() => setDark((previous) => !previous)}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
        <FormRenderer config={config} onSubmit={setSubmitted} />
        {submitted && (
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm" dir="ltr">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
