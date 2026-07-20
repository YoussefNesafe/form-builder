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
  return nodes.some(
    (n) => n.type === type || (n.children ? hasType(n.children, type) : false),
  );
}

export function PreviewPanel() {
  const nodes = useBuilderStore((s) => s.nodes);
  const multiStep = useBuilderStore((s) => s.multiStep);
  const steps = useBuilderStore((s) => s.steps);
  const [submission, setSubmission] = useState<{
    key: string;
    values: FormValues;
  } | null>(null);

  const { config, error } = useSerializedConfig();
  const key = useMemo(
    () => structuralKey(nodes, steps, multiStep),
    [nodes, steps, multiStep],
  );
  const submitted =
    submission && submission.key === key ? submission.values : null;

  return (
    <div className="flex h-full flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
      <div className="flex items-center justify-between">
        <PanelHeading>{builder.preview.heading}</PanelHeading>
        {hasType(nodes, "otp") && (
          <span className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground">
            {fmt(builder.preview.demoOtpCode, { code: DEMO_OTP })}
          </span>
        )}
      </div>

      <div className="mx-auto w-full max-w-[170.88vw] tablet:max-w-[80vw] desktop:max-w-[33.28vw]">
        {nodes.length === 0 ? (
          <EmptyPreview />
        ) : error ? (
          <IssuesPanel message={error} />
        ) : (
          <div className="rounded-[3.204vw] tablet:rounded-[1.5vw] desktop:rounded-[0.624vw] border border-border bg-card p-[5.34vw] tablet:p-[3vw] desktop:p-[1.456vw]">
            <BuilderPreviewBoundary
              resetKey={key + JSON.stringify(config)}
              fallback={(m) => <IssuesPanel message={m} />}
            >
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
          <div className="mt-[4.272vw] tablet:mt-[2vw] desktop:mt-[0.832vw] flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
            <span className="text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] font-medium text-muted-foreground">
              {builder.preview.submittedValues}
            </span>
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border bg-muted p-[3.204vw] tablet:p-[1.5vw] desktop:p-[0.624vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw]"
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
    <div className="flex min-h-[64.08vw] tablet:min-h-[30vw] desktop:min-h-[12.48vw] items-center justify-center rounded-[3.204vw] tablet:rounded-[1.5vw] desktop:rounded-[0.624vw] border border-dashed border-border text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">
      {builder.preview.empty}
    </div>
  );
}

function IssuesPanel({ message }: { message: string }) {
  return (
    <Alert
      role="status"
      className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] p-[4.272vw] tablet:p-[2vw] desktop:p-[0.832vw]"
    >
      <span className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] font-medium text-destructive">
        {builder.preview.invalidTitle}
      </span>
      <p className="text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
        {message}
      </p>
    </Alert>
  );
}
