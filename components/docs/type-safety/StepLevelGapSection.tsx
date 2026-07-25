import { DocsSection, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "step-level-gap";
const title = "Known gap: step-level visibility";

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <DocsNote variant="warning" label="Not yet reflected in the inferred type">
        <IC>InferValues</IC> only looks at a field&apos;s own <IC>visibleWhen</IC>/<IC>enabledWhenVerified</IC>. A
        field with neither, but declared inside a wizard step whose own <IC>visibleWhen</IC> hides the whole step,
        can still be stripped by <IC>parseSubmission</IC> at runtime — yet <IC>InferValues</IC> currently infers it
        as a required (non-optional) key. The runtime behavior is correct; only the inferred <em>type</em> is
        optimistic here. Treat a key from a field inside a conditional step as possibly absent even though its type
        says otherwise, until this is widened to walk <IC>config.steps</IC> too.
      </DocsNote>
    </DocsSection>
  );
}

export const StepLevelGapSection = { id, title, Section };
