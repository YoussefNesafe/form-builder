import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DocsSection,
  DocsBody as P,
  DocsInlineCode as IC,
} from "@/components/docs/DocsProse";
import {
  FORM_BUILDER_ZIP_BASENAME,
  FORM_BUILDER_ZIP_PUBLIC_PATH,
} from "@/scripts/zipConfig.mjs";

const id = "copy-package-folder";
const title = "Copy the package folder";

function Section() {
  return (
    <DocsSection id={id} title="6. Copy the package folder (manual fallback)">
      <P>
        Prefer not to run the CLI above — or can&apos;t, since it isn&apos;t published outside this repo yet?
        Copy the source in by hand instead; it&apos;s the same flow this page taught before the CLI existed. It
        doesn&apos;t get the single-folder self-containment or import-rewriting from the steps above: the copied{" "}
        <IC>form-builder/</IC> folder keeps its own <IC>@/</IC> aliases as-is, so it needs to be reachable via a{" "}
        <IC>@/form-builder</IC> (or equivalent) alias in your own <IC>tsconfig.json</IC>, and the shadcn primitives
        stay wherever your own <IC>components/ui/</IC> already lives instead of being vendored alongside it.
      </P>
      <P>
        Copy the <IC>form-builder/</IC> folder into your Next.js project as-is.
        It has no dependency on anything else in this repo —{" "}
        <IC>components/ui/</IC> (below) and the peer packages it imports.
      </P>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="tablet:w-fit py-[7vw] tablet:px-[2vw] tablet:py-[2.5vw] desktop:px-[1vw] desktop:py-[1.2vw]"
      >
        <a href={FORM_BUILDER_ZIP_PUBLIC_PATH} download>
          <Download />
          Download {FORM_BUILDER_ZIP_BASENAME}
        </a>
      </Button>
    </DocsSection>
  );
}

export const CopyPackageFolderSection = { id, title, Section };
