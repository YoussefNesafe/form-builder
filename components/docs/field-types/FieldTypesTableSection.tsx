import { BUILT_IN_FIELD_TYPES } from "@/form-builder";
import { t } from "@/locales";

/**
 * Reference table of every built-in field type. The row list itself comes
 * from BUILT_IN_FIELD_TYPES (the package's own source of truth), so it can't
 * drift from the registry. Per-type label/description/note come from
 * locales/en/fieldTypes.ts — the single copy source shared with the visual
 * builder's add-field menu (from slice 5 onward); that dictionary is a
 * complete Record<FieldType, ...> (TS-enforced), so there's no fallback path
 * here the way the old page-local FIELD_TYPE_INFO needed one.
 *
 * No <DocsSection>/heading here — the page has no TOC (see ./sections.ts) so
 * this is composed directly by page.tsx like Intro/Footnote, not through the
 * SECTIONS registry.
 */
export function FieldTypesTableSection() {
  return (
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
  );
}
