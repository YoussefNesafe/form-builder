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
    <DocsSection id={id} title="1. Copy the package folder">
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
