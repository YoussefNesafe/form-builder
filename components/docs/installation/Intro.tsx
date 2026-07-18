import { DocsIntro } from "@/components/docs/DocsProse";
import { t } from "@/locales";

export function Intro() {
  return (
    <DocsIntro title={t.docs.nav.pages.installation}>
      The engine is copy-in, not an npm package — the same model as shadcn/ui. A one-command installer copies the
      source into your own Next.js project and rewrites it to be self-contained, or copy it in by hand — either
      way you own it from that point on; there is no runtime dependency on this repo.
    </DocsIntro>
  );
}
