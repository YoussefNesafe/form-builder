import { SiteNav } from "@/components/site/SiteNav";

/**
 * Shell for the docs section — content pages slot into `children`. Empty
 * beyond the placeholder index for now; a docs agent fills real pages next.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[860px] tablet:max-w-[860px] desktop:max-w-[860px] flex-1 px-[16px] tablet:px-[24px] desktop:px-[32px] py-[32px] tablet:py-[40px] desktop:py-[48px]"
      >
        {children}
      </main>
    </div>
  );
}
