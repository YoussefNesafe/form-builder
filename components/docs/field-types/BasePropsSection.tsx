import { DocsSection, DocsBody as P } from "@/components/docs/DocsProse";
import { BASE_FIELD_PROPS } from "./fieldProps";
import { PropsTable } from "./PropsTable";

const id = "base-props";
const title = "Base props";

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        Every field type below accepts these 12 on top of its own — documented once here rather than repeated
        per type.
      </P>
      <PropsTable
        label="Base field props"
        rows={BASE_FIELD_PROPS.map((prop) => ({
          name: prop.name,
          type: prop.type,
          required: prop.required,
          description: prop.description,
          exceptions: prop.exceptions,
        }))}
      />
    </DocsSection>
  );
}

export const BasePropsSection = { id, title, Section };
