import { SiteNav } from "@/components/site/SiteNav";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsPagination } from "@/components/docs/DocsPagination";

/**
 * nextjs.org-docs-like shell: SiteNav on top, a grouped/sticky sidebar
 * (DocsSidebar collapses to a horizontal link row below `desktop:`), and a
 * comfortable-measure content column. Stays a Server Component — only the
 * two nav pieces that need usePathname are client leaves.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto flex w-full max-w-[1180px] tablet:max-w-[1180px] desktop:max-w-[1180px] flex-1 flex-col desktop:flex-row items-start gap-0 tablet:gap-0 desktop:gap-[40px] px-[16px] tablet:px-[24px] desktop:px-[32px]">
        <DocsSidebar />
        <main
          id="main-content"
          className="min-w-0 w-full flex-1 py-[28px] tablet:py-[36px] desktop:py-[48px]"
        >
          <div className="mx-auto w-full max-w-[720px] tablet:max-w-[720px] desktop:max-w-[720px]">
            {children}
            <DocsPagination />
          </div>
        </main>
      </div>
    </div>
  );
}
