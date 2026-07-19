import { DocsIntro, DocsInlineCode as IC } from "@/components/docs/DocsProse";
import { t } from "@/locales";

export function Intro() {
  return (
    <DocsIntro title={t.docs.nav.pages.serverValidation}>
      <strong className="text-foreground">The client is not a validator.</strong> A <IC>FormConfig</IC> is public —
      it ships to the browser so <IC>FormRenderer</IC> can read it, which means anyone can read it too and POST
      whatever they want straight to your endpoint, config or no config. <IC>parseSubmission</IC> is the first
      server-side trust boundary this engine has. And just as important:{" "}
      <strong className="text-foreground">it proves shape and rules, never permission.</strong> A structurally
      valid body from user A naming user B&apos;s resource parses clean — authorization is always the host&apos;s
      job, done separately, after parsing.
    </DocsIntro>
  );
}
