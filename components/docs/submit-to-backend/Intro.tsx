import { DocsIntro, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { t } from "@/locales";

export function Intro() {
  return (
    <DocsIntro title={t.docs.nav.pages.submitToBackend}>
      Once a config is wrapped in <IC>defineForm</IC>, the same <IC>InferValues&lt;typeof config&gt;</IC> shape
      threads all the way through the wire: <IC>FormRenderer</IC>&apos;s <IC>onSubmit</IC> hands you typed{" "}
      <IC>values</IC>, the server parses the same config with <IC>parseSubmission</IC> (typed the same way), and a
      failure — whether a validation error or one your own handler throws — flows back and lands on the exact field
      that failed. No hand-written type sits between client and server; both read it off the one config.
    </DocsIntro>
  );
}
