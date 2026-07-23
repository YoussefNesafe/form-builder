import Link from "next/link";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "custom-types";
const title = "Custom field types escape to unknown";

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        A field type registered with <IC>registerField</IC> isn&apos;t one of the built-in type strings{" "}
        <IC>FieldValue</IC> matches against, so it falls through every branch and infers as <IC>unknown</IC>. This
        mirrors the engine&apos;s own honesty about it at runtime:{" "}
        <IC>parseSubmission</IC> can&apos;t build a Zod schema for a shape it doesn&apos;t know either, so a custom
        field&apos;s name always lands in <IC>result.unvalidated</IC> instead of being checked.
      </P>
      <P>
        The type system and the runtime agree: narrow a custom field&apos;s value yourself. See{" "}
        <Link href="/docs/server-validation#custom-fields" className="underline underline-offset-2 hover:text-foreground">
          Custom (registered) field types
        </Link>{" "}
        in Server-side validation for the recipe (a few lines of Zod over <IC>result.values[name]</IC>).
      </P>
    </DocsSection>
  );
}

export const CustomTypesSection = { id, title, Section };
