import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "register-fields";
const title = "Register the built-in fields";

const REGISTER_FIELDS = `// e.g. app/layout.tsx, once, before any FormRenderer mounts
import { registerBuiltInFields } from "@/form-builder";

registerBuiltInFields();`;

function Section() {
  return (
    <DocsSection id={id} title="4. Register the built-in fields">
      <P>
        Field types render through a registry, not a switch statement — nothing renders until it&apos;s
        registered. Call this once, before the first <IC>FormRenderer</IC> mounts (a root layout or app entry
        point works; it&apos;s safe to call more than once):
      </P>
      <CodeBlock code={REGISTER_FIELDS} />
    </DocsSection>
  );
}

export const RegisterFieldsSection = { id, title, Section };
