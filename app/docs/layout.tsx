import { SiteNav } from "@/components/site/SiteNav";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { DocsBreadcrumb } from "@/components/docs/DocsBreadcrumb";

/**
 * nextjs.org-docs-like shell: SiteNav on top, a grouped/sticky sidebar
 * (DocsSidebar collapses to a horizontal link row below `desktop:`), a
 * comfortable-measure content column, and (per-page, see below) a right
 * "on this page" TOC rail. Stays a Server Component — only the nav pieces
 * that need usePathname are client leaves.
 *
 * The TOC rail is rendered *inside* each page (via `<DocsToc items={...}/>`)
 * rather than here, because its items are a static per-page list (spec
 * §5.1) that only the page itself knows. Each page wraps its own prose in a
 * `flex desktop:flex-row` row with `<DocsToc>` as the second child, so it
 * lands as a flex sibling of the prose column at `desktop:`. Pagination
 * stays rendered once here (so no page file has to remember it) but is
 * width-capped to the 720px prose column so it doesn't stretch under the
 * TOC's column too.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto flex w-full max-w-[1180px] tablet:max-w-[1180px] desktop:max-w-[1320px] flex-1 flex-col desktop:flex-row items-start gap-0 tablet:gap-0 desktop:gap-[40px] px-[16px] tablet:px-[24px] desktop:px-[32px]">
        <DocsSidebar />
        <main
          id="main-content"
          className="min-w-0 w-full flex-1 py-[28px] tablet:py-[36px] desktop:py-[48px]"
        >
          <DocsBreadcrumb />
          {children}
          <div className="desktop:max-w-[720px]">
            <DocsPagination />
          </div>
        </main>
      </div>
    </div>
  );
}
