import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "import-entry-point";
const title = "Import from the entry point";

const IMPORT_RULE = `// Correct — the package's one public entry point
import { FormRenderer, useDynamicForm } from "@/form-builder";

// Wrong — nothing outside index.ts is a supported import path
import { FormRenderer } from "@/form-builder/components/FormRenderer";`;

function Section() {
  return (
    <DocsSection id={id} title="6. Import only from the package entry point">
      <P>
        <IC>form-builder/index.ts</IC> is the package&apos;s only supported import path — it&apos;s the public
        API surface (<IC>FormRenderer</IC>, <IC>useDynamicForm</IC>, types, and the rest of the exports live
        there). Reaching into <IC>form-builder/core</IC> or <IC>form-builder/fields</IC> directly is unsupported —
        those modules can be restructured without notice.
      </P>
      <CodeBlock code={IMPORT_RULE} />
    </DocsSection>
  );
}

export const ImportEntryPointSection = { id, title, Section };
