import { Check } from "lucide-react";
import { t } from "@/locales";
import { SectionHeading } from "./SectionHeading";
import { COMPARISON_ROW_SLUGS } from "./content";

export function ComparisonStrip() {
  const columns = t.home.comparison.columns;

  return (
    <section className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]">
      <SectionHeading>{t.home.comparison.title}</SectionHeading>
      <div className="flex flex-col">
        <div className="hidden tablet:grid desktop:grid grid-cols-4 gap-[12px] tablet:gap-[12px] desktop:gap-[12px] pb-[10px] tablet:pb-[10px] desktop:pb-[10px] text-[11px] tablet:text-[11px] desktop:text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>{columns.capability}</span>
          <span>{columns.hosted}</span>
          <span>{columns.handRolled}</span>
          <span>{columns.engine}</span>
        </div>
        {COMPARISON_ROW_SLUGS.map((slug) => {
          const row = t.home.comparison.rows[slug];
          return (
            <div
              key={slug}
              className="grid grid-cols-1 tablet:grid-cols-4 desktop:grid-cols-4 gap-[6px] tablet:gap-[12px] desktop:gap-[12px] border-t border-border py-[14px] tablet:py-[14px] desktop:py-[14px] text-[13px] tablet:text-[13px] desktop:text-[13px]"
            >
              <span className="font-medium text-foreground">{row.capability}</span>
              <span className="text-muted-foreground">
                {/* sr-only (not hidden) at tablet+ so the column label stays in the a11y tree */}
                <span className="tablet:sr-only desktop:sr-only font-medium uppercase tracking-wide text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
                  {columns.hosted}:{" "}
                </span>
                {row.hosted}
              </span>
              <span className="text-muted-foreground">
                <span className="tablet:sr-only desktop:sr-only font-medium uppercase tracking-wide text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
                  {columns.handRolled}:{" "}
                </span>
                {row.handRolled}
              </span>
              <span className="flex items-start gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-accent-brand">
                <Check aria-hidden="true" className="mt-[2px] size-[14px] tablet:size-[14px] desktop:size-[14px] shrink-0" />
                <span>
                  <span className="tablet:sr-only desktop:sr-only font-medium uppercase tracking-wide text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
                    {columns.engine}:{" "}
                  </span>
                  {row.engine}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
