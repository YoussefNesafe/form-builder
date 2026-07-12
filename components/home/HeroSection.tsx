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
      className="grid grid-cols-1 desktop:grid-cols-[1.05fr_1fr] items-center gap-[10.68vw] tablet:gap-[5vw] desktop:gap-[2.912vw] py-[17.088vw] tablet:py-[12vw] desktop:py-[6.24vw]"
    >
      <div className="flex flex-col gap-[6.408vw] tablet:gap-[3vw] desktop:gap-[1.248vw]">
        <h1
          id="hero-heading"
          className="text-[9.612vw] tablet:text-[6vw] desktop:text-[2.912vw] font-semibold tracking-[-0.32vw] tablet:tracking-[-0.25vw] desktop:tracking-[-0.177vw]"
        >
          {titleBefore}
          <span className="text-accent-brand">{t.home.hero.titleAccent}</span>
          {titleAfter}
        </h1>
        <p className="max-w-[128.16vw] tablet:max-w-[60vw] desktop:max-w-[24.96vw] text-[4.272vw] tablet:text-[2.125vw] desktop:text-[0.936vw] leading-[6.942vw] tablet:leading-[3.375vw] desktop:leading-[1.508vw] text-muted-foreground">
          {t.home.hero.subtitle}
        </p>
        <div className="flex flex-col tablet:flex-row desktop:flex-row gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
          <Button asChild variant="brand" size="lg">
            <Link href="/builder">{t.home.ctas.openBuilder}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/docs">{t.home.ctas.readDocs}</Link>
          </Button>
        </div>
      </div>
      <div className="rounded-[4.272vw] tablet:rounded-[2vw] desktop:rounded-[0.832vw] border border-border bg-card overflow-hidden">
        <div className="flex items-center border-b border-border px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] pt-[2.136vw] tablet:pt-[1vw] desktop:pt-[0.416vw]">
          <span className="rounded-t-[1.602vw] tablet:rounded-t-[0.75vw] desktop:rounded-t-[0.312vw] border border-b-0 border-border bg-background px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] py-[1.602vw] tablet:py-[0.75vw] desktop:py-[0.312vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] font-mono text-foreground">
            {landingDemoConfig.id}
          </span>
        </div>
        <div className="p-[5.34vw] tablet:p-[3vw] desktop:p-[1.248vw]">
          <h2 className="sr-only">{t.home.hero.panelHeading}</h2>
          <LandingDemoForm />
        </div>
      </div>
    </section>
  );
}
