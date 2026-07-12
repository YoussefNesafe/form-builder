import Link from "next/link";
import { Button } from "@/components/ui/button";
import { t } from "@/locales";

export function HeroSection() {
  // hero.title carries a "{accent}" marker for the accent-colored word so
  // the colored span stays a rendering concern, not a copy concern — the
  // dictionary still owns the full verbatim sentence.
  const parts = t.home.hero.title.split("{accent}");
  if (process.env.NODE_ENV !== "production" && parts.length !== 2) {
    console.warn("home.hero.title must contain exactly one {accent} marker");
  }
  const [titleBefore, titleAfter = ""] = parts;

  return (
    <section className="flex flex-col items-center gap-[24px] tablet:gap-[24px] desktop:gap-[24px] py-[64px] tablet:py-[96px] desktop:py-[120px] text-center">
      <h1 className="text-[36px] tablet:text-[48px] desktop:text-[56px] font-semibold tracking-[-1.2px] tablet:tracking-[-2px] desktop:tracking-[-3.4px]">
        {titleBefore}
        <span className="text-accent-brand">{t.home.hero.titleAccent}</span>
        {titleAfter}
      </h1>
      <p className="max-w-[560px] tablet:max-w-[560px] desktop:max-w-[560px] text-[16px] tablet:text-[17px] desktop:text-[18px] leading-[26px] tablet:leading-[27px] desktop:leading-[29px] text-muted-foreground">
        {t.home.hero.subtitle}
      </p>
      <div className="flex flex-col tablet:flex-row desktop:flex-row gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
        <Button asChild variant="brand" size="lg">
          <Link href="/builder">{t.home.hero.ctaBuilder}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/docs">{t.home.hero.ctaDocs}</Link>
        </Button>
      </div>
    </section>
  );
}
