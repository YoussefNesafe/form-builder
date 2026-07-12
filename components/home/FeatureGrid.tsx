import { t } from "@/locales";
import { SectionHeading } from "./SectionHeading";
import { FEATURE_SLUGS } from "./content";

export function FeatureGrid() {
  return (
    <section className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]">
      <SectionHeading>{t.home.features.title}</SectionHeading>
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
        {FEATURE_SLUGS.map(({ slug, icon: Icon }) => {
          const copy = t.home.features.items[slug];
          return (
            <div
              key={slug}
              className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border bg-card p-[20px] tablet:p-[20px] desktop:p-[20px]"
            >
              <Icon aria-hidden="true" className="size-[16px] tablet:size-[16px] desktop:size-[16px] text-accent-brand" />
              <span className="text-[15px] tablet:text-[15px] desktop:text-[15px] font-medium text-card-foreground">
                {copy.title}
              </span>
              <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
                {copy.description}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
