import { LinkCard } from "@/components/shared/LinkCard";
import { t } from "@/locales";
import { SectionHeading } from "./SectionHeading";
import { FIELD_ROW_WIDTHS, SHOWCASE_CARDS } from "./content";

/**
 * Showcase-style card grid: a navigation surface ("here's
 * what you can go look at"), distinct from the live demo below it, which is
 * a proof surface ("here's the engine actually running"). Links to real
 * routes only.
 */
export function ShowcaseSection() {
  return (
    <section className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]">
      <SectionHeading>{t.home.showcase.title}</SectionHeading>
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
        {SHOWCASE_CARDS.map((card) => {
          const copy = t.home.showcase.cards[card.slug];
          return (
            <LinkCard
              key={card.href}
              href={card.href}
              kicker={copy.kicker}
              title={copy.title}
              description={copy.description}
              className="gap-[12px] tablet:gap-[12px] desktop:gap-[12px] p-[20px] tablet:p-[20px] desktop:p-[20px]"
            >
              <div
                aria-hidden="true"
                className="flex h-[96px] tablet:h-[96px] desktop:h-[96px] flex-col justify-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border border-dashed border-border p-[12px] tablet:p-[12px] desktop:p-[12px]"
              >
                {card.preview === "chips" ? (
                  <div className="flex flex-wrap gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
                    {t.home.builderChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-[6px] tablet:rounded-[6px] desktop:rounded-[6px] border border-border bg-muted px-[8px] tablet:px-[8px] desktop:px-[8px] py-[4px] tablet:py-[4px] desktop:py-[4px] text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : (
                  FIELD_ROW_WIDTHS.map((widthClass, index) => (
                    <div
                      key={index}
                      className={`h-[10px] tablet:h-[10px] desktop:h-[10px] rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted ${widthClass}`}
                    />
                  ))
                )}
              </div>
            </LinkCard>
          );
        })}
      </div>
    </section>
  );
}
