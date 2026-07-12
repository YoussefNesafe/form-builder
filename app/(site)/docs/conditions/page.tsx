import type { Metadata } from "next";
import Link from "next/link";
import { ExampleForm } from "@/components/examples/ExampleForm";
import { CodeBlock } from "@/components/docs/CodeBlock";
import {
  DocsIntro,
  DocsSection,
  DocsFootnote,
  DocsBody as P,
  DocsInlineCode as IC,
} from "@/components/docs/DocsProse";
import type { TocItem } from "@/components/docs/DocsToc";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { t } from "@/locales";
import { conditionsDemoConfig } from "./config";

export const metadata: Metadata = { title: t.docs.nav.pages.conditions };

const TOC_ITEMS: TocItem[] = [
  { id: "visible-disabled-enabled-when", title: "visibleWhen, disabledWhen, enabledWhen" },
  { id: "condition-shape", title: "Condition shape" },
  { id: "is-valid-operator", title: "The isValid operator" },
  { id: "group-limitation", title: "Known limitation: groups" },
  { id: "try-it", title: "Try it" },
];

const VISIBLE_WHEN_CODE = `{
  type: "text",
  name: "companyName",
  label: "Company name",
  required: true,
  visibleWhen: { field: "accountType", equals: "company" },
}`;

const AND_ARRAY_CODE = `// Condition[] — every entry must match (AND)
visibleWhen: [
  { field: "country", equals: "US" },
  { field: "accountType", notEquals: "individual" },
]`;

const ANY_OF_CODE = `// { anyOf: Condition[][] } — OR of AND-groups (DNF)
visibleWhen: {
  anyOf: [
    [{ field: "plan", equals: "pro" }],
    [{ field: "plan", equals: "enterprise" }, { field: "seats", in: [10, 25, 50] }],
  ],
}`;

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

/**
 * Reference + light tutorial for visibleWhen/disabledWhen/enabledWhen: the
 * real Condition/ConditionSpec operators from core/types.ts, why isValid is
 * restricted to disabledWhen/enabledWhen, and the group-nesting limitation
 * pinned by useDynamicForm.test.ts. Verified against form-builder/core/
 * conditions.ts, core/types.ts, and core/schema.ts — not the design doc's
 * proposal, the shipped validator.
 */
export default function ConditionsPage() {
  return (
    <DocsPageShell toc={TOC_ITEMS}>
      <DocsIntro title={t.docs.nav.pages.conditions}>
        Any field can react to another field&apos;s value — or, for disabling, another field&apos;s{" "}
        <em>validity</em> — via <IC>visibleWhen</IC>, <IC>disabledWhen</IC>, and <IC>enabledWhen</IC>. All three
        take the same <IC>ConditionSpec</IC> shape; what differs is what happens when the condition matches.
      </DocsIntro>

      <DocsSection id="visible-disabled-enabled-when" title="visibleWhen, disabledWhen, enabledWhen">
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

      <DocsSection id="condition-shape" title="Condition shape">
        <P>
          A single condition is <IC>{"{ field, equals?, notEquals?, in?, isValid? }"}</IC> — those four are the
          complete operator list (the validator rejects a condition with none of them set). A{" "}
          <IC>ConditionSpec</IC> is one of three shapes, all evaluating to the same normalized form internally:
        </P>
        <ul className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          <li>
            <strong className="text-foreground">A single condition</strong> — the object above, on its own.
          </li>
          <li>
            <strong className="text-foreground">Condition[]</strong> — an AND-list; every entry must match.
          </li>
          <li>
            <strong className="text-foreground">{"{ anyOf: Condition[][] }"}</strong> — OR of AND-groups (DNF:
            disjunctive normal form). Any group matching is enough.
          </li>
        </ul>
        <CodeBlock code={AND_ARRAY_CODE} label="AND array example" />
        <CodeBlock code={ANY_OF_CODE} label="anyOf DNF example" />
        <P>
          The flat two-level shape (groups OR together, conditions AND within a group) is deliberate — any boolean
          combination is expressible this way without a recursive tree, which keeps evaluation a one-liner (
          <IC>groups.some(g =&gt; g.every(match))</IC>) and keeps a future builder UI flat instead of recursive. An
          empty spec (<IC>[]</IC> or <IC>{"{ anyOf: [] }"}</IC>) is rejected by the validator rather than silently
          treated as always-matching, since for <IC>disabledWhen</IC> that would mean permanently disabled.
        </P>
      </DocsSection>

      <DocsSection id="is-valid-operator" title="The isValid operator">
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

      <DocsSection id="group-limitation" title="Known limitation: conditions inside groups">
        <P>
          <IC>visibleWhen</IC> on a field nested inside a <IC>group</IC> field is{" "}
          <strong className="text-foreground">not skipped by validation</strong> in v1 — this is a known
          limitation, pinned by a test (not a bug waiting to be fixed silently under you). A required inner field
          hidden by its own <IC>visibleWhen</IC> still blocks submit.
        </P>
        <CodeBlock code={GROUP_LIMITATION_CODE} label="Group-nested visibleWhen limitation" />
        <P>
          Separately, an <IC>isValid</IC> condition <em>targeting</em> a group-nested field is rejected outright by
          the config validator (a hard error, not a silent limitation) — the per-field schema map the oracle uses
          only holds top-level fields, the same reason group-nested <IC>otp</IC> <IC>dependsOn</IC> wiring is
          rejected.
        </P>
      </DocsSection>

      <DocsSection id="try-it" title="Try it">
        <P>
          Pick &quot;Company&quot; below and the company name field appears — and becomes part of what
          submit validates.
        </P>
        <ExampleForm config={conditionsDemoConfig} />
      </DocsSection>

      <DocsFootnote>
        For a fuller demo combining <IC>visibleWhen</IC>, <IC>optionsFrom</IC>, and phone <IC>countryFrom</IC> in
        one form, see{" "}
        <Link href="/examples/conditional-profile" className="underline underline-offset-2 hover:text-foreground">
          the conditional profile example
        </Link>
        . For conditions on entire wizard steps, see{" "}
        <Link href="/docs/wizards" className="underline underline-offset-2 hover:text-foreground">
          Multi-step wizards
        </Link>
        .
      </DocsFootnote>
    </DocsPageShell>
  );
}
