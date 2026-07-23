import type { Metadata } from "next";
import { ExamplePageShell } from "@/components/examples/ExamplePageShell";
import { t } from "@/locales";
import { TAKEN_EMAIL } from "./demoEmail";
import { TypedSubmitForm } from "./TypedSubmitForm";

export const metadata: Metadata = { title: t.examples.typedSubmit.title };

export default function TypedSubmitPage() {
  return (
    <ExamplePageShell
      title={t.examples.typedSubmit.title}
      description={
        <>
          <p className="text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] text-muted-foreground">
            {t.examples.typedSubmit.description}
          </p>
          <p className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">
            {t.examples.typedSubmit.notePrefix}
            <code className="rounded-[1.068vw] tablet:rounded-[0.5vw] desktop:rounded-[0.208vw] bg-muted px-[1.068vw] tablet:px-[0.5vw] desktop:px-[0.208vw] py-[0.534vw] tablet:py-[0.25vw] desktop:py-[0.104vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw]">
              {TAKEN_EMAIL}
            </code>
            {t.examples.typedSubmit.noteSuffix}
          </p>
        </>
      }
    >
      <TypedSubmitForm />
    </ExamplePageShell>
  );
}
