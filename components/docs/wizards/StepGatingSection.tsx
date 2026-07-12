import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "step-gating";
const title = "Step gating";

function Section() {
  return (
    <DocsSection id={id} title="Step gating">
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
    </DocsSection>
  );
}

export const StepGatingSection = { id, title, Section };
