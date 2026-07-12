import { ExampleForm } from "@/components/examples/ExampleForm";
import { DocsSection, DocsBody as P } from "@/components/docs/DocsProse";
import { wizardDemoConfig } from "./demoConfig";

const id = "try-it";
const title = "Try it";

function Section() {
  return (
    <DocsSection id={id} title="Try it">
      <P>Two fields on step one, one field on step two, then a review screen before submit.</P>
      <ExampleForm config={wizardDemoConfig} />
    </DocsSection>
  );
}

export const TryItSection = { id, title, Section };
