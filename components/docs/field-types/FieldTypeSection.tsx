import type { FieldType } from "@/form-builder";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P } from "@/components/docs/DocsProse";
import { t } from "@/locales";
import { FIELD_PROP_DOCS, FIELD_VALUE_INFO } from "./fieldProps";
import { PropsTable } from "./PropsTable";

export function makeFieldTypeSection(type: FieldType) {
  const id = `field-type-${type}`;
  const info = t.fieldTypes[type];
  const title = info.label;
  const valueInfo = FIELD_VALUE_INFO[type];
  const ownProps: Record<string, { type: string; required: boolean; description: string }> = FIELD_PROP_DOCS[type];
  const rows = Object.entries(ownProps).map(([name, doc]) => ({
    name,
    type: doc.type,
    required: doc.required,
    description: doc.description,
  }));

  function Section() {
    return (
      <DocsSection id={id} title={title}>
        <P>{info.description}</P>
        {info.note && <P>{info.note}</P>}
        <PropsTable label={`${title} props`} rows={rows} />
        <P>
          <strong className="text-foreground">Value:</strong> {valueInfo.valueShape}
        </P>
        <CodeBlock
          code={JSON.stringify(valueInfo.example, null, 2)}
          label={`${title} example config`}
          copy
          copyLabel="config"
        />
      </DocsSection>
    );
  }

  return { id, title, Section };
}
