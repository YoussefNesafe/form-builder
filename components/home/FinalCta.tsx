import Link from "next/link";
import { Button } from "@/components/ui/button";
import { t } from "@/locales";
import { SectionHeading } from "./SectionHeading";

export function FinalCta() {
  return (
    <section className="flex flex-col items-center gap-[20px] tablet:gap-[20px] desktop:gap-[20px] border-t border-border py-[64px] tablet:py-[80px] desktop:py-[96px] text-center">
      <SectionHeading>{t.home.finalCta.title}</SectionHeading>
      <Button asChild variant="brand" size="lg">
        <Link href="/builder">{t.home.finalCta.cta}</Link>
      </Button>
    </section>
  );
}
