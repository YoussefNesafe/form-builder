import Link from "next/link";
import { DocsFootnote, DocsInlineCode as IC } from "@/components/docs/DocsProse";

export function Footnote() {
  return (
    <DocsFootnote>
      See <IC>form-builder/core/defineForm.ts</IC> and <IC>form-builder/core/inferValues.ts</IC> for the full
      mapping (pinned by <IC>expectTypeOf</IC> type tests, one per table row). For the server-side half of this —
      the typed <IC>parseSubmission</IC> result and the <IC>createFormAction</IC> wire — see{" "}
      <Link href="/docs/submit-to-backend" className="underline underline-offset-2 hover:text-foreground">
        Submit to backend
      </Link>
      . Name-reference constraints (typo-checking a <IC>Condition.field</IC> or <IC>dependsOn</IC> target against
      real field names) are a deferred follow-up — <IC>validateFormConfig</IC> catches those at dev-time meanwhile,
      per{" "}
      <Link href="/docs/conditions" className="underline underline-offset-2 hover:text-foreground">
        Conditions
      </Link>
      .
    </DocsFootnote>
  );
}
