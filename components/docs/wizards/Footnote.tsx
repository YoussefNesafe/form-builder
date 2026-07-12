import Link from "next/link";
import { DocsFootnote, DocsInlineCode as IC } from "@/components/docs/DocsProse";

export function Footnote() {
  return (
    <DocsFootnote>
      For a fuller wizard — confirm-password via <IC>rules.matches</IC>, an email <IC>otp</IC> step with
      cross-step <IC>dependsOn</IC>, then review — see{" "}
      <Link href="/examples/multi-step-signup" className="underline underline-offset-2 hover:text-foreground">
        the multi-step signup example
      </Link>
      .
    </DocsFootnote>
  );
}
