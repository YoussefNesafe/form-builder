import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "step-config-shape";
const title = "Step config shape";

const STEPS_CODE = `export const config: FormConfig = {
  id: "wizard-demo",
  fields: [
    { type: "text", name: "fullName", label: "Full name", required: true },
    { type: "email", name: "email", label: "Email", required: true },
    { type: "select", name: "plan", label: "Plan", required: true, options: [/* ... */] },
    { type: "submit", name: "submit", text: "Create account" },
  ],
  steps: [
    { title: "Account", fieldNames: ["fullName", "email"] },
    { title: "Plan", fieldNames: ["plan"] },
    { title: "Review", review: true },
  ],
};`;

function Section() {
  return (
    <DocsSection id={id} title="Step config shape">
      <P>
        Each entry in <IC>steps</IC> is <IC>{"{ title, fieldNames?, review?, visibleWhen? }"}</IC>. A step needs
        exactly one of <IC>fieldNames</IC> or <IC>review: true</IC> — the validator rejects a step with both or
        neither. <IC>fieldNames</IC> lists root field names owned by that step (group rows like{" "}
        <IC>{"team.0.role"}</IC> resolve back to the root name for step lookup). Only <IC>submit</IC> and{" "}
        <IC>hidden</IC> fields are exempt — they render automatically regardless of the current step and must{" "}
        <strong className="text-foreground">not</strong> be listed in any step&apos;s <IC>fieldNames</IC>. Every
        other field — including <IC>static</IC> content — must be assigned to exactly one step, or config
        validation fails.
      </P>
      <CodeBlock code={STEPS_CODE} label="Step config shape" />
    </DocsSection>
  );
}

export const StepConfigShapeSection = { id, title, Section };
