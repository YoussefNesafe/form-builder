import { CodeBlock } from "@/components/docs/CodeBlock";
import { LinkCard } from "@/components/shared/LinkCard";
import { t } from "@/locales";
import { SHOWCASE_CARDS } from "./content";
import { peekFields } from "./fieldPeek";
import { SectionCtas } from "./SectionCtas";
import { SectionHeading } from "./SectionHeading";

/**
 * Showcase-style card grid: a navigation surface ("here's what you can go
 * look at"), distinct from the flagship split below it, which is a proof
 * surface ("here's the engine actually running"). Links to real routes
 * only. Each card's code peek is generated from the card's real config (see
 * fieldPeek.ts) — no decorative skeleton/chip bars, but the peek itself is
 * `decorative` (aria-hidden, unfocusable) since it's nested inside the
 * card's own `<Link>`: an unlabelled focusable `<pre>` there would be a dead
 * second tab stop, and its text would otherwise concatenate into the link's
 * accessible name. `LinkCard`'s explicit `ariaLabel` makes that name not
 * depend on the peek staying aria-hidden as this section evolves.
 */
export function ShowcaseSection() {
  return (
    <section
      aria-labelledby="showcase-heading"
      className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]"
    >
      <SectionHeading id="showcase-heading">{t.home.showcase.title}</SectionHeading>
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
        {SHOWCASE_CARDS.map((card) => {
          const copy = t.home.showcase.cards[card.slug];
          const peek = peekFields(card.config, card.peekFieldNames);
          return (
            <LinkCard
              key={card.href}
              href={card.href}
              kicker={copy.kicker}
              title={copy.title}
              description={copy.description}
              ariaLabel={`${copy.title} — ${copy.description}`}
              className="gap-[12px] tablet:gap-[12px] desktop:gap-[12px] p-[20px] tablet:p-[20px] desktop:p-[20px]"
            >
              <CodeBlock
                code={peek}
                decorative
                className="text-[11px] tablet:text-[11px] desktop:text-[11px] leading-[16px] tablet:leading-[16px] desktop:leading-[16px]"
              />
            </LinkCard>
          );
        })}
      </div>
      <SectionCtas center />
    </section>
  );
}
