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
    <div className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">
          {t.examples.index.title}
        </h1>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          {t.examples.index.intro}
        </p>
      </div>
      <ul className="flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
        {EXAMPLES.map((example) => (
          <li key={example.href}>
            <LinkCard href={example.href} title={example.title} description={example.description} />
          </li>
        ))}
      </ul>
    </div>
  );
}
