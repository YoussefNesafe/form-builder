import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "value-type-mapping";
const title = "Value-type mapping";

type Row = { fieldTypes: string; valueType: string; notes: string };

const ROWS: Row[] = [
  {
    fieldTypes:
      "text, email, textarea, password, masked, otp, phone, country, radio, segmented, signature, date, time",
    valueType: "string",
    notes: "date here means the default (non-range) shape — see the date row below for range: true.",
  },
  { fieldTypes: "number, slider, rating", valueType: "number", notes: "" },
  {
    fieldTypes: "checkbox, switch",
    valueType: "boolean",
    notes: "the field has no options array — a single on/off toggle.",
  },
  {
    fieldTypes: "checkbox, switch",
    valueType: "string[]",
    notes: "the field has an options array — a checkbox group or multi-switch.",
  },
  { fieldTypes: "select", valueType: "string", notes: "default (single-select)." },
  { fieldTypes: "select", valueType: "string[]", notes: "multiple: true." },
  {
    fieldTypes: "date",
    valueType: "[string, string]",
    notes: "range: true — a [from, to] tuple of yyyy-MM-dd strings.",
  },
  { fieldTypes: "file", valueType: "File | File[]", notes: "default (single)." },
  { fieldTypes: "file", valueType: "File[]", notes: "multiple: true." },
  {
    fieldTypes: "group",
    valueType: "Array<row>",
    notes: "one inferred object per row, using this same table recursively over the group's own fields.",
  },
  {
    fieldTypes: "hidden",
    valueType: "typeof field.value",
    notes: "carries the field's own value literal through unchanged.",
  },
  {
    fieldTypes: "custom (registerField)",
    valueType: "unknown",
    notes: "the engine can't know a registered type's shape — see “Custom field types” below.",
  },
  {
    fieldTypes: "static, submit",
    valueType: "— (no key)",
    notes: "layout-only fields; never part of the payload.",
  },
];

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        <IC>FieldValue</IC> maps a single field&apos;s <IC>type</IC> (and, for a few types, a discriminating prop like{" "}
        <IC>multiple</IC> or <IC>range</IC>) to its value type. <IC>InferValues</IC> walks every field in{" "}
        <IC>config.fields</IC> and keys the result by <IC>name</IC>.
      </P>
      <div
        tabIndex={0}
        role="group"
        aria-label="Field type to value type mapping"
        className="overflow-x-auto rounded-[3.204vw] tablet:rounded-[1.5vw] desktop:rounded-[0.624vw] border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <table className="w-full min-w-[186.9vw] tablet:min-w-[87.5vw] desktop:min-w-[36.4vw] border-collapse text-left text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw]">
          <thead>
            <tr className="border-b border-border bg-card">
              <th
                scope="col"
                className="w-[62.3vw] tablet:w-[29.17vw] desktop:w-[12.13vw] px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] font-medium text-card-foreground"
              >
                Field type(s)
              </th>
              <th
                scope="col"
                className="w-[34.43vw] tablet:w-[16.25vw] desktop:w-[6.76vw] px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] font-medium text-card-foreground"
              >
                Value type
              </th>
              <th
                scope="col"
                className="px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] font-medium text-card-foreground"
              >
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, index) => (
              <tr key={`${row.fieldTypes}-${row.valueType}-${index}`} className="border-b border-border last:border-b-0">
                <th
                  scope="row"
                  className="px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] align-top font-mono font-normal text-left text-[3.338vw] tablet:text-[1.563vw] desktop:text-[0.65vw]"
                >
                  {row.fieldTypes}
                </th>
                <td className="px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] align-top font-mono text-[3.338vw] tablet:text-[1.563vw] desktop:text-[0.65vw] text-muted-foreground">
                  {row.valueType}
                </td>
                <td className="px-[3.738vw] tablet:px-[1.75vw] desktop:px-[0.728vw] py-[2.67vw] tablet:py-[1.25vw] desktop:py-[0.52vw] align-top text-muted-foreground">
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocsSection>
  );
}

export const ValueTypeMappingSection = { id, title, Section };
