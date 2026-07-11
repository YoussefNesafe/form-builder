import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Examples" };

const EXAMPLES = [
  {
    href: "/examples/multi-step-signup",
    title: "Multi-step signup",
    description: "A three-step wizard: account details with confirm-password, email OTP verification, and a read-only review step.",
  },
  {
    href: "/examples/conditional-profile",
    title: "Conditional profile",
    description: "visibleWhen-conditional fields, an optionsFrom-derived select, and a phone field synced to a country field.",
  },
  {
    href: "/examples/advanced-fields",
    title: "Advanced fields",
    description: "Masked input, date/time fields with sibling bounds, rating, segmented, slider, signature, and file.",
  },
] as const;

export default function ExamplesIndexPage() {
  return (
    <div className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">Examples</h1>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          Live forms rendered by the engine through its public API — the same `FormRenderer` you&apos;d import into
          your own app.
        </p>
      </div>
      <ul className="flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
        {EXAMPLES.map((example) => (
          <li key={example.href}>
            <Link
              href={example.href}
              className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border-interactive bg-card p-[16px] tablet:p-[16px] desktop:p-[16px] transition-colors hover:border-border-interactive-hover focus-visible:border-foreground focus-visible:outline-none"
            >
              <span className="text-[15px] tablet:text-[15px] desktop:text-[15px] font-medium text-card-foreground">
                {example.title}
              </span>
              <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
                {example.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
