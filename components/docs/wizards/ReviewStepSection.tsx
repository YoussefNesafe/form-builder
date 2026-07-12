import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "review-step";
const title = "Review step";

function Section() {
  return (
    <DocsSection id={id} title="Review step">
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
    </DocsSection>
  );
}

export const ReviewStepSection = { id, title, Section };
