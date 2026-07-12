import { ExampleForm } from "@/components/examples/ExampleForm";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { firstFormConfig } from "./demoConfig";

const id = "try-it";
const title = "Try it";

function Section() {
  return (
    <DocsSection id={id} title="3. Try it">
      <P>
        This is the exact config above, rendered by the real <IC>FormRenderer</IC> — leave a field blank and
        submit to see validation kick in.
      </P>
      <ExampleForm config={firstFormConfig} />
    </DocsSection>
  );
}

export const TryItSection = { id, title, Section };
