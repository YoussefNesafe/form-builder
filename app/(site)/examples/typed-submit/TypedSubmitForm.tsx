"use client";

import { useState } from "react";
import { FormRenderer, registerBuiltInFields } from "@/form-builder";
import { examples } from "@/locales/en/examples";
import { StaticExampleBoundary } from "@/components/examples/StaticExampleBoundary";
import { typedSubmitConfig } from "./config";
import { submitTypedForm } from "./action";

registerBuiltInFields();

export function TypedSubmitForm() {
  const [created, setCreated] = useState<{ username: string } | null>(null);

  return (
    <div className="flex flex-col gap-[5.34vw] tablet:gap-[2.5vw] desktop:gap-[1.04vw]">
      <div className="rounded-[3.204vw] tablet:rounded-[1.5vw] desktop:rounded-[0.624vw] border border-border bg-card p-[5.34vw] tablet:p-[3vw] desktop:p-[1.456vw]">
        <StaticExampleBoundary>
          <FormRenderer<typeof typedSubmitConfig>
            config={typedSubmitConfig}
            onSubmit={async (values) => {
              const result = await submitTypedForm(values);
              if (!result.ok) return result.errors;
              setCreated({ username: result.username });
            }}
          />
        </StaticExampleBoundary>
      </div>

      {created && (
        <div className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
          <span
            role="status"
            className="text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] font-medium text-muted-foreground"
          >
            {examples.form.submittedValuesLabel}
          </span>
          <pre
            dir="ltr"
            tabIndex={0}
            aria-label={examples.form.submittedValuesLabel}
            className="overflow-x-auto rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border bg-muted p-[3.204vw] tablet:p-[1.5vw] desktop:p-[0.624vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw]"
          >
            {JSON.stringify(created, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
