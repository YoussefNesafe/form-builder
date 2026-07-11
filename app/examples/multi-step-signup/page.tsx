import type { Metadata } from "next";
import { DEMO_OTP } from "./otpStub";
import { SignupExampleForm } from "./SignupExampleForm";

export const metadata: Metadata = { title: "Multi-step signup" };

export default function MultiStepSignupPage() {
  return (
    <div className="flex flex-col gap-[20px] tablet:gap-[20px] desktop:gap-[20px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">
          Multi-step signup
        </h1>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          Account details with a confirm-password check, email OTP verification, then a read-only review step
          with per-step edit links.
        </p>
        <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
          Demo only — there is no real email backend here. Enter{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[12px] tablet:text-[12px] desktop:text-[12px]">
            {DEMO_OTP}
          </code>{" "}
          as the verification code.
        </p>
      </div>
      <SignupExampleForm />
    </div>
  );
}
