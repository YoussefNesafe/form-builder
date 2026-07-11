import type { Metadata } from "next";
import Link from "next/link";
import { ExampleForm } from "@/components/examples/ExampleForm";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsH1, DocsH2 as H2, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/Prose";
import type { TocItem } from "@/components/docs/DocsToc";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { wizardDemoConfig } from "./config";

export const metadata: Metadata = { title: "Multi-step wizards" };

const TOC_ITEMS: TocItem[] = [
  { id: "step-config-shape", title: "Step config shape" },
  { id: "step-gating", title: "Step gating" },
  { id: "conditional-steps", title: "Conditional steps" },
  { id: "review-step", title: "Review step" },
  { id: "otp-dependson", title: "Cross-step caveat: otp" },
  { id: "try-it", title: "Try it" },
];

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

/**
 * Reference + light tutorial for the steps config: shape, gating, conditional
 * steps, the review step, and the otp dependsOn cross-step caveat. Verified
 * against core/types.ts (StepConfig), components/FormStepper.tsx,
 * components/ReviewStep.tsx, and the dev-warns in core/schema.ts — not a
 * design doc's proposal, the shipped behavior.
 */
export default function WizardsPage() {
  return (
    <DocsPageShell toc={TOC_ITEMS}>
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <DocsH1>Multi-step wizards</DocsH1>
        <P>
          Add a <IC>steps</IC> array to a <IC>FormConfig</IC> and <IC>FormRenderer</IC> switches from a single
          scrolling form to a stepper: one screen per step, Back/Next navigation, and an optional read-only review
          screen before submit. The fields array is unchanged — steps just assign existing field names to screens.
        </P>
      </div>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <H2 id="step-config-shape">Step config shape</H2>
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
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <H2 id="step-gating">Step gating</H2>
        <P>
          The Next button gates on <IC>form.trigger(currentStepFieldNames)</IC> —{" "}
          <strong className="text-foreground">never</strong> <IC>formState.isValid</IC>. The condition-aware
          resolver computes <IC>isValid</IC> across every currently-visible field in the whole form, not just the
          current step, so gating Next on it would block progress on step one because a required field on step
          three is still empty. On a failed <IC>trigger()</IC>, focus moves to the first invalid field on the
          current step so the error is announced to screen readers.
        </P>
        <P>
          A step that owns no <IC>fieldNames</IC> is treated as vacuously valid — Next skips running the resolver
          for nothing. (The review step also owns no fields, but it renders the Submit button rather than Next, so
          this guard exists for fieldless steps generically.)
        </P>
        <P>
          The <strong className="text-foreground">submit button</strong> is the one deliberate exception to the
          rule above: it disables on <IC>!formState.isValid</IC> directly, because by the time you can reach it
          (the last step) that value correctly spans exactly the fields you can still edit.
        </P>
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <H2 id="conditional-steps">Conditional steps</H2>
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
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <H2 id="review-step">Review step</H2>
        <P>
          Set <IC>review: true</IC> instead of <IC>fieldNames</IC> to add a read-only summary screen. It shows
          every visible field from every earlier <em>visible</em> step (a hidden or later step contributes
          nothing), grouped by step with a per-step &quot;Edit&quot; button that jumps the stepper back there.
          Values are read live off form state, so editing an earlier step and returning to review always shows the
          current value, not a stale snapshot taken when you first reached it.
        </P>
        <P>
          <IC>static</IC> and <IC>submit</IC> fields are dropped from the row list (nothing to review). Hidden-type
          fields don&apos;t appear as review rows either, but they still render on the review step&apos;s grid so
          their carried values keep flowing regardless of the active step. A <IC>group</IC> field&apos;s rows
          render as one card per array entry, using the group&apos;s inner field labels. Because a review step owns
          no <IC>fieldNames</IC>, it&apos;s exempt from the &quot;every field must be assigned to a step&quot;
          check described above.
        </P>
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <H2 id="otp-dependson">Cross-step caveat: otp dependsOn</H2>
        <P>
          An <IC>otp</IC> field&apos;s <IC>dependsOn</IC> source normally lives on the same step. If it&apos;s on a
          different step, the config validator dev-warns rather than errors — it works, because{" "}
          <IC>shouldUnregister</IC> stays <IC>false</IC> so values persist while a step&apos;s fields are unmounted
          — but editing the source field while the otp field&apos;s step is unmounted defers re-verification until
          that step remounts. Keep the pair on one step unless that tradeoff is intentional.
        </P>
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <H2 id="try-it">Try it</H2>
        <P>Two fields on step one, one field on step two, then a review screen before submit.</P>
        <ExampleForm config={wizardDemoConfig} />
      </section>

      <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
        For a fuller wizard — confirm-password via <IC>rules.matches</IC>, an email <IC>otp</IC> step with
        cross-step <IC>dependsOn</IC>, then review — see{" "}
        <Link href="/examples/multi-step-signup" className="underline underline-offset-2 hover:text-foreground">
          the multi-step signup example
        </Link>
        .
      </p>
    </DocsPageShell>
  );
}
