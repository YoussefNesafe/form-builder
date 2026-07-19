import Link from "next/link";
import { DocsFootnote, DocsInlineCode as IC } from "@/components/docs/DocsProse";

export function Footnote() {
  return (
    <DocsFootnote>
      See <IC>form-builder/core/parseSubmission.ts</IC> for the full step-by-step contract (the order of its 12
      steps is itself the security property), and{" "}
      <Link href="/docs/wizards" className="underline underline-offset-2 hover:text-foreground">
        Multi-step wizards
      </Link>{" "}
      for the client-side <IC>otp</IC>/<IC>dependsOn</IC> wiring this recipe&apos;s server side pairs with, worked
      through in{" "}
      <Link href="/examples/multi-step-signup" className="underline underline-offset-2 hover:text-foreground">
        the multi-step signup example
      </Link>
      . ADR-0004 records the pinned rulings behind this design (sync-not-async, fail-closed otp, its two size
      limits, disclosure via <IC>unvalidated</IC> instead of a fail-closed custom-type gate).
    </DocsFootnote>
  );
}
