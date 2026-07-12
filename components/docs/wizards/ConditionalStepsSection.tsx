import Link from "next/link";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "conditional-steps";
const title = "Conditional steps";

const CONDITIONAL_STEP_CODE = `steps: [
  { title: "Account", fieldNames: ["fullName", "email", "accountType"] },
  {
    title: "Company details",
    fieldNames: ["companyName", "vatNumber"],
    // Value operators only — same isValid restriction as field visibleWhen.
    visibleWhen: { field: "accountType", equals: "company" },
  },
  { title: "Review", review: true },
]`;

function Section() {
  return (
    <DocsSection id={id} title="Conditional steps">
      <P>
        A step&apos;s own <IC>visibleWhen</IC> hides the entire step — same value-only <IC>ConditionSpec</IC>{" "}
        restriction as field <IC>visibleWhen</IC> (isValid is rejected there too, for the same feedback-loop
        reason — see{" "}
        <Link href="/docs/conditions" className="underline underline-offset-2 hover:text-foreground">
          Conditions
        </Link>
        ). A hidden step&apos;s fields are treated exactly like condition-hidden fields everywhere: excluded from
        the validation schema, stripped from the submit payload, and skipped by the stepper — they don&apos;t
        appear in the step-number list and Next/Back never land on them.
      </P>
      <CodeBlock code={CONDITIONAL_STEP_CODE} label="Conditional step example" />
      <P>
        If the step you&apos;re currently viewing becomes hidden out from under you (its condition source
        changed), the stepper automatically moves to the nearest visible step — the next one if there is one,
        otherwise the previous one. The config validator also dev-warns if every step has a{" "}
        <IC>visibleWhen</IC>, since some value combination could then hide the entire wizard.
      </P>
    </DocsSection>
  );
}

export const ConditionalStepsSection = { id, title, Section };
