import { DocsIntro, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { t } from "@/locales";

export function Intro() {
  return (
    <DocsIntro title={t.docs.nav.pages.yourFirstForm}>
      A <IC>FormConfig</IC> is a plain object — no builder, no schema file to hand-write separately. This one
      has two fields and a submit button.
    </DocsIntro>
  );
}
