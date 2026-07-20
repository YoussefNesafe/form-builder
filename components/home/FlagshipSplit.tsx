import dynamic from "next/dynamic";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { t } from "@/locales";
import { FLAGSHIP_CODE } from "./generatedCode";
import { SectionCtas } from "./SectionCtas";
import { SectionHeading } from "./SectionHeading";

const FlagshipSignupForm = dynamic(
  () => import("./FlagshipSignupForm").then((mod) => mod.FlagshipSignupForm),
  {
    ssr: true,
    loading: () => (
      <p role="status" className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">
        {t.home.flagship.previewLoading}
      </p>
    ),
  },
);

export function FlagshipSplit() {
  return (
    <section
      aria-labelledby="flagship-heading"
      className="flex flex-col gap-[4.272vw] tablet:gap-[2vw] desktop:gap-[0.832vw] pb-[17.088vw] tablet:pb-[12vw] desktop:pb-[6.24vw]"
    >
      <SectionHeading id="flagship-heading" center={false}>
        {t.home.flagship.title}
      </SectionHeading>
      <p className="text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] text-muted-foreground">
        {t.home.flagship.intro}
      </p>
      <div className="rounded-[4.272vw] tablet:rounded-[2vw] desktop:rounded-[0.832vw] border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-[0.534vw] tablet:gap-[0.25vw] desktop:gap-[0.104vw] border-b border-border px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] pt-[2.136vw] tablet:pt-[1vw] desktop:pt-[0.416vw]">
          <span className="rounded-t-[1.602vw] tablet:rounded-t-[0.75vw] desktop:rounded-t-[0.312vw] border border-b-0 border-border bg-background px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] py-[1.602vw] tablet:py-[0.75vw] desktop:py-[0.312vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] font-mono text-foreground">
            {t.home.flagship.codeTabLabel}
          </span>
          <span className="rounded-t-[1.602vw] tablet:rounded-t-[0.75vw] desktop:rounded-t-[0.312vw] px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] py-[1.602vw] tablet:py-[0.75vw] desktop:py-[0.312vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] font-mono text-muted-foreground">
            {t.home.flagship.previewTabLabel}
          </span>
        </div>
        <div className="grid grid-cols-1 desktop:grid-cols-2">
          <div className="border-b desktop:border-b-0 desktop:border-r border-accent-brand p-[5.34vw] tablet:p-[2.5vw] desktop:p-[1.248vw]">
            <h3 className="sr-only">{t.home.flagship.codeHeading}</h3>
            <CodeBlock
              code={FLAGSHIP_CODE}
              label={t.home.flagship.codeAriaLabel}
              className="max-h-[112.14vw] tablet:max-h-[52.5vw] desktop:max-h-[24.96vw] overflow-y-auto"
            />
          </div>
          <div className="p-[5.34vw] tablet:p-[2.5vw] desktop:p-[1.248vw]">
            <h3 className="sr-only">{t.home.flagship.previewHeading}</h3>
            <FlagshipSignupForm />
          </div>
        </div>
      </div>
      <SectionCtas />
    </section>
  );
}
