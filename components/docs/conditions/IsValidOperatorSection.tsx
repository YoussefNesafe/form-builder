import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "is-valid-operator";
const title = "The isValid operator";

const IS_VALID_CODE = `{
  type: "email",
  name: "email",
  label: "Email",
  // Disabled until BOTH sibling fields pass their own zod schema.
  enabledWhen: [
    { field: "firstName", isValid: true },
    { field: "lastName", isValid: true },
  ],
}`;

function Section() {
  return (
    <DocsSection id={id} title="The isValid operator">
      <P>
        <IC>isValid</IC> matches when a source field&apos;s own Zod schema passes (or fails, for{" "}
        <IC>isValid: false</IC>) against its current value — computed by safe-parsing the field&apos;s schema
        directly, not by reading React Hook Form&apos;s <IC>formState.errors</IC> (which only exist after
        validation has run and depend on validation mode/timing).
      </P>
      <CodeBlock code={IS_VALID_CODE} label="isValid in enabledWhen example" />
      <P>
        <IC>isValid</IC> is only allowed in <IC>disabledWhen</IC> and <IC>enabledWhen</IC> — the config
        validator rejects it in <IC>visibleWhen</IC>. The reason is structural: visibility drives which fields
        are in the validation schema, so a field whose visibility depended on another field&apos;s validity could
        create a feedback loop (or make payload stripping depend on validity that itself depends on visibility).
        Disabled fields stay in the schema either way, so validity-driven disabling has no such loop.
      </P>
      <P>
        The oracle parses each field&apos;s schema <em>in isolation</em>. Cross-field rules — <IC>rules.matches</IC>
        , date/time sibling bounds (<IC>minDateField</IC>/<IC>maxDateField</IC>), <IC>optionsFrom</IC> branch
        membership — live in the form-level <IC>superRefine</IC>, not on the field&apos;s own schema, precisely
        so they can see other fields&apos; values. That also means <IC>isValid</IC> against a field with only
        cross-field rules will not reflect those rules — it only sees what that field&apos;s own schema checks.
      </P>
    </DocsSection>
  );
}

export const IsValidOperatorSection = { id, title, Section };
