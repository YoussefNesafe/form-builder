import type { Metadata } from "next";
import { ExampleForm } from "@/components/examples/ExampleForm";
import { ExamplePageShell } from "@/components/examples/ExamplePageShell";
import { t } from "@/locales";
import { conditionalProfileConfig } from "./config";

export const metadata: Metadata = { title: t.examples.conditionalProfile.title };

export default function ConditionalProfilePage() {
  return (
    <ExamplePageShell
      title={t.examples.conditionalProfile.title}
      description={
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          {t.examples.conditionalProfile.description}
        </p>
      }
    >
      <ExampleForm config={conditionalProfileConfig} />
    </ExamplePageShell>
  );
}
