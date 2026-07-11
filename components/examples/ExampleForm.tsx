"use client";

import { useState } from "react";
import { FormRenderer, registerBuiltInFields, type FormConfig, type FormValues } from "@/form-builder";
import { FormBoundary } from "./FormBoundary";

// Field runtime must be registered before any FormRenderer mounts. Safe to
// call more than once (registerField just overwrites the same map entry) —
// every /examples page importing this module re-runs it harmlessly.
registerBuiltInFields();

type ExampleFormProps = {
  config: FormConfig;
  onSendOtp?: (fieldName: string, values: FormValues) => Promise<void>;
  onVerifyOtp?: (fieldName: string, code: string) => Promise<boolean>;
};

/**
 * Live form + submitted-payload readout + collapsible config source, shared
 * by every /examples page: the actual engine (`FormRenderer` from the
 * package's public API), not a mock.
 */
export function ExampleForm({ config, onSendOtp, onVerifyOtp }: ExampleFormProps) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  return (
    <div className="flex flex-col gap-[20px] tablet:gap-[20px] desktop:gap-[20px]">
      <div className="rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border bg-card p-[20px] tablet:p-[24px] desktop:p-[28px]">
        <FormBoundary>
          <FormRenderer
            config={config}
            onSubmit={(values) => setSubmitted(values)}
            onSendOtp={onSendOtp}
            onVerifyOtp={onVerifyOtp}
          />
        </FormBoundary>
      </div>

      {submitted && (
        <div className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
          <span
            role="status"
            className="text-[12px] tablet:text-[12px] desktop:text-[12px] font-medium text-muted-foreground"
          >
            Submitted values
          </span>
          <pre
            dir="ltr"
            tabIndex={0}
            aria-label="Submitted values"
            className="overflow-x-auto rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border bg-muted p-[12px] tablet:p-[12px] desktop:p-[12px] text-[12px] tablet:text-[12px] desktop:text-[12px]"
          >
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </div>
      )}

      <details className="rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border">
        <summary className="cursor-pointer select-none px-[16px] tablet:px-[16px] desktop:px-[16px] py-[10px] tablet:py-[10px] desktop:py-[10px] text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium">
          View config
        </summary>
        <pre
          dir="ltr"
          tabIndex={0}
          aria-label="Config JSON"
          className="overflow-x-auto rounded-b-[12px] tablet:rounded-b-[12px] desktop:rounded-b-[12px] border-t border-border bg-muted p-[12px] tablet:p-[12px] desktop:p-[12px] text-[12px] tablet:text-[12px] desktop:text-[12px]"
        >
          {JSON.stringify(config, null, 2)}
        </pre>
      </details>
    </div>
  );
}
