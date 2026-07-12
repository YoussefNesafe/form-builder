import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "visible-disabled-enabled-when";
const title = "visibleWhen, disabledWhen, enabledWhen";

const VISIBLE_WHEN_CODE = `{
  type: "text",
  name: "companyName",
  label: "Company name",
  required: true,
  visibleWhen: { field: "accountType", equals: "company" },
}`;

function Section() {
  return (
    <DocsSection id={id} title="visibleWhen, disabledWhen, enabledWhen">
      <P>
        <IC>visibleWhen</IC> controls whether the field renders at all. A field whose <IC>visibleWhen</IC> does
        not match is excluded from the validation schema entirely — the condition-aware resolver only validates
        currently-visible fields — and its value is stripped from the submit payload (the resolver&apos;s schema
        runs in Zod strip mode). It is not just hidden CSS: an invisible required field cannot block submit.
      </P>
      <P>
        <IC>disabledWhen</IC> and <IC>enabledWhen</IC> never affect rendering or validation — the field stays in
        the schema and in the payload, it just gets the HTML <IC>disabled</IC> attribute. <IC>enabledWhen</IC>{" "}
        is the inverse of <IC>disabledWhen</IC> (disabled while the spec does <em>not</em> match) — it exists so
        you can write &quot;enabled once X&quot; directly instead of negating every leaf. A field may set one or
        the other, not both; the config validator rejects a field with both.
      </P>
      <CodeBlock code={VISIBLE_WHEN_CODE} label="visibleWhen example" />
    </DocsSection>
  );
}

export const VisibleDisabledEnabledWhenSection = { id, title, Section };
