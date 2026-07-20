import { t } from "@/locales";
import { CAPABILITY_ROWS } from "./content";
import { SectionCtas } from "./SectionCtas";
import { SectionHeading } from "./SectionHeading";

export function CapabilitiesSection() {
  return (
    <section
      aria-labelledby="capabilities-heading"
      className="flex flex-col gap-[6.408vw] tablet:gap-[3vw] desktop:gap-[1.248vw] pb-[17.088vw] tablet:pb-[12vw] desktop:pb-[6.24vw]"
    >
      <SectionHeading id="capabilities-heading" center={false}>
        {t.home.capabilities.title}
      </SectionHeading>
      <div className="rounded-[4.272vw] tablet:rounded-[2vw] desktop:rounded-[0.832vw] border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-2 divide-y divide-border tablet:divide-y-0 desktop:divide-y-0">
          {CAPABILITY_ROWS.map(({ slug, icon: Icon, monoKey }) => {
            const copy = t.home.capabilities.items[slug];
            return (
              <div
                key={slug}
                className="flex items-start gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw] p-[5.34vw] tablet:p-[2.5vw] desktop:p-[1.04vw]"
              >
                <Icon
                  aria-hidden="true"
                  className="mt-[0.534vw] tablet:mt-[0.25vw] desktop:mt-[0.104vw] size-[4.272vw] tablet:size-[2vw] desktop:size-[0.832vw] shrink-0 text-accent-brand"
                />
                <div className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
                  <div className="flex flex-wrap items-baseline gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
                    <span className="font-mono text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-accent-brand">
                      {monoKey}
                    </span>
                    <span className="text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] font-medium text-card-foreground">
                      {copy.title}
                    </span>
                  </div>
                  <span className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">
                    {copy.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SectionCtas />
    </section>
  );
}
