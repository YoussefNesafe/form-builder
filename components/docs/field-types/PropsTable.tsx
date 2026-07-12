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
      className="overflow-x-auto rounded-[3.204vw] tablet:rounded-[1.5vw] desktop:rounded-[0.624vw] border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <table className="w-full min-w-[149.52vw] tablet:min-w-[70vw] desktop:min-w-[29.12vw] border-collapse text-left text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw]">
        <thead>
          <tr className="border-b border-border bg-card">
            <th
              scope="col"
              className="w-[29.37vw] tablet:w-[13.75vw] desktop:w-[5.72vw] px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] font-medium text-card-foreground"
            >
              Name
            </th>
            <th
              scope="col"
              className="w-[42.72vw] tablet:w-[20vw] desktop:w-[8.32vw] px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] font-medium text-card-foreground"
            >
              Type
            </th>
            <th
              scope="col"
              className="w-[24.03vw] tablet:w-[11.25vw] desktop:w-[4.68vw] px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] font-medium text-card-foreground"
            >
              Required
            </th>
            <th
              scope="col"
              className="px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] font-medium text-card-foreground"
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
                className="px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] align-top font-mono font-normal text-left text-[3.338vw] tablet:text-[1.563vw] desktop:text-[0.65vw]"
              >
                {row.name}
              </th>
              <td className="px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] align-top font-mono text-[3.338vw] tablet:text-[1.563vw] desktop:text-[0.65vw] text-muted-foreground">
                {row.type}
              </td>
              <td className="px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] align-top text-muted-foreground">
                {row.required ? "Required" : "Optional"}
              </td>
              <td className="px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] align-top text-muted-foreground">
                <p>{row.description}</p>
                {row.exceptions && (
                  <p className="mt-[1.068vw] tablet:mt-[0.5vw] desktop:mt-[0.208vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw]">
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
