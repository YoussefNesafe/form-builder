import { CodeBlock } from "@/components/docs/CodeBlock";
import { t } from "@/locales";
import { CODE_SNIPPET } from "./content";

/** Builder <-> code split (fully grayscale). */
export function BuilderCodeSplit() {
  return (
    <section className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]">
      <div className="grid grid-cols-1 desktop:grid-cols-2 gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
        <div className="flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px] rounded-[16px] tablet:rounded-[16px] desktop:rounded-[16px] border border-border bg-card p-[20px] tablet:p-[24px] desktop:p-[24px]">
          <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            {t.home.split.builderCanvasLabel}
          </span>
          <div
            aria-hidden="true"
            className="flex flex-1 flex-col justify-center gap-[10px] tablet:gap-[10px] desktop:gap-[10px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-dashed border-border p-[16px] tablet:p-[20px] desktop:p-[20px]"
          >
            {t.home.builderChips.map((chip) => (
              <div
                key={chip}
                className="rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border border-border bg-muted px-[12px] tablet:px-[12px] desktop:px-[12px] py-[8px] tablet:py-[8px] desktop:py-[8px] text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground"
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px] rounded-[16px] tablet:rounded-[16px] desktop:rounded-[16px] border border-border bg-card p-[20px] tablet:p-[24px] desktop:p-[24px]">
          <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            {t.home.split.exportedCodeLabel}
          </span>
          <CodeBlock code={CODE_SNIPPET} label={t.home.split.codeBlockLabel} className="flex-1" />
        </div>
      </div>
    </section>
  );
}
