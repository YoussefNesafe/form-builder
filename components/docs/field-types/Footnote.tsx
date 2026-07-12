import Link from "next/link";
import { DocsFootnote, DocsInlineCode as IC } from "@/components/docs/DocsProse";

export function Footnote() {
  return (
    <DocsFootnote>
      For the exact per-type config shape (which properties each type accepts), see the <IC>FieldConfig</IC>{" "}
      union in <IC>form-builder/core/types.ts</IC>, or a working config for several of these under{" "}
      <Link href="/examples" className="underline underline-offset-2 hover:text-foreground">
        Examples
      </Link>
      .
    </DocsFootnote>
  );
}
