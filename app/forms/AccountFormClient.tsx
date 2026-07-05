"use client";

import { useState } from "react";
import { FormRenderer, registerBuiltInFields, type FormConfig, type FormValues } from "@/form-builder";

registerBuiltInFields();

// Demo-only OTP backend: any code equal to 123456 verifies.
const sendOtp = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
};
const verifyOtp = async (_fieldName: string, code: string) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return code === "123456";
};

export function AccountFormClient({ config }: { config: FormConfig }) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  return (
    <div className="mx-auto max-w-xl space-y-8 p-8">
      <FormRenderer config={config} onSubmit={setSubmitted} onSendOtp={sendOtp} onVerifyOtp={verifyOtp} />
      {submitted && (
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm" dir="ltr">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      )}
    </div>
  );
}
