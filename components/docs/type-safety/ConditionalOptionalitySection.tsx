import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "conditional-optionality";
const title = "Optional keys track visibility, not required";

const EXAMPLE_CODE = `const cfg = defineForm({
  id: "f",
  fields: [
    { type: "text", name: "always", required: true },
    {
      type: "text",
      name: "maybe",
      required: true,
      visibleWhen: { field: "always", equals: "x" },
    },
  ],
});

type Values = InferValues<typeof cfg>;
// { always: string; maybe?: string }`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        A key is optional in the inferred payload when its field has <IC>visibleWhen</IC> or{" "}
        <IC>enabledWhenVerified</IC> — because <IC>parseSubmission</IC> strips a field&apos;s value when it isn&apos;t
        visible, so the key may simply not be there.{" "}
        <strong className="text-foreground">
          This is unrelated to the field&apos;s own <IC>required</IC> flag.
        </strong>{" "}
        <IC>required</IC> only governs whether Zod accepts an empty value for a <em>visible</em> field — it never
        removes the key from the payload, so a <IC>required: false</IC> field with no condition is still a required
        key in <IC>Values</IC> (its value can be an empty string, but the key is always present).
      </P>
      <CodeBlock code={EXAMPLE_CODE} label="Conditional field becomes an optional key" copy copyLabel="code" />
      <DocsNote variant="note" label="Two different questions">
        &quot;Is this key present in the payload?&quot; (conditional visibility, tracked by <IC>InferValues</IC>)
        and &quot;must this field have a value when it&apos;s visible?&quot; (<IC>required</IC>, enforced by Zod at
        runtime) are independent. A field can be <IC>required: true</IC> and still an optional key, and{" "}
        <IC>required: false</IC> and still a required key.
      </DocsNote>
    </DocsSection>
  );
}

export const ConditionalOptionalitySection = { id, title, Section };
