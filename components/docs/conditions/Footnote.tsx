import Link from "next/link";
import { DocsFootnote, DocsInlineCode as IC } from "@/components/docs/DocsProse";

export function Footnote() {
  return (
    <DocsFootnote>
      For a fuller demo combining <IC>visibleWhen</IC>, <IC>optionsFrom</IC>, and phone <IC>countryFrom</IC> in
      one form, see{" "}
      <Link href="/examples/conditional-profile" className="underline underline-offset-2 hover:text-foreground">
        the conditional profile example
      </Link>
      . For conditions on entire wizard steps, see{" "}
      <Link href="/docs/wizards" className="underline underline-offset-2 hover:text-foreground">
        Multi-step wizards
      </Link>
      .
    </DocsFootnote>
  );
}
