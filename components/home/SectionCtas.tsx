import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/locales";

/**
 * The landing page's recurring CTA pair ("Open the builder" / "Read the
 * docs"), rendered at the end of every section — same labels and hrefs as the
 * hero's pair (shared `t.home.ctas` keys), sized down one step so the hero's
 * `lg` pair stays the loudest instance. `center` follows the section's
 * heading alignment (centered sections center it, left-aligned sections
 * keep it left).
 */
export function SectionCtas({ center = false }: { center?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col tablet:flex-row desktop:flex-row gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]",
        center && "items-center tablet:justify-center desktop:justify-center",
      )}
    >
      <Button asChild variant="brand">
        <Link href="/builder">{t.home.ctas.openBuilder}</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/docs">{t.home.ctas.readDocs}</Link>
      </Button>
    </div>
  );
}
