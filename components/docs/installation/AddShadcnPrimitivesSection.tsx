import { CodeBlock } from "@/components/docs/CodeBlock";
import { CommandBlock } from "@/components/docs/CommandBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "add-shadcn-primitives";
const title = "Add the shadcn primitives";

const SHADCN_ADD_ARGS = `shadcn@latest add button calendar checkbox command dialog field \\
  input input-group input-otp label popover progress radio-group \\
  select separator slider switch textarea`;

const GLOBALS_CSS_IMPORT = `@import "shadcn/tailwind.css";`;

function Section() {
  return (
    <DocsSection id={id} title="7. Add the shadcn primitives">
      <P>
        The engine&apos;s fields are built on these shadcn primitives — it&apos;s the exact set under{" "}
        <IC>components/ui/</IC> in this repo, so check your own <IC>components/ui/</IC> before re-adding anything
        you already have:
      </P>
      <CommandBlock kind="execute" args={SHADCN_ADD_ARGS} />
      <P>
        <IC>shadcn</IC> itself stays a <strong>devDependency</strong> — it&apos;s a codegen CLI that writes files
        into your repo at install time, not a library your bundle ships at runtime. Its base layer still has to
        reach your CSS though: add this import to your global stylesheet (this repo does it in{" "}
        <IC>app/globals.css</IC>):
      </P>
      <CodeBlock code={GLOBALS_CSS_IMPORT} copy copyLabel="CSS import" />
    </DocsSection>
  );
}

export const AddShadcnPrimitivesSection = { id, title, Section };
