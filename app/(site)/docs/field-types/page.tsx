import type { Metadata } from "next";
import Link from "next/link";
import { BUILT_IN_FIELD_TYPES } from "@/form-builder";
import { DocsIntro, DocsFootnote, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import type { TocItem } from "@/components/docs/DocsToc";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.fieldTypes };

// No H2 sections on this page (it's one reference table) — empty TOC_ITEMS
// so DocsToc renders null, same null-guard pattern as DocsPagination.
const TOC_ITEMS: TocItem[] = [];

/**
 * Reference table of every built-in field type. The row list itself comes
 * from BUILT_IN_FIELD_TYPES (the package's own source of truth), so it can't
 * drift from the registry. Per-type label/description/note come from
 * locales/en/fieldTypes.ts — the single copy source shared with the visual
 * builder's add-field menu (from slice 5 onward); that dictionary is a
 * complete Record<FieldType, ...> (TS-enforced), so there's no fallback path
 * here the way the old page-local FIELD_TYPE_INFO needed one.
 */
export default function FieldTypesPage() {
  return (
    <DocsPageShell toc={TOC_ITEMS} gap="20">
      <DocsIntro title={t.docs.nav.pages.fieldTypes}>
        {BUILT_IN_FIELD_TYPES.length} built-in types, registered by <IC>registerBuiltInFields()</IC>. Every
        field also takes the shared base properties — <IC>label</IC>, <IC>required</IC>, <IC>visibleWhen</IC>/
        <IC>disabledWhen</IC>, and <IC>width</IC> — not repeated per row below.
      </DocsIntro>

      <div
        tabIndex={0}
        aria-label="Field types table"
        className="overflow-x-auto rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border"
      >
        <table className="w-full min-w-[560px] tablet:min-w-[560px] desktop:min-w-[560px] border-collapse text-left text-[13px] tablet:text-[13px] desktop:text-[13px]">
          <thead>
            <tr className="border-b border-border bg-card">
              <th
                scope="col"
                className="w-[110px] tablet:w-[110px] desktop:w-[110px] px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] font-medium text-card-foreground"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] font-medium text-card-foreground"
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {BUILT_IN_FIELD_TYPES.map((type) => {
              const info = t.fieldTypes[type];
              return (
                <tr key={type} className="border-b border-border last:border-b-0">
                  <td className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] align-top font-mono text-[12.5px] tablet:text-[12.5px] desktop:text-[12.5px]">
                    {type}
                  </td>
                  <td className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] align-top text-muted-foreground">
                    <p>{info.description}</p>
                    {info.note && (
                      <p className="mt-[4px] tablet:mt-[4px] desktop:mt-[4px] text-[12px] tablet:text-[12px] desktop:text-[12px]">
                        {info.note}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DocsFootnote>
        For the exact per-type config shape (which properties each type accepts), see the <IC>FieldConfig</IC>{" "}
        union in <IC>form-builder/core/types.ts</IC>, or a working config for several of these under{" "}
        <Link href="/examples" className="underline underline-offset-2 hover:text-foreground">
          Examples
        </Link>
        .
      </DocsFootnote>
    </DocsPageShell>
  );
}
