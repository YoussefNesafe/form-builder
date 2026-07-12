"use client";

import { useMemo, useState } from "react";
import { FormRenderer, type FormValues } from "@/form-builder";
import { Alert } from "@/components/ui/alert";
import { builder } from "@/locales/en/builder";
import { fmt } from "@/locales/fmt";
import { useBuilderStore } from "./model/store";
import { useSerializedConfig } from "./model/useSerializedConfig";
import { structuralKey } from "./model/structuralKey";
import { BuilderPreviewBoundary } from "./BuilderPreviewBoundary";
import { sendOtpStub, verifyOtpStub, DEMO_OTP } from "./previewStubs";
import { PanelHeading } from "./ui/PanelHeading";
import type { BuilderNode } from "./model/types";

function hasType(nodes: BuilderNode[], type: string): boolean {
  return nodes.some((n) => n.type === type || (n.children ? hasType(n.children, type) : false));
}

/** Center pane: the form built so far, rendered live by the real engine. */
export function PreviewPanel() {
  const nodes = useBuilderStore((s) => s.nodes);
  const multiStep = useBuilderStore((s) => s.multiStep);
  const steps = useBuilderStore((s) => s.steps);
  // Tag a submission with the structural key it came from so it auto-hides once
  // the form changes shape (no reset effect needed).
  const [submission, setSubmission] = useState<{ key: string; values: FormValues } | null>(null);

  const { config, error } = useSerializedConfig();
  const key = useMemo(() => structuralKey(nodes, steps, multiStep), [nodes, steps, multiStep]);
  const submitted = submission && submission.key === key ? submission.values : null;

  return (
    <div className="flex h-full flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
      <div className="flex items-center justify-between">
        <PanelHeading>{builder.preview.heading}</PanelHeading>
        {hasType(nodes, "otp") && (
          <span className="text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
            {fmt(builder.preview.demoOtpCode, { code: DEMO_OTP })}
          </span>
        )}
      </div>

      <div className="mx-auto w-full max-w-[640px] tablet:max-w-[640px] desktop:max-w-[640px]">
        {nodes.length === 0 ? (
          <EmptyPreview />
        ) : error ? (
          <IssuesPanel message={error} />
        ) : (
          <div className="rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border bg-card p-[20px] tablet:p-[24px] desktop:p-[28px]">
            <BuilderPreviewBoundary resetKey={key + JSON.stringify(config)} fallback={(m) => <IssuesPanel message={m} />}>
              <FormRenderer
                key={key}
                config={config}
                onSubmit={(values) => setSubmission({ key, values })}
                onSendOtp={sendOtpStub}
                onVerifyOtp={verifyOtpStub}
              />
            </BuilderPreviewBoundary>
          </div>
        )}

        {submitted && (
          <div className="mt-[16px] tablet:mt-[16px] desktop:mt-[16px] flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
            <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] font-medium text-muted-foreground">
              {builder.preview.submittedValues}
            </span>
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border bg-muted p-[12px] tablet:p-[12px] desktop:p-[12px] text-[12px] tablet:text-[12px] desktop:text-[12px]"
            >
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex min-h-[240px] tablet:min-h-[240px] desktop:min-h-[240px] items-center justify-center rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-dashed border-border text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
      {builder.preview.empty}
    </div>
  );
}

function IssuesPanel({ message }: { message: string }) {
  return (
    // status/polite (not alert/assertive): validity toggles on every keystroke
    // while editing — assertive would spam screen readers.
    <Alert
      role="status"
      className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] p-[16px] tablet:p-[16px] desktop:p-[16px]"
    >
      <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium text-destructive">
        {builder.preview.invalidTitle}
      </span>
      <p className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">{message}</p>
    </Alert>
  );
}
