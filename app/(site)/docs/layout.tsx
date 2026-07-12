import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { DocsBreadcrumb } from "@/components/docs/DocsBreadcrumb";
import { DOCS_CONTAINER } from "@/components/shared/containers";
import { cn } from "@/lib/utils";

/**
 * nextjs.org-docs-like shell: a grouped/sticky sidebar (DocsSidebar
 * collapses to a horizontal link row below `desktop:`), a comfortable-
 * measure content column, and (per-page, see below) a right "on this page"
 * TOC rail. SiteNav is rendered by the shared `app/(site)/layout.tsx`
 * group layout. Stays a Server Component — only the nav pieces that need
 * usePathname are client leaves.
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
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        DOCS_CONTAINER,
        "flex flex-1 flex-col desktop:flex-row items-start gap-0 tablet:gap-0 desktop:gap-[2.08vw]",
      )}
    >
      <DocsSidebar />
      <main
        id="main-content"
        className="min-w-0 w-full flex-1 py-[7.476vw] tablet:py-[4.5vw] desktop:py-[2.496vw]"
      >
        <DocsBreadcrumb />
        {children}
        <div className="desktop:max-w-[37.44vw]">
          <DocsPagination />
        </div>
      </main>
    </div>
  );
}
