import type { Metadata } from "next";
import Link from "next/link";
import { ExampleForm } from "@/components/examples/ExampleForm";
import { CodeBlock } from "@/components/docs/CodeBlock";
import {
  DocsIntro,
  DocsSection,
  DocsFootnote,
  DocsBody as P,
  DocsInlineCode as IC,
} from "@/components/docs/DocsProse";
import type { TocItem } from "@/components/docs/DocsToc";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { t } from "@/locales";
import { firstFormConfig } from "./config";

export const metadata: Metadata = { title: t.docs.nav.pages.yourFirstForm };

const TOC_ITEMS: TocItem[] = [
  { id: "write-config", title: "Write the config" },
  { id: "render-it", title: "Render it" },
  { id: "try-it", title: "Try it" },
  { id: "what-you-get", title: "What you got for free" },
];

const FORM_CODE = `import type { FormConfig } from "@/form-builder";

export const firstFormConfig: FormConfig = {
  id: "your-first-form",
  fields: [
    { type: "text", name: "name", label: "Name", required: true },
    { type: "email", name: "email", label: "Email", required: true },
    { type: "submit", name: "submit", text: "Submit" },
  ],
};`;

const RENDER_CODE = `import { FormRenderer } from "@/form-builder";
import { firstFormConfig } from "./config";

export function SignupForm() {
  return (
    <FormRenderer
      config={firstFormConfig}
      onSubmit={(values) => {
        // values: { name: string; email: string }
        console.log(values);
      }}
    />
  );
}`;

/**
 * Tutorial: build the smallest possible FormConfig, render it with
 * FormRenderer, and see what the engine did for free. Deeper wiring
 * (conditions, wizards, cross-field rules) is deliberately out of scope —
 * see /examples for those.
 */
export default function YourFirstFormPage() {
  return (
    <DocsPageShell toc={TOC_ITEMS}>
      <DocsIntro title={t.docs.nav.pages.yourFirstForm}>
        A <IC>FormConfig</IC> is a plain object — no builder, no schema file to hand-write separately. This one
        has two fields and a submit button.
      </DocsIntro>

      <DocsSection id="write-config" title="1. Write the config">
        <CodeBlock code={FORM_CODE} />
      </DocsSection>

      <DocsSection id="render-it" title="2. Render it">
        <P>
          Pass the config to <IC>FormRenderer</IC> with an <IC>onSubmit</IC>. Nothing is sent anywhere by the
          engine itself — you own what happens with the values.
        </P>
        <CodeBlock code={RENDER_CODE} />
      </DocsSection>

      <DocsSection id="try-it" title="3. Try it">
        <P>
          This is the exact config above, rendered by the real <IC>FormRenderer</IC> — leave a field blank and
          submit to see validation kick in.
        </P>
        <ExampleForm config={firstFormConfig} />
      </DocsSection>

      <DocsSection id="what-you-get" title="What you got for free">
        <ul className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-[15px] tablet:text-[15px] desktop:text-[15px] leading-[25px] tablet:leading-[25px] desktop:leading-[25px] text-muted-foreground">
          <li>
            <strong className="text-foreground">Zod validation</strong> — a schema is derived from the config
            (each field&apos;s <IC>required</IC>, type, and rules), never hand-duplicated in a separate schema
            file. The email field is checked for email format automatically.
          </li>
          <li>
            <strong className="text-foreground">Error messages</strong> — human-readable, out of the box, wired
            to each field via <IC>aria-describedby</IC> for screen readers. Override any of them with a{" "}
            <IC>messages</IC> prop on <IC>FormRenderer</IC>.
          </li>
          <li>
            <strong className="text-foreground">Grid layout</strong> — every field defaults to a full-width row
            in a 12-column responsive grid. Set <IC>width: &quot;half&quot;</IC> (or a per-breakpoint object) on a
            field to change that.
          </li>
        </ul>
      </DocsSection>

      <DocsFootnote>
        Conditional fields, multi-step wizards, and cross-field rules aren&apos;t covered here — see{" "}
        <Link href="/examples" className="underline underline-offset-2 hover:text-foreground">
          Examples
        </Link>{" "}
        for those working live. For the full list of field types, see{" "}
        <Link href="/docs/field-types" className="underline underline-offset-2 hover:text-foreground">
          Field types
        </Link>
        .
      </DocsFootnote>
    </DocsPageShell>
  );
}
