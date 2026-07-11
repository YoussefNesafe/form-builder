import type { Metadata } from "next";
import Link from "next/link";
import { DOCS_PAGES } from "@/lib/docsNav";
import { DocsH1, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/Prose";

export const metadata: Metadata = { title: "Docs" };

// Descriptions are index-page-only; hrefs/titles/order come from the shared
// nav source so this list can't drift from the sidebar and pagination.
const DESCRIPTIONS: Record<string, string> = {
  "/docs/installation":
    "Copy the form-builder/ folder into your app, add the shadcn primitives it depends on, and register the built-in fields.",
  "/docs/your-first-form":
    "A minimal FormConfig — two fields and a submit button — rendered live, plus what you get for free.",
  "/docs/conditions":
    "visibleWhen, disabledWhen, and enabledWhen — the real Condition operators, the isValid oracle, and the group-nesting limitation.",
  "/docs/wizards":
    "The steps config shape, Next/Back gating, conditional steps, and the read-only review step.",
  "/docs/field-types":
    "Every built-in field type the registry ships, generated from the package's own type list so it can't drift.",
};

const PAGES = DOCS_PAGES.filter((page) => page.href !== "/docs").map((page) => ({
  ...page,
  description: DESCRIPTIONS[page.href] ?? "",
}));

/**
 * Docs hub. The engine (form-builder/) is the product; these three pages
 * cover adopting it in your own app. Conditions, wizards, and cross-field
 * wiring are demonstrated live under /examples rather than duplicated here.
 */
export default function DocsIndexPage() {
  return (
    <div className="min-w-0 w-full desktop:max-w-[720px] flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <DocsH1>Docs</DocsH1>
        <P>
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
        </P>
      </div>

      <ul className="flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
        {PAGES.map((page) => (
          <li key={page.href}>
            <Link
              href={page.href}
              className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border-interactive bg-card p-[16px] tablet:p-[16px] desktop:p-[16px] transition-colors hover:border-border-interactive-hover focus-visible:border-foreground focus-visible:outline-none"
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
        The full config shape is defined by the <IC>FormConfig</IC> and <IC>FieldConfig</IC> types in{" "}
        <IC>form-builder/core/types.ts</IC> — the package&apos;s single source of truth.
      </p>
    </div>
  );
}
