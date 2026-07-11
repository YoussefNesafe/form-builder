import type { Metadata } from "next";
import Link from "next/link";
import { ExampleForm } from "@/components/examples/ExampleForm";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { firstFormConfig } from "./config";

export const metadata: Metadata = { title: "Your first form" };

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
    <div className="flex flex-col gap-[28px] tablet:gap-[28px] desktop:gap-[28px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">
          Your first form
        </h1>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          A <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">FormConfig</code>{" "}
          is a plain object — no builder, no schema file to hand-write separately. This one has two fields and a
          submit button.
        </p>
      </div>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <h2 className="text-[17px] tablet:text-[17px] desktop:text-[17px] font-semibold tracking-tight">
          1. Write the config
        </h2>
        <CodeBlock code={FORM_CODE} />
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <h2 className="text-[17px] tablet:text-[17px] desktop:text-[17px] font-semibold tracking-tight">
          2. Render it
        </h2>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          Pass the config to{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            FormRenderer
          </code>{" "}
          with an{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            onSubmit
          </code>
          . Nothing is sent anywhere by the engine itself — you own what happens with the values.
        </p>
        <CodeBlock code={RENDER_CODE} />
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <h2 className="text-[17px] tablet:text-[17px] desktop:text-[17px] font-semibold tracking-tight">
          3. Try it
        </h2>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          This is the exact config above, rendered by the real{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            FormRenderer
          </code>{" "}
          — leave a field blank and submit to see validation kick in.
        </p>
        <ExampleForm config={firstFormConfig} />
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <h2 className="text-[17px] tablet:text-[17px] desktop:text-[17px] font-semibold tracking-tight">
          What you got for free
        </h2>
        <ul className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          <li>
            <strong className="text-foreground">Zod validation</strong> — a schema is derived from the config
            (each field&apos;s <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">required</code>,
            type, and rules), never hand-duplicated in a separate schema file. The email field is checked for
            email format automatically.
          </li>
          <li>
            <strong className="text-foreground">Error messages</strong> — human-readable, out of the box, wired
            to each field via <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">aria-describedby</code>{" "}
            for screen readers. Override any of them with a{" "}
            <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
              messages
            </code>{" "}
            prop on <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">FormRenderer</code>.
          </li>
          <li>
            <strong className="text-foreground">Grid layout</strong> — every field defaults to a full-width row
            in a 12-column responsive grid. Set{" "}
            <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
              width: &quot;half&quot;
            </code>{" "}
            (or a per-breakpoint object) on a field to change that.
          </li>
        </ul>
      </section>

      <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
        Conditional fields, multi-step wizards, and cross-field rules aren&apos;t covered here — see{" "}
        <Link href="/examples" className="underline underline-offset-2 hover:text-foreground">
          Examples
        </Link>{" "}
        for those working live. For the full list of field types, see{" "}
        <Link href="/docs/field-types" className="underline underline-offset-2 hover:text-foreground">
          Field types
        </Link>
        .
      </p>
    </div>
  );
}
