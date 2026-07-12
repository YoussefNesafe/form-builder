import { t } from "@/locales";
import { CAPABILITY_ROWS } from "./content";
import { SectionHeading } from "./SectionHeading";

/**
 * Spec-sheet restyle of the old FeatureGrid: one bordered panel (not a card
 * grid — no per-row borders/shadows) holding a dense 2-column row list. Mono
 * keys name the real config/implementation mechanism behind each capability
 * (visibleWhen, steps:, superRefine:, ...) instead of generic marketing
 * icons-on-cards. Divider rules only apply in the single-column mobile
 * stack — the 2-column grid at tablet+ relies on gap alone, since a plain
 * `divide-*` utility can't express "divide between row-pairs" on a grid.
 */
export function CapabilitiesSection() {
  return (
    <section
      aria-labelledby="capabilities-heading"
      className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]"
    >
      <SectionHeading id="capabilities-heading" center={false}>
        {t.home.capabilities.title}
      </SectionHeading>
      <div className="rounded-[16px] tablet:rounded-[16px] desktop:rounded-[16px] border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-2 divide-y divide-border tablet:divide-y-0 desktop:divide-y-0">
          {CAPABILITY_ROWS.map(({ slug, icon: Icon, monoKey }) => {
            const copy = t.home.capabilities.items[slug];
            return (
              <div
                key={slug}
                className="flex items-start gap-[12px] tablet:gap-[12px] desktop:gap-[12px] p-[20px] tablet:p-[20px] desktop:p-[20px]"
              >
                <Icon
                  aria-hidden="true"
                  className="mt-[2px] tablet:mt-[2px] desktop:mt-[2px] size-[16px] tablet:size-[16px] desktop:size-[16px] shrink-0 text-accent-brand"
                />
                <div className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
                  <div className="flex flex-wrap items-baseline gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
                    <span className="font-mono text-[11px] tablet:text-[11px] desktop:text-[11px] text-accent-brand">
                      {monoKey}
                    </span>
                    <span className="text-[14px] tablet:text-[14px] desktop:text-[14px] font-medium text-card-foreground">
                      {copy.title}
                    </span>
                  </div>
                  <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
                    {copy.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
