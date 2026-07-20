import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/locales";

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
