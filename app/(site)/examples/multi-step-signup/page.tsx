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
          <p className="text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] text-muted-foreground">
            {t.examples.multiStepSignup.description}
          </p>
          {/*
            Not swapped to DocsInlineCode: that primitive is text-[3.471vw], this
            note is text-[3.204vw] — a genuine, deliberate size difference (see
            ExamplePageShell handoff notes), so the local classes stay.
          */}
          <p className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">
            {t.examples.multiStepSignup.notePrefix}
            <code className="rounded-[1.068vw] tablet:rounded-[0.5vw] desktop:rounded-[0.208vw] bg-muted px-[1.068vw] tablet:px-[0.5vw] desktop:px-[0.208vw] py-[0.534vw] tablet:py-[0.25vw] desktop:py-[0.104vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw]">
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
