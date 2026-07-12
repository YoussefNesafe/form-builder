import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection } from "@/components/docs/DocsProse";

const id = "write-config";
const title = "Write the config";

const FORM_CODE = `import type { FormConfig } from "@/form-builder";

export const firstFormConfig: FormConfig = {
  id: "your-first-form",
  fields: [
    { type: "text", name: "name", label: "Name", required: true },
    { type: "email", name: "email", label: "Email", required: true },
    { type: "submit", name: "submit", text: "Submit" },
  ],
};`;

function Section() {
  return (
    <DocsSection id={id} title="1. Write the config">
      <CodeBlock code={FORM_CODE} />
    </DocsSection>
  );
}

export const WriteConfigSection = { id, title, Section };
