import Link from "next/link";
import { DocsFootnote } from "@/components/docs/DocsProse";

export function Footnote() {
  return (
    <DocsFootnote>
      Next: build{" "}
      <Link href="/docs/your-first-form" className="underline underline-offset-2 hover:text-foreground">
        your first form
      </Link>
      .
    </DocsFootnote>
  );
}
