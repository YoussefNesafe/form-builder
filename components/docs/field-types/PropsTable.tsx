/**
 * Shared Name/Type/Required/Description table — the per-type prop tables
 * (24, one per FieldType, via FieldTypeSection's factory) and the Base props
 * table are the same shape, so this is the second-duplication extraction
 * (AGENTS.md YAGNI rule). `exceptions`, when present on a row, is
 * base-props-only (per-type rows never set it) — rendered as a second,
 * smaller line under the description.
 */
export type PropRow = {
  name: string;
  type: string;
  required: boolean;
  description: string;
  exceptions?: string;
};

export function PropsTable({ rows, label }: { rows: PropRow[]; label: string }) {
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={label}
      className="overflow-x-auto rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <table className="w-full min-w-[560px] tablet:min-w-[560px] desktop:min-w-[560px] border-collapse text-left text-[13px] tablet:text-[13px] desktop:text-[13px]">
        <thead>
          <tr className="border-b border-border bg-card">
            <th
              scope="col"
              className="w-[110px] tablet:w-[110px] desktop:w-[110px] px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] font-medium text-card-foreground"
            >
              Name
            </th>
            <th
              scope="col"
              className="w-[160px] tablet:w-[160px] desktop:w-[160px] px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] font-medium text-card-foreground"
            >
              Type
            </th>
            <th
              scope="col"
              className="w-[90px] tablet:w-[90px] desktop:w-[90px] px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] font-medium text-card-foreground"
            >
              Required
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
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border last:border-b-0">
              <th
                scope="row"
                className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] align-top font-mono font-normal text-left text-[12.5px] tablet:text-[12.5px] desktop:text-[12.5px]"
              >
                {row.name}
              </th>
              <td className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] align-top font-mono text-[12.5px] tablet:text-[12.5px] desktop:text-[12.5px] text-muted-foreground">
                {row.type}
              </td>
              <td className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] align-top text-muted-foreground">
                {row.required ? "Required" : "Optional"}
              </td>
              <td className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] align-top text-muted-foreground">
                <p>{row.description}</p>
                {row.exceptions && (
                  <p className="mt-[4px] tablet:mt-[4px] desktop:mt-[4px] text-[12px] tablet:text-[12px] desktop:text-[12px]">
                    {row.exceptions}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
