import Link from "next/link";
import { Button } from "@/components/ui/button";
import { t } from "@/locales";
import { landingDemoConfig } from "./demoConfig";
import { LandingDemoForm } from "./LandingDemoForm";

/**
 * Asymmetric split hero: copy + CTAs on the left, the live demo panel on the
 * right. Merges the old Hero + DemoSection — one live FormRenderer is the
 * whole proof, it doesn't need its own section below the fold. Stacks to a
 * single column below desktop (copy first in DOM order, so mobile reads copy
 * above the form without any reordering trick). The panel's mono tab shows
 * `landingDemoConfig.id` — a real value off the config actually rendering
 * inside it, not a made-up label.
 */
export function HeroSection() {
  // hero.title carries a "{accent}" marker where hero.titleAccent (the
  // accent-colored word) is spliced in, so the colored span stays a rendering
  // concern, not a copy concern — the dictionary owns both halves.
  const parts = t.home.hero.title.split("{accent}");
  if (process.env.NODE_ENV !== "production" && parts.length !== 2) {
    console.warn("home.hero.title must contain exactly one {accent} marker");
  }
  const [titleBefore, titleAfter = ""] = parts;

  return (
    <section
      aria-labelledby="hero-heading"
      className="grid grid-cols-1 desktop:grid-cols-[1.05fr_1fr] items-center gap-[40px] tablet:gap-[40px] desktop:gap-[56px] py-[64px] tablet:py-[96px] desktop:py-[120px]"
    >
      <div className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px]">
        <h1
          id="hero-heading"
          className="text-[36px] tablet:text-[48px] desktop:text-[56px] font-semibold tracking-[-1.2px] tablet:tracking-[-2px] desktop:tracking-[-3.4px]"
        >
          {titleBefore}
          <span className="text-accent-brand">{t.home.hero.titleAccent}</span>
          {titleAfter}
        </h1>
        <p className="max-w-[480px] tablet:max-w-[480px] desktop:max-w-[480px] text-[16px] tablet:text-[17px] desktop:text-[18px] leading-[26px] tablet:leading-[27px] desktop:leading-[29px] text-muted-foreground">
          {t.home.hero.subtitle}
        </p>
        <div className="flex flex-col tablet:flex-row desktop:flex-row gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
          <Button asChild variant="brand" size="lg">
            <Link href="/builder">{t.home.ctas.openBuilder}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/docs">{t.home.ctas.readDocs}</Link>
          </Button>
        </div>
      </div>
      <div className="rounded-[16px] tablet:rounded-[16px] desktop:rounded-[16px] border border-border bg-card overflow-hidden">
        <div className="flex items-center border-b border-border px-[10px] tablet:px-[10px] desktop:px-[10px] pt-[8px] tablet:pt-[8px] desktop:pt-[8px]">
          <span className="rounded-t-[6px] tablet:rounded-t-[6px] desktop:rounded-t-[6px] border border-b-0 border-border bg-background px-[10px] tablet:px-[10px] desktop:px-[10px] py-[6px] tablet:py-[6px] desktop:py-[6px] text-[12px] tablet:text-[12px] desktop:text-[12px] font-mono text-foreground">
            {landingDemoConfig.id}
          </span>
        </div>
        <div className="p-[20px] tablet:p-[24px] desktop:p-[24px]">
          <h2 className="sr-only">{t.home.hero.panelHeading}</h2>
          <LandingDemoForm />
        </div>
      </div>
    </section>
  );
}
