import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Docs" };

const PAGES = [
  {
    href: "/docs/installation",
    title: "Installation",
    description: "Copy the form-builder/ folder into your app, add the shadcn primitives it depends on, and register the built-in fields.",
  },
  {
    href: "/docs/your-first-form",
    title: "Your first form",
    description: "A minimal FormConfig — two fields and a submit button — rendered live, plus what you get for free.",
  },
  {
    href: "/docs/field-types",
    title: "Field types",
    description: "Every built-in field type the registry ships, generated from the package's own type list so it can't drift.",
  },
] as const;

/**
 * Docs hub. The engine (form-builder/) is the product; these three pages
 * cover adopting it in your own app. Conditions, wizards, and cross-field
 * wiring are demonstrated live under /examples rather than duplicated here.
 */
export default function DocsIndexPage() {
  return (
    <div className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">Docs</h1>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          The engine is copy-in code you own, not a hosted widget — same model as shadcn/ui. Start with{" "}
          <Link href="/docs/installation" className="underline underline-offset-2 hover:text-foreground">
            Installation
          </Link>
          , then build{" "}
          <Link href="/docs/your-first-form" className="underline underline-offset-2 hover:text-foreground">
            your first form
          </Link>
          . For conditional fields, multi-step wizards, and cross-field wiring in action, see{" "}
          <Link href="/examples" className="underline underline-offset-2 hover:text-foreground">
            Examples
          </Link>
          .
        </p>
      </div>

      <ul className="flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
        {PAGES.map((page) => (
          <li key={page.href}>
            <Link
              href={page.href}
              className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border bg-card p-[16px] tablet:p-[16px] desktop:p-[16px] transition-colors hover:border-foreground/30 focus-visible:border-foreground focus-visible:outline-none"
            >
              <span className="text-[15px] tablet:text-[15px] desktop:text-[15px] font-medium text-card-foreground">
                {page.title}
              </span>
              <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
                {page.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
        The full config schema and design rationale live in{" "}
        <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
          form-builder-spec.md
        </code>{" "}
        at the repo root.
      </p>
    </div>
  );
}
