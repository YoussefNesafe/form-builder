import { ExampleForm } from "@/components/examples/ExampleForm";
import { DocsSection, DocsBody as P } from "@/components/docs/DocsProse";
import { conditionsDemoConfig } from "./demoConfig";

const id = "try-it";
const title = "Try it";

function Section() {
  return (
    <DocsSection id={id} title="Try it">
      <P>
        Pick &quot;Company&quot; below and the company name field appears — and becomes part of what
        submit validates.
      </P>
      <ExampleForm config={conditionsDemoConfig} />
    </DocsSection>
  );
}

export const TryItSection = { id, title, Section };
