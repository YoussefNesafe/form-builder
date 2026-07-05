"use client";

import {
  FormRenderer,
  registerBuiltInFields,
  useOtpController,
  type FormConfig,
  type FormValues,
  type UseOtpControllerOptions,
} from "@/form-builder";

registerBuiltInFields();

const delay = () => new Promise((resolve) => setTimeout(resolve, 500));

// Demo-only backends — two distinct "APIs", both accepting 123456.
const emailOtpApi = {
  send: async (email: unknown) => {
    console.log("email OTP →", email);
    await delay();
  },
  verify: async (code: string) => {
    await delay();
    return code === "123456";
  },
};

const phoneOtpApi = {
  send: async (phone: unknown) => {
    console.log("phone OTP →", phone);
    await delay();
  },
  verify: async (code: string) => {
    await delay();
    return code === "123456";
  },
};

// Module-level so the handler map identity stays stable across renders.
const otpHandlers: UseOtpControllerOptions["fields"] = {
  emailOtp: { send: (values) => emailOtpApi.send(values.email), verify: emailOtpApi.verify },
  otp: { send: (values) => phoneOtpApi.send(values.phone), verify: phoneOtpApi.verify },
};

export function AccountFormClient({ config }: { config: FormConfig }) {
  const otp = useOtpController({ fields: otpHandlers });
  const onSubmit = (values: FormValues) => {
    console.log({ values });
  };
  return (
    <div className="mx-auto max-w-xl space-y-8 p-8">
      <FormRenderer config={config} onSubmit={onSubmit} otp={otp} />
    </div>
  );
}
