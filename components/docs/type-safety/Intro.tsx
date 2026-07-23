import { DocsIntro, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { t } from "@/locales";

export function Intro() {
  return (
    <DocsIntro title={t.docs.nav.pages.typeSafety}>
      A hand-authored <IC>FormConfig</IC> is just data — TypeScript has no way to know that a{" "}
      <IC>{'{ type: "email", name: "email" }'}</IC> field turns into a <IC>string</IC>, or that a{" "}
      <IC>group</IC> turns into an array of rows. <IC>defineForm</IC> closes that gap: wrap a config in it and{" "}
      <IC>InferValues&lt;typeof config&gt;</IC> reads the literal shape back out as a real submit-payload type —
      autocomplete on <IC>values</IC>, a typed <IC>onSubmit</IC>, a typed server-side result. Zero runtime cost;{" "}
      <IC>defineForm</IC> returns its argument unchanged.
    </DocsIntro>
  );
}
