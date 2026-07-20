import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { SHARED_SHAPES } from "./fieldProps";

const id = "shared-shapes";
const title = "Shared shapes";

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>Shapes referenced by name from more than one field type&apos;s props below, explained once here.</P>
      <dl className="flex flex-col gap-[4.272vw] tablet:gap-[2vw] desktop:gap-[0.832vw]">
        {SHARED_SHAPES.map((shape) => (
          <div key={shape.name} className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
            <dt className="font-mono text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] font-medium text-foreground">
              {shape.name}
            </dt>
            <dd className="font-mono text-[3.338vw] tablet:text-[1.563vw] desktop:text-[0.65vw] text-muted-foreground">
              {shape.type}
            </dd>
            <dd className="text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] leading-[5.874vw] tablet:leading-[2.75vw] desktop:leading-[1.144vw] text-muted-foreground">
              {shape.description}
            </dd>
            <dd className="text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
              Used by:{" "}
              {shape.usedBy.map((type, i) => (
                <span key={type}>
                  {i > 0 && ", "}
                  <IC>{type}</IC>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </DocsSection>
  );
}

export const SharedShapesSection = { id, title, Section };
