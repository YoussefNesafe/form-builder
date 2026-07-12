import Link from "next/link";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Button } from "@/components/ui/button";
import { t } from "@/locales";
import { FINAL_CTA_CODE } from "./generatedCode";
import { SectionHeading } from "./SectionHeading";

/**
 * Closing band: ownership angle, distinct from the hero headline. The
 * snippet is FINAL_CTA_CODE (see generatedCode.ts) — the real serialized
 * output of the same landingDemoConfig running live in the hero panel above,
 * with the docs installation page's copy-button CodeBlock pattern (`copy`).
 */
export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="flex flex-col items-center gap-[24px] tablet:gap-[24px] desktop:gap-[24px] border-t border-border py-[64px] tablet:py-[80px] desktop:py-[96px] text-center"
    >
      <SectionHeading id="final-cta-heading">{t.home.finalCta.title}</SectionHeading>
      <Button asChild variant="brand" size="lg">
        <Link href="/builder">{t.home.finalCta.cta}</Link>
      </Button>
      <div className="w-full max-w-[560px] tablet:max-w-[560px] desktop:max-w-[560px] text-left">
        <CodeBlock
          code={FINAL_CTA_CODE}
          label={t.home.finalCta.snippetAriaLabel}
          copy
          copyLabel={t.home.finalCta.snippetCopyLabel}
        />
      </div>
    </section>
  );
}
