import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "group-limitation";
const title = "Known limitation: groups";

const GROUP_LIMITATION_CODE = `{
  type: "group",
  name: "team",
  min: 1,
  fields: [
    { type: "checkbox", name: "hasRole" },
    {
      type: "text",
      name: "role",
      required: true,
      // Hidden in the UI when hasRole is false — but still validated as
      // required. Submitting an empty row with hasRole unchecked fails.
      visibleWhen: { field: "hasRole", equals: true },
    },
  ],
}`;

function Section() {
  return (
    <DocsSection id={id} title="Known limitation: conditions inside groups">
      <DocsNote variant="warning" label="Known limitation">
        <IC>visibleWhen</IC> on a field nested inside a <IC>group</IC> field is <strong>not skipped by validation</strong>{" "}
        in v1 — pinned by a test (not a bug waiting to be fixed silently under you). A required inner field hidden by
        its own <IC>visibleWhen</IC> still blocks submit.
      </DocsNote>
      <CodeBlock code={GROUP_LIMITATION_CODE} label="Group-nested visibleWhen limitation" />
      <DocsNote variant="danger" label="Hard error">
        An <IC>isValid</IC> condition <em>targeting</em> a group-nested field is rejected outright by the config
        validator (not a silent limitation) — the per-field schema map the oracle uses only holds top-level fields,
        the same reason group-nested <IC>otp</IC> <IC>dependsOn</IC> wiring is rejected.
      </DocsNote>
    </DocsSection>
  );
}

export const GroupLimitationSection = { id, title, Section };
