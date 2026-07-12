import { DocsIntro, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { t } from "@/locales";

export function Intro() {
  return (
    <DocsIntro title={t.docs.nav.pages.wizards}>
      Add a <IC>steps</IC> array to a <IC>FormConfig</IC> and <IC>FormRenderer</IC> switches from a single
      scrolling form to a stepper: one screen per step, Back/Next navigation, and an optional read-only review
      screen before submit. The fields array is unchanged — steps just assign existing field names to screens.
    </DocsIntro>
  );
}
