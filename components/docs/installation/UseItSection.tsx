import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "use-it";
const title = "Use it";

const WHOLE_TREE_CODE = `import type { FormConfig } from "@/form-builder/core/types";
import { FormRenderer } from "@/form-builder/components/FormRenderer";
import { registerBuiltInFields } from "@/form-builder/fields";

registerBuiltInFields(); // once, e.g. app/layout.tsx — before any FormRenderer mounts

const config: FormConfig = {
  id: "contact",
  fields: [
    { type: "text", name: "name", label: "Name", required: true },
    { type: "email", name: "email", label: "Email", required: true },
    { type: "submit", name: "submit", text: "Submit" },
  ],
};

export function ContactForm() {
  return (
    <FormRenderer
      config={config}
      onSubmit={(values) => {
        // values: { name: string; email: string }
        console.log(values);
      }}
    />
  );
}`;

const SUBSET_CODE = `import { registerField } from "@/form-builder/core/registry";
import { TextField } from "@/form-builder/fields/TextField";
import { PhoneField } from "@/form-builder/fields/PhoneField";

registerField("text", TextField);
registerField("phone", PhoneField);`;

function Section() {
  return (
    <DocsSection id={id} title="4. Use it">
      <P>
        Assuming your project has the default Next.js <IC>@/*</IC> → <IC>&lt;base&gt;/*</IC> alias (swap for a
        relative import if it doesn&apos;t):
      </P>
      <CodeBlock code={WHOLE_TREE_CODE} copy />
      <P>
        Installed a subset instead (<IC>add text phone</IC>)? There&apos;s no <IC>fields/index.ts</IC> aggregate to
        call — register each installed type yourself, the same name → component mapping this repo&apos;s own{" "}
        <IC>fields/index.ts</IC> uses:
      </P>
      <CodeBlock code={SUBSET_CODE} copy />
    </DocsSection>
  );
}

export const UseItSection = { id, title, Section };
