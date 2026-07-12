import type { Metadata } from "next";
import { ExamplePageShell } from "@/components/examples/ExamplePageShell";
import { t } from "@/locales";
import { DEMO_OTP } from "./otpStub";
import { SignupExampleForm } from "./SignupExampleForm";

export const metadata: Metadata = { title: t.examples.multiStepSignup.title };

export default function MultiStepSignupPage() {
  return (
    <ExamplePageShell
      title={t.examples.multiStepSignup.title}
      description={
        <>
          <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
            {t.examples.multiStepSignup.description}
          </p>
          {/*
            Not swapped to DocsInlineCode: that primitive is text-[13px], this
            note is text-[12px] — a genuine, deliberate size difference (see
            ExamplePageShell handoff notes), so the local classes stay.
          */}
          <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
            {t.examples.multiStepSignup.notePrefix}
            <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[12px] tablet:text-[12px] desktop:text-[12px]">
              {DEMO_OTP}
            </code>
            {t.examples.multiStepSignup.noteSuffix}
          </p>
        </>
      }
    >
      <SignupExampleForm />
    </ExamplePageShell>
  );
}
