import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "define-form";
const title = "Wrap your config in defineForm";

const CONFIG_CODE = `// config.ts
import { defineForm } from "@/form-builder";

export const signupConfig = defineForm({
  id: "signup",
  fields: [
    { type: "email", name: "email", required: true },
    { type: "number", name: "age", required: true },
    {
      // Only present once "email" is a valid address — see
      // "Conditional fields are optional keys" below.
      type: "text",
      name: "referralCode",
      visibleWhen: { field: "email", isValid: true },
    },
    { type: "submit", name: "submit", text: "Sign up" },
  ],
});`;

const VALUES_CODE = `import type { InferValues } from "@/form-builder";
import { signupConfig } from "./config";

type Values = InferValues<typeof signupConfig>;
// Hovering \`Values\` in your editor shows:
// {
//   email: string;
//   age: number;
//   referralCode?: string;
// }`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        <IC>defineForm</IC> is an identity function with one job: its type parameter is declared{" "}
        <IC>const</IC>, so TypeScript infers the <em>literal</em> type of the object you pass in — every field&apos;s{" "}
        <IC>name</IC> and <IC>type</IC> as literal strings, not widened to <IC>string</IC>. That literal type is
        exactly what <IC>InferValues</IC> needs to read.
      </P>
      <CodeBlock code={CONFIG_CODE} label="A defineForm-wrapped config" copy copyLabel="config code" />
      <P>
        <IC>submit</IC> and <IC>static</IC> fields are layout only — a <IC>submit</IC> field in the example above
        never becomes a key in <IC>Values</IC>. Everything else does.
      </P>
      <CodeBlock code={VALUES_CODE} label="Deriving the submit-payload type" copy copyLabel="InferValues code" />
    </DocsSection>
  );
}

export const DefineFormSection = { id, title, Section };
