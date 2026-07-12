import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "render-it";
const title = "Render it";

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

function Section() {
  return (
    <DocsSection id={id} title="2. Render it">
      <P>
        Pass the config to <IC>FormRenderer</IC> with an <IC>onSubmit</IC>. Nothing is sent anywhere by the
        engine itself — you own what happens with the values.
      </P>
      <CodeBlock code={RENDER_CODE} />
    </DocsSection>
  );
}

export const RenderItSection = { id, title, Section };
