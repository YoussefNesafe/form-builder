import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";

const CARDS = [
  {
    href: "/builder",
    title: "Builder",
    description: "Drag fields onto a canvas, wire up conditions and rules, then export a typed FormConfig.",
  },
  {
    href: "/examples",
    title: "Examples",
    description: "Live, working forms — a multi-step wizard, conditional fields, and advanced field types.",
  },
  {
    href: "/docs",
    title: "Docs",
    description: "Field reference, config schema, and how to adopt the engine in your own app.",
  },
] as const;

/**
 * Minimal hub, not the marketing page (that arrives in Phase 2). Server
 * Component throughout — three link cards, no interactivity.
 */
export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-[1080px] tablet:max-w-[1080px] desktop:max-w-[1080px] flex-1 flex-col justify-center gap-[32px] tablet:gap-[32px] desktop:gap-[32px] px-[16px] tablet:px-[24px] desktop:px-[32px] py-[48px] tablet:py-[64px] desktop:py-[80px]"
      >
        <div className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
          <h1 className="text-[28px] tablet:text-[32px] desktop:text-[36px] font-semibold tracking-tight">
            Form Builder
          </h1>
          <p className="max-w-[560px] tablet:max-w-[560px] desktop:max-w-[560px] text-[15px] tablet:text-[15px] desktop:text-[15px] text-muted-foreground">
            Design forms visually, ship real React code — a Zod- and React Hook Form–validated engine you copy
            into your project and own, not a hosted widget.
          </p>
        </div>

        <div className="grid grid-cols-1 tablet:grid-cols-3 desktop:grid-cols-3 gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border bg-card p-[20px] tablet:p-[20px] desktop:p-[20px] transition-colors hover:border-foreground/30 focus-visible:border-foreground focus-visible:outline-none"
            >
              <span className="text-[15px] tablet:text-[15px] desktop:text-[15px] font-medium text-card-foreground">
                {card.title}
              </span>
              <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
                {card.description}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
