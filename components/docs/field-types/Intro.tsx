import { BUILT_IN_FIELD_TYPES } from "@/form-builder";
import { DocsIntro, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { t } from "@/locales";

export function Intro() {
  return (
    <DocsIntro title={t.docs.nav.pages.fieldTypes}>
      {BUILT_IN_FIELD_TYPES.length} built-in types, registered by <IC>registerBuiltInFields()</IC>. Every
      field also takes the shared base properties — <IC>label</IC>, <IC>required</IC>, <IC>visibleWhen</IC>/
      <IC>disabledWhen</IC>, and <IC>width</IC> — not repeated per row below.
    </DocsIntro>
  );
}
