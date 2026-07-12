import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { SHARED_SHAPES } from "./fieldProps";

const id = "shared-shapes";
const title = "Shared shapes";

/**
 * Placed before the per-type sections (see ./sections.ts ordering) so every
 * per-type prop table that names one of these shapes (TextRules, Option,
 * optionsFrom, countryFrom, ...) points at a shape that's already been
 * defined on the page, not a forward reference.
 */
function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>Shapes referenced by name from more than one field type&apos;s props below, explained once here.</P>
      <dl className="flex flex-col gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
        {SHARED_SHAPES.map((shape) => (
          <div key={shape.name} className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
            <dt className="font-mono text-[14px] tablet:text-[14px] desktop:text-[14px] font-medium text-foreground">
              {shape.name}
            </dt>
            <dd className="font-mono text-[12.5px] tablet:text-[12.5px] desktop:text-[12.5px] text-muted-foreground">
              {shape.type}
            </dd>
            <dd className="text-[14px] tablet:text-[14px] desktop:text-[14px] leading-[22px] tablet:leading-[22px] desktop:leading-[22px] text-muted-foreground">
              {shape.description}
            </dd>
            <dd className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
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
