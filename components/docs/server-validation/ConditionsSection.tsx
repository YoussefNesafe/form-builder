import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "conditions";
const title = "Conditions on the server";

const GROUP_CONDITION_CODE = `{
  type: "group",
  name: "team",
  fields: [
    { type: "checkbox", name: "hasRole" },
    // Still validated as required server-side even when hasRole is false —
    // identical to the client's known v1 limitation, not a server-only bug.
    { type: "text", name: "role", required: true, visibleWhen: { field: "hasRole", equals: true } },
  ],
}`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        <IC>parseSubmission</IC> computes visibility the same way the client does —{" "}
        <IC>visibleFieldsFor</IC>, which honors both a field&apos;s own <IC>visibleWhen</IC> and its owning
        step&apos;s — <strong className="text-foreground">not</strong> <IC>stripInvisibleValues</IC> (see below).
      </P>
      <DocsNote variant="warning" label="Known v1 limitation, inherited identically">
        Conditions on fields nested inside a <IC>group</IC> are not evaluated by validation, client or server. The
        server deliberately does <strong className="text-foreground">not</strong> get stricter here — making it
        so would reject submissions the UI itself accepted, which is worse than the limitation it would &quot;fix.&quot;
      </DocsNote>
      <CodeBlock code={GROUP_CONDITION_CODE} label="Group-nested condition limitation" />
      <DocsNote variant="danger" label="Conditions run on attacker-controlled input">
        <IC>visibleWhen</IC> is evaluated against the submitted body itself — a client can hide a required field
        by submitting whatever value hides it. This is inherent to conditional forms, not a bug in{" "}
        <IC>parseSubmission</IC>: the mitigation is that the field <em>controlling</em> visibility is itself
        validated, so an attacker can only reach visibility states a legitimate user could also reach.{" "}
        <strong className="text-foreground">If a field must be validated unconditionally, it must not be
        conditional.</strong>
      </DocsNote>
    </DocsSection>
  );
}

export const ConditionsSection = { id, title, Section };
