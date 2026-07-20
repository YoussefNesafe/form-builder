"use client";

import { useState } from "react";
import { FormRenderer, registerBuiltInFields, type FormConfig, type FormValues } from "@/form-builder";
import { examples } from "@/locales/en/examples";
import { StaticExampleBoundary } from "./StaticExampleBoundary";

registerBuiltInFields();

type ExampleFormProps = {
  config: FormConfig;
  onSendOtp?: (fieldName: string, values: FormValues) => Promise<void>;
  onVerifyOtp?: (fieldName: string, code: string) => Promise<boolean>;
};

export function ExampleForm({ config, onSendOtp, onVerifyOtp }: ExampleFormProps) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  return (
    <div className="flex flex-col gap-[5.34vw] tablet:gap-[2.5vw] desktop:gap-[1.04vw]">
      <div className="rounded-[3.204vw] tablet:rounded-[1.5vw] desktop:rounded-[0.624vw] border border-border bg-card p-[5.34vw] tablet:p-[3vw] desktop:p-[1.456vw]">
        <StaticExampleBoundary>
          <FormRenderer
            config={config}
            onSubmit={(values) => setSubmitted(values)}
            onSendOtp={onSendOtp}
            onVerifyOtp={onVerifyOtp}
          />
        </StaticExampleBoundary>
      </div>

      {submitted && (
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
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </div>
      )}

      <details className="rounded-[3.204vw] tablet:rounded-[1.5vw] desktop:rounded-[0.624vw] border border-border">
        <summary className="cursor-pointer select-none px-[4.272vw] tablet:px-[2vw] desktop:px-[0.832vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] font-medium">
          {examples.form.viewConfig}
        </summary>
        <pre
          dir="ltr"
          tabIndex={0}
          aria-label={examples.form.configJsonLabel}
          className="overflow-x-auto rounded-b-[3.204vw] tablet:rounded-b-[1.5vw] desktop:rounded-b-[0.624vw] border-t border-border bg-muted p-[3.204vw] tablet:p-[1.5vw] desktop:p-[0.624vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw]"
        >
          {JSON.stringify(config, null, 2)}
        </pre>
      </details>
    </div>
  );
}
