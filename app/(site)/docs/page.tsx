import type { Metadata } from "next";
import Link from "next/link";
import { DOCS_PAGES } from "@/lib/docsNav";
import {
  DocsIntro,
  DocsFootnote,
  DocsInlineCode as IC,
} from "@/components/docs/DocsProse";
import { LinkCard } from "@/components/shared/LinkCard";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.index.title };

const DESCRIPTIONS: Record<string, string> = {
  "/docs/installation": t.docs.index.descriptions.installation,
  "/docs/your-first-form": t.docs.index.descriptions.yourFirstForm,
  "/docs/conditions": t.docs.index.descriptions.conditions,
  "/docs/wizards": t.docs.index.descriptions.wizards,
  "/docs/server-validation": t.docs.index.descriptions.serverValidation,
  "/docs/type-safety": t.docs.index.descriptions.typeSafety,
  "/docs/submit-to-backend": t.docs.index.descriptions.submitToBackend,
  "/docs/field-types": t.docs.index.descriptions.fieldTypes,
};

const PAGES = DOCS_PAGES.filter((page) => page.href !== "/docs").map(
  (page) => ({
    ...page,
    description: DESCRIPTIONS[page.href] ?? "",
  }),
);

export default function DocsIndexPage() {
  return (
    <div className="min-w-0 w-full  flex flex-col gap-[6.408vw] tablet:gap-[3vw] desktop:gap-[1.248vw]">
      <DocsIntro title={t.docs.index.title}>
        {t.docs.index.intro.prefix}
        <Link
          href="/docs/installation"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {t.docs.index.intro.installationLink}
        </Link>
        {t.docs.index.intro.betweenInstallationAndFirstForm}
        <Link
          href="/docs/your-first-form"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {t.docs.index.intro.yourFirstFormLink}
        </Link>
        {t.docs.index.intro.betweenFirstFormAndExamples}
        <Link
          href="/examples"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {t.docs.index.intro.examplesLink}
        </Link>
        {t.docs.index.intro.suffix}
      </DocsIntro>

      <ul className="flex flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
        {PAGES.map((page) => (
          <li key={page.href}>
            <LinkCard
              href={page.href}
              title={page.title}
              description={page.description}
            />
          </li>
        ))}
      </ul>

      <DocsFootnote>
        {t.docs.index.footnote.prefix}
        <IC>{t.docs.index.footnote.formConfig}</IC>
        {t.docs.index.footnote.and}
        <IC>{t.docs.index.footnote.fieldConfig}</IC>
        {t.docs.index.footnote.typesIn}
        <IC>{t.docs.index.footnote.coreTypes}</IC>
        {t.docs.index.footnote.suffix}
      </DocsFootnote>
    </div>
  );
}
