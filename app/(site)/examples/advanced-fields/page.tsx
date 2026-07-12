import type { Metadata } from "next";
import { ExampleForm } from "@/components/examples/ExampleForm";
import { ExamplePageShell } from "@/components/examples/ExamplePageShell";
import { t } from "@/locales";
import { advancedFieldsConfig } from "./config";

export const metadata: Metadata = { title: t.examples.advancedFields.title };

export default function AdvancedFieldsPage() {
  return (
    <ExamplePageShell
      title={t.examples.advancedFields.title}
      description={
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          {t.examples.advancedFields.description}
        </p>
      }
    >
      <ExampleForm config={advancedFieldsConfig} />
    </ExamplePageShell>
  );
}
