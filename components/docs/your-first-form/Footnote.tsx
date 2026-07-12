import Link from "next/link";
import { DocsFootnote } from "@/components/docs/DocsProse";

export function Footnote() {
  return (
    <DocsFootnote>
      Conditional fields, multi-step wizards, and cross-field rules aren&apos;t covered here — see{" "}
      <Link href="/examples" className="underline underline-offset-2 hover:text-foreground">
        Examples
      </Link>{" "}
      for those working live. For the full list of field types, see{" "}
      <Link href="/docs/field-types" className="underline underline-offset-2 hover:text-foreground">
        Field types
      </Link>
      .
    </DocsFootnote>
  );
}
