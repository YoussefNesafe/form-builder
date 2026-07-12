import { Check } from "lucide-react";
import { t } from "@/locales";
import { COMPARISON_ROW_SLUGS } from "./content";
import { SectionCtas } from "./SectionCtas";
import { SectionHeading } from "./SectionHeading";

/**
 * Full-width comparison table. The "this engine" column gets its own tinted,
 * bordered treatment on every row — applied to the cell itself rather than a
 * spanning column band, so the accent survives the mobile layout where rows
 * stack into single-column lines (a column band only exists once cells sit
 * in an actual grid row, which mobile doesn't have).
 */
export function ComparisonStrip() {
  const columns = t.home.comparison.columns;

  return (
    <section
      aria-labelledby="comparison-heading"
      className="flex flex-col gap-[6.408vw] tablet:gap-[3vw] desktop:gap-[1.248vw] pb-[17.088vw] tablet:pb-[12vw] desktop:pb-[6.24vw]"
    >
      <SectionHeading id="comparison-heading">{t.home.comparison.title}</SectionHeading>
      <div className="flex flex-col">
        <div className="hidden tablet:grid desktop:grid grid-cols-4 gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw] pb-[2.67vw] tablet:pb-[1.25vw] desktop:pb-[0.52vw] text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] font-medium uppercase tracking-wide text-muted-foreground">
          <span>{columns.capability}</span>
          <span>{columns.hosted}</span>
          <span>{columns.handRolled}</span>
          <span className="text-accent-brand">{columns.engine}</span>
        </div>
        {COMPARISON_ROW_SLUGS.map((slug) => {
          const row = t.home.comparison.rows[slug];
          return (
            <div
              key={slug}
              className="grid grid-cols-1 tablet:grid-cols-4 desktop:grid-cols-4 items-start gap-[1.602vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw] border-t border-border py-[3.738vw] tablet:py-[1.75vw] desktop:py-[0.728vw] text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw]"
            >
              <span className="font-medium text-foreground">{row.capability}</span>
              <span className="text-muted-foreground">
                {/* sr-only (not hidden) at tablet+ so the column label stays in the a11y tree */}
                <span className="tablet:sr-only desktop:sr-only font-medium uppercase tracking-wide text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground">
                  {columns.hosted}:{" "}
                </span>
                {row.hosted}
              </span>
              <span className="text-muted-foreground">
                <span className="tablet:sr-only desktop:sr-only font-medium uppercase tracking-wide text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground">
                  {columns.handRolled}:{" "}
                </span>
                {row.handRolled}
              </span>
              <div className="flex items-start gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] rounded-[2.136vw] tablet:rounded-[1vw] desktop:rounded-[0.416vw] border border-accent-brand bg-accent-brand/10 px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] py-[1.602vw] tablet:py-[0.75vw] desktop:py-[0.312vw] text-accent-brand">
                <Check aria-hidden="true" className="mt-[0.534vw] size-[3.738vw] tablet:size-[1.75vw] desktop:size-[0.728vw] shrink-0" />
                <span>
                  <span className="tablet:sr-only desktop:sr-only font-medium uppercase tracking-wide text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw]">
                    {columns.engine}:{" "}
                  </span>
                  {row.engine}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <SectionCtas center />
    </section>
  );
}
