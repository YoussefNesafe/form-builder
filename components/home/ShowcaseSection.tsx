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
      className="flex flex-col gap-[6.408vw] tablet:gap-[3vw] desktop:gap-[1.248vw] pb-[17.088vw] tablet:pb-[12vw] desktop:pb-[6.24vw]"
    >
      <SectionHeading id="showcase-heading">{t.home.showcase.title}</SectionHeading>
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-[4.272vw] tablet:gap-[2vw] desktop:gap-[0.832vw]">
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
              className="gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw] p-[5.34vw] tablet:p-[2.5vw] desktop:p-[1.04vw]"
            >
              <CodeBlock
                code={peek}
                decorative
                className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] leading-[4.272vw] tablet:leading-[2vw] desktop:leading-[0.832vw]"
              />
            </LinkCard>
          );
        })}
      </div>
      <SectionCtas center />
    </section>
  );
}
