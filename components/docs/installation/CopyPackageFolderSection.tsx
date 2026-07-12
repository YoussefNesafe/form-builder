import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "copy-package-folder";
const title = "Copy the package folder";

function Section() {
  return (
    <DocsSection id={id} title="1. Copy the package folder">
      <P>
        Copy the <IC>form-builder/</IC> folder into your Next.js project as-is. It has no dependency on anything
        else in this repo — <IC>components/ui/</IC> (below) and the peer packages it imports.
      </P>
    </DocsSection>
  );
}

export const CopyPackageFolderSection = { id, title, Section };
