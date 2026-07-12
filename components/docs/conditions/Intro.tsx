import { DocsIntro, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { t } from "@/locales";

export function Intro() {
  return (
    <DocsIntro title={t.docs.nav.pages.conditions}>
      Any field can react to another field&apos;s value — or, for disabling, another field&apos;s{" "}
      <em>validity</em> — via <IC>visibleWhen</IC>, <IC>disabledWhen</IC>, and <IC>enabledWhen</IC>. All three
      take the same <IC>ConditionSpec</IC> shape; what differs is what happens when the condition matches.
    </DocsIntro>
  );
}
