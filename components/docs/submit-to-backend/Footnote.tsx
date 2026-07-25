import Link from "next/link";
import { DocsFootnote, DocsInlineCode as IC } from "@/components/docs/DocsProse";

export function Footnote() {
  return (
    <DocsFootnote>
      See{" "}
      <Link href="/docs/server-validation" className="underline underline-offset-2 hover:text-foreground">
        Server-side validation
      </Link>{" "}
      for the full <IC>parseSubmission</IC> contract this page builds on — the otp fail-closed pattern, file
      uploads, custom field types, and every documented sharp edge apply here unchanged; <IC>createFormAction</IC>{" "}
      and the typed <IC>values</IC> key are additive, not a different code path. See{" "}
      <Link href="/docs/type-safety" className="underline underline-offset-2 hover:text-foreground">
        Type safety
      </Link>{" "}
      for where the <IC>InferValues&lt;typeof config&gt;</IC> shape flowing through this page comes from. ADR-0004
      records the pinned server-validation rulings this design inherits.
    </DocsFootnote>
  );
}
