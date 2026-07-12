import { BUILT_IN_FIELD_TYPES } from "@/form-builder";
import { DocsIntro, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { t } from "@/locales";

export function Intro() {
  return (
    <DocsIntro title={t.docs.nav.pages.fieldTypes}>
      {BUILT_IN_FIELD_TYPES.length} built-in types, registered by <IC>registerBuiltInFields()</IC>. Every
      field also takes the shared base properties — <IC>label</IC>, <IC>required</IC>, <IC>visibleWhen</IC>/
      <IC>disabledWhen</IC>, and <IC>width</IC> — covered once in{" "}
      <a
        href="#base-props"
        className="underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        Base props
      </a>{" "}
      below, not repeated per type.
    </DocsIntro>
  );
}
