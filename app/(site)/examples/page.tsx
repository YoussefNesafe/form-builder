import type { Metadata } from "next";
import { LinkCard } from "@/components/shared/LinkCard";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.examples.index.title };

const EXAMPLES = [
  {
    href: "/examples/multi-step-signup",
    title: t.examples.index.cards.multiStepSignup.title,
    description: t.examples.index.cards.multiStepSignup.description,
  },
  {
    href: "/examples/conditional-profile",
    title: t.examples.index.cards.conditionalProfile.title,
    description: t.examples.index.cards.conditionalProfile.description,
  },
  {
    href: "/examples/advanced-fields",
    title: t.examples.index.cards.advancedFields.title,
    description: t.examples.index.cards.advancedFields.description,
  },
] as const;

export default function ExamplesIndexPage() {
  return (
    <div className="flex flex-col gap-[6.408vw] tablet:gap-[3vw] desktop:gap-[1.248vw]">
      <div className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
        <h1 className="text-[6.408vw] tablet:text-[3vw] desktop:text-[1.248vw] font-semibold tracking-tight">
          {t.examples.index.title}
        </h1>
        <p className="text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] text-muted-foreground">
          {t.examples.index.intro}
        </p>
      </div>
      <ul className="flex flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
        {EXAMPLES.map((example) => (
          <li key={example.href}>
            <LinkCard
              href={example.href}
              title={example.title}
              description={example.description}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
