import { t } from "@/locales";
import { LandingDemoForm } from "./LandingDemoForm";
import { SectionHeading } from "./SectionHeading";

export function DemoSection() {
  return (
    <section className="flex flex-col items-center gap-[16px] tablet:gap-[16px] desktop:gap-[16px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]">
      <div className="flex flex-col items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] text-center">
        <SectionHeading center={false}>{t.home.demo.title}</SectionHeading>
        <p className="max-w-[480px] tablet:max-w-[480px] desktop:max-w-[480px] text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          {t.home.demo.subtitle}
        </p>
      </div>
      <div className="w-full max-w-[640px] tablet:max-w-[640px] desktop:max-w-[640px] rounded-[16px] tablet:rounded-[16px] desktop:rounded-[16px] border border-border bg-card p-[24px] tablet:p-[32px] desktop:p-[32px]">
        <LandingDemoForm />
      </div>
      <p className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">{t.home.demo.footnote}</p>
    </section>
  );
}
